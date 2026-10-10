import { useCallback, useEffect, useMemo, useState } from 'react';
import { dataService } from '../API/api';
import { getApiErrorMessage } from '../API/errors';
import { ManagementFeedback, ManagementPage } from '../components/ManagementUI';
import './Picking.css';

type Task = { id: number; order_id: number; product_id: number; batch_id: number; bin_id: number; assigned_to: number | null; required_quantity: number; status: string };
type Order = { id: number; order_code: string };
type Product = { id: number; sku: string; name: string };
type Batch = { id: number; batch_code: string };
type Location = { id: number; bin_id: number; code: string };
type User = { id: number; username: string; full_name: string | null; role: string };

export default function PickingDistribution() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [batches, setBatches] = useState<Batch[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [productKeyword, setProductKeyword] = useState('');
    const [orderKeyword, setOrderKeyword] = useState('');
    const [assigneeId, setAssigneeId] = useState('');
    const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [taskRows, orderRows, productRows, batchRows, locationRows, userRows] = await Promise.all([
                dataService.getAll<Task>('picking_tasks'),
                dataService.getAll<Order>('outbound_orders'),
                dataService.getAll<Product>('products'),
                dataService.getAll<Batch>('batches'),
                dataService.getAll<Location>('locations'),
                dataService.getAll<User>('users'),
            ]);
            setTasks(taskRows);
            setOrders(orderRows);
            setProducts(productRows);
            setBatches(batchRows);
            setLocations(locationRows);
            setUsers(userRows);
            setSelectedTaskIds((selected) => selected.filter((id) => taskRows.some((task) => task.id === id && task.status === 'Pending')));
        } catch (loadError) {
            console.error('Không thể tải nhiệm vụ để phân bố:', loadError);
            setError(getApiErrorMessage(loadError));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void (async () => { await load(); })();
    }, [load]);

    const pendingTasks = useMemo(() => tasks.filter((task) => {
        if (task.status !== 'Pending') return false;
        const product = products.find((row) => row.id === task.product_id);
        const order = orders.find((row) => row.id === task.order_id);
        return `${product?.sku ?? ''} ${product?.name ?? ''}`.toLocaleLowerCase().includes(productKeyword.toLocaleLowerCase())
            && (order?.order_code ?? '').toLocaleLowerCase().includes(orderKeyword.toLocaleLowerCase());
    }), [tasks, products, orders, productKeyword, orderKeyword]);

    const selectedPendingTasks = tasks.filter((task) => task.status === 'Pending' && selectedTaskIds.includes(task.id));
    const assignableUsers = users.filter((user) => user.role === 'staff' || user.role === 'manager');
    const allVisibleSelected = pendingTasks.length > 0 && pendingTasks.every((task) => selectedTaskIds.includes(task.id));

    const assignSelectedTasks = async () => {
        const assignee = assignableUsers.find((user) => user.id === Number(assigneeId));
        if (!assignee) {
            setError('Vui lòng chọn nhân viên phụ trách.');
            setSuccess('');
            return;
        }
        if (selectedPendingTasks.length === 0) {
            setError('Vui lòng chọn ít nhất một nhiệm vụ đang chờ phân công.');
            setSuccess('');
            return;
        }

        setSaving(true);
        setError('');
        setSuccess('');
        try {
            const results = await Promise.allSettled(selectedPendingTasks.map((task) =>
                dataService.update('picking_tasks', task.id, { assigned_to: assignee.id, status: 'Assigned' })));
            const assignedIds = selectedPendingTasks
                .filter((_, index) => results[index].status === 'fulfilled')
                .map((task) => task.id);
            const failed = results.find((result) => result.status === 'rejected');

            setTasks((currentTasks) => currentTasks.map((task) => assignedIds.includes(task.id)
                ? { ...task, assigned_to: assignee.id, status: 'Assigned' }
                : task));
            setSelectedTaskIds((currentIds) => currentIds.filter((id) => !assignedIds.includes(id)));

            if (failed?.status === 'rejected') {
                console.error('Không thể phân công một số nhiệm vụ picking:', failed.reason);
                setError(`${assignedIds.length} nhiệm vụ đã được phân công; ${results.length - assignedIds.length} nhiệm vụ chưa phân công. ${getApiErrorMessage(failed.reason)}`);
            } else {
                setSuccess(`Đã phân công ${assignedIds.length} nhiệm vụ cho ${assignee.full_name || assignee.username}.`);
            }
        } finally {
            setSaving(false);
        }
    };

    return <ManagementPage title="Phân bố nhiệm vụ" description="Chọn các nhiệm vụ đang chờ phân công và gán cho nhân viên phụ trách." onRefresh={() => void load()} loading={loading}>
        <ManagementFeedback error={error} success={success} />
        <section className="picking-distribution">
            <div className="picking-distribution-heading">
                <div><h3>Điều kiện phân công</h3><p>Hiển thị các nhiệm vụ đang chờ phân công.</p></div>
                <button type="button" className="picking-assign" onClick={() => void assignSelectedTasks()} disabled={loading || saving}>
                    {saving ? 'Đang gán...' : `Gán đơn${selectedPendingTasks.length ? ` (${selectedPendingTasks.length})` : ''}`}
                </button>
            </div>
            <div className="picking-distribution-filters">
                <label><span>Tìm theo sản phẩm</span><input type="search" value={productKeyword} onChange={(event) => setProductKeyword(event.target.value)} placeholder="SKU hoặc tên sản phẩm..." /></label>
                <label><span>Tìm theo đơn xuất</span><input type="search" value={orderKeyword} onChange={(event) => setOrderKeyword(event.target.value)} placeholder="Mã đơn xuất..." /></label>
                <label><span>Người phụ trách</span><select value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)}>
                    <option value="">-- Chọn nhân viên --</option>
                    {assignableUsers.map((user) => <option key={user.id} value={user.id}>{user.full_name || user.username} ({user.role})</option>)}
                </select></label>
            </div>
            <div className="management-list picking-distribution-list">
                <div className="management-list-heading"><h3>Nhiệm vụ chờ phân công</h3><span>{pendingTasks.length}</span></div>
                <div className="management-table-wrap"><table>
                    <thead><tr>
                        <th><input type="checkbox" aria-label="Chọn tất cả nhiệm vụ đang hiển thị" checked={allVisibleSelected} onChange={(event) => {
                            const visibleIds = pendingTasks.map((task) => task.id);
                            setSelectedTaskIds((currentIds) => event.target.checked
                                ? [...new Set([...currentIds, ...visibleIds])]
                                : currentIds.filter((id) => !visibleIds.includes(id)));
                        }} /></th>
                        <th>Mã đơn xuất</th><th>Sản phẩm</th><th>Vị trí / Lô</th><th>Số lượng cần lấy</th>
                    </tr></thead>
                    <tbody>{loading
                        ? <tr><td colSpan={5} className="management-empty">Đang tải dữ liệu từ MySQL...</td></tr>
                        : pendingTasks.length === 0
                            ? <tr><td colSpan={5} className="management-empty">Không có nhiệm vụ chờ phân công phù hợp.</td></tr>
                            : pendingTasks.map((task) => <tr key={task.id}>
                                <td><input type="checkbox" aria-label={`Chọn nhiệm vụ #${task.id}`} checked={selectedTaskIds.includes(task.id)} onChange={(event) => setSelectedTaskIds((currentIds) => event.target.checked
                                    ? [...currentIds, task.id]
                                    : currentIds.filter((id) => id !== task.id))} /></td>
                                <td>{orders.find((row) => row.id === task.order_id)?.order_code ?? `#${task.order_id}`}</td>
                                <td>{products.find((row) => row.id === task.product_id)?.sku ?? `SKU #${task.product_id}`} — {products.find((row) => row.id === task.product_id)?.name ?? '—'}</td>
                                <td>{locations.find((row) => row.bin_id === task.bin_id)?.code ?? `Vị trí #${task.bin_id}`} / {batches.find((row) => row.id === task.batch_id)?.batch_code ?? `Lô #${task.batch_id}`}</td>
                                <td>{task.required_quantity}</td>
                            </tr>)}</tbody>
                </table></div>
            </div>
        </section>
    </ManagementPage>;
}
