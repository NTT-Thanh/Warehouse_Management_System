import { useCallback, useEffect, useMemo, useState } from 'react';
import { dataService, type ApiRecord } from '../API/api';
import { getApiErrorMessage } from '../API/errors';
import { ManagementFeedback, ManagementForm, ManagementList, ManagementPage, ManagementRowActions, ManagementSearch, ManagementStatus, type ManagementField } from '../components/ManagementUI';
import './Picking.css';

type Task = { id: number; order_id: number; order_detail_id: number; product_id: number; batch_id: number; bin_id: number; assigned_to: number | null; required_quantity: number; picked_quantity: number; status: string; created_at: string };
type Order = { id: number; order_code: string };
type OrderDetail = { id: number; order_id: number; product_id: number; ordered_quantity: number; picked_quantity: number };
type Product = { id: number; sku: string; name: string };
type Batch = { id: number; batch_code: string };
type Bin = { id: number; name: string };
type User = { id: number; username: string; full_name: string | null; role: string };
type FormState = Record<string, string>;

const statuses = ['Pending', 'Assigned', 'In_Progress', 'Completed', 'Short_Picked', 'Cancelled'];
const statusLabels: Record<string, string> = { Pending: 'Chờ phân công', Assigned: 'Đã phân công', In_Progress: 'Đang lấy hàng', Completed: 'Hoàn thành', Short_Picked: 'Lấy thiếu', Cancelled: 'Đã hủy' };
const emptyForm: FormState = {
    order_id: '', order_detail_id: '', product_id: '', batch_id: '', bin_id: '', assigned_to: '',
    required_quantity: '1', picked_quantity: '0', status: 'Pending',
};

export default function PickingManagement() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [orderDetails, setOrderDetails] = useState<OrderDetail[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [batches, setBatches] = useState<Batch[]>([]);
    const [bins, setBins] = useState<Bin[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [keyword, setKeyword] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [taskRows, orderRows, detailRows, productRows, batchRows, binRows, userRows] = await Promise.all([
                dataService.getAll<Task>('picking_tasks'),
                dataService.getAll<Order>('outbound_orders'),
                dataService.getAll<OrderDetail>('outbound_details'),
                dataService.getAll<Product>('products'),
                dataService.getAll<Batch>('batches'),
                dataService.getAll<Bin>('bins'),
                dataService.getAll<User>('users'),
            ]);
            setTasks(taskRows);
            setOrders(orderRows);
            setOrderDetails(detailRows);
            setProducts(productRows);
            setBatches(batchRows);
            setBins(binRows);
            setUsers(userRows);
        } catch (loadError) {
            console.error('Không thể tải nhiệm vụ picking:', loadError);
            setError(getApiErrorMessage(loadError));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void (async () => { await load(); })();
    }, [load]);

    const fields: ManagementField[] = [
        { name: 'order_id', label: 'Đơn xuất', required: true, options: orders.map((row) => ({ value: String(row.id), label: row.order_code })) },
        { name: 'order_detail_id', label: 'Dòng đơn xuất', required: true, options: orderDetails.map((row) => ({ value: String(row.id), label: `${orders.find((order) => order.id === row.order_id)?.order_code ?? `#${row.order_id}`} - ${products.find((product) => product.id === row.product_id)?.sku ?? `SKU #${row.product_id}`}` })) },
        { name: 'product_id', label: 'Sản phẩm', required: true, options: products.map((row) => ({ value: String(row.id), label: `${row.sku} - ${row.name}` })) },
        { name: 'batch_id', label: 'Lô hàng', required: true, options: batches.map((row) => ({ value: String(row.id), label: row.batch_code })) },
        { name: 'bin_id', label: 'Ô chứa', required: true, options: bins.map((row) => ({ value: String(row.id), label: row.name })) },
        { name: 'assigned_to', label: 'Nhân viên phụ trách', options: users.filter((row) => row.role === 'staff' || row.role === 'manager').map((row) => ({ value: String(row.id), label: `${row.full_name || row.username} (${row.role})` })) },
        { name: 'required_quantity', label: 'Số lượng cần lấy', type: 'number', required: true, min: 0 },
        { name: 'picked_quantity', label: 'Số lượng đã lấy', type: 'number', required: true, min: 0 },
        { name: 'status', label: 'Trạng thái', required: true, options: statuses.map((value) => ({ value, label: statusLabels[value] })) },
    ];

    const filtered = useMemo(() => tasks.filter((task) =>
        `${orders.find((row) => row.id === task.order_id)?.order_code ?? ''} ${products.find((row) => row.id === task.product_id)?.sku ?? ''}`.toLocaleLowerCase().includes(keyword.toLocaleLowerCase())
        && (!statusFilter || task.status === statusFilter)), [tasks, orders, products, keyword, statusFilter]);

    const resetForm = () => {
        setEditingId(null);
        setForm(emptyForm);
    };

    const edit = (task: Task) => {
        setEditingId(task.id);
        setForm({
            order_id: String(task.order_id),
            order_detail_id: String(task.order_detail_id),
            product_id: String(task.product_id),
            batch_id: String(task.batch_id),
            bin_id: String(task.bin_id),
            assigned_to: task.assigned_to === null ? '' : String(task.assigned_to),
            required_quantity: String(task.required_quantity),
            picked_quantity: String(task.picked_quantity),
            status: task.status,
        });
        setError('');
        setSuccess('');
    };

    const save = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');
        const payload: ApiRecord = {
            order_id: Number(form.order_id),
            order_detail_id: Number(form.order_detail_id),
            product_id: Number(form.product_id),
            batch_id: Number(form.batch_id),
            bin_id: Number(form.bin_id),
            assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
            required_quantity: Number(form.required_quantity),
            picked_quantity: Number(form.picked_quantity),
            status: form.status,
        };
        try {
            if (editingId === null) {
                await dataService.create('picking_tasks', payload);
                setSuccess('Đã thêm nhiệm vụ picking vào MySQL.');
            } else {
                await dataService.update('picking_tasks', editingId, payload);
                setSuccess('Đã cập nhật nhiệm vụ picking trong MySQL.');
            }
            resetForm();
            await load();
        } catch (saveError) {
            console.error('Không thể lưu nhiệm vụ picking:', saveError);
            setError(getApiErrorMessage(saveError));
        } finally {
            setSaving(false);
        }
    };

    const remove = async (task: Task) => {
        if (!window.confirm(`Bạn có chắc muốn xóa nhiệm vụ #${task.id} không?`)) return;
        setError('');
        setSuccess('');
        try {
            await dataService.delete('picking_tasks', task.id);
            if (editingId === task.id) resetForm();
            setSuccess('Đã xóa nhiệm vụ khỏi MySQL.');
            await load();
        } catch (deleteError) {
            console.error('Không thể xóa nhiệm vụ picking:', deleteError);
            setError(getApiErrorMessage(deleteError));
        }
    };

    const autoAssign = async () => {
        const staff = users.find((row) => row.role === 'staff' || row.role === 'manager');
        if (!staff) {
            setError('Cần có tài khoản nhân viên hoặc quản lý trong MySQL để phân công picking.');
            return;
        }
        setError('');
        setSuccess('');
        try {
            await Promise.all(tasks.filter((task) => task.status === 'Pending').map((task) =>
                dataService.update('picking_tasks', task.id, { assigned_to: staff.id, status: 'Assigned' })));
            setSuccess(`Đã phân công các nhiệm vụ đang chờ cho ${staff.full_name || staff.username}.`);
            await load();
        } catch (assignError) {
            console.error('Không thể tự động phân công picking:', assignError);
            setError(getApiErrorMessage(assignError));
        }
    };

    const cancel = async (task: Task) => {
        setError('');
        setSuccess('');
        try {
            await dataService.update('picking_tasks', task.id, { status: 'Cancelled' });
            setSuccess(`Đã hủy nhiệm vụ #${task.id}.`);
            await load();
        } catch (cancelError) {
            console.error('Không thể hủy nhiệm vụ:', cancelError);
            setError(getApiErrorMessage(cancelError));
        }
    };

    return <ManagementPage title="Quản lý nhiệm vụ picking" description="Phân công, cập nhật và theo dõi tiến độ lấy hàng trong MySQL." onRefresh={() => void load()} loading={loading}>
        <ManagementFeedback error={error} success={success} />
        <div className="picking-toolbar"><ManagementSearch value={keyword} onChange={setKeyword} onSubmit={(event) => event.preventDefault()} onReset={() => { setKeyword(''); setStatusFilter(''); }} placeholder="Tìm mã đơn xuất hoặc SKU..." loading={loading} filter={statusFilter} onFilterChange={setStatusFilter} filterOptions={statuses.map((value) => ({ value, label: statusLabels[value] }))} filterLabel="Tất cả trạng thái" /><button type="button" className="picking-assign" onClick={() => void autoAssign()} disabled={loading}>Phân công tự động</button></div>
        <ManagementForm title={editingId === null ? 'Tạo nhiệm vụ picking' : `Cập nhật nhiệm vụ #${editingId}`} fields={fields} values={form} onChange={(name, value) => setForm({ ...form, [name]: value })} onSubmit={(event) => void save(event)} onCancel={resetForm} editing={editingId !== null} saving={saving} error="" submitLabel={editingId === null ? 'Thêm nhiệm vụ' : 'Lưu thay đổi'} />
        <ManagementList title="Danh sách nhiệm vụ" count={filtered.length} loading={loading} headers={['ID', 'Mã đơn xuất', 'Sản phẩm', 'Vị trí / Lô', 'Cần / Đã lấy', 'Nhân viên', 'Trạng thái', 'Thao tác']} emptyMessage="Chưa có nhiệm vụ phù hợp.">
            {filtered.map((task) => <tr key={task.id}>
                <td>#{task.id}</td><td>{orders.find((row) => row.id === task.order_id)?.order_code ?? `#${task.order_id}`}</td>
                <td>{products.find((row) => row.id === task.product_id)?.sku ?? `SKU #${task.product_id}`}</td>
                <td>{bins.find((row) => row.id === task.bin_id)?.name ?? `Bin #${task.bin_id}`} / {batches.find((row) => row.id === task.batch_id)?.batch_code ?? `Lô #${task.batch_id}`}</td>
                <td>{task.required_quantity} / {task.picked_quantity}</td>
                <td>{users.find((row) => row.id === task.assigned_to)?.full_name ?? (task.assigned_to ? `#${task.assigned_to}` : 'Chưa phân công')}</td>
                <td><ManagementStatus value={task.status} labels={statusLabels} /></td>
                <td className="picking-row-actions">
                    <ManagementRowActions onEdit={() => edit(task)} onDelete={() => void remove(task)} />
                    {task.status !== 'Completed' && task.status !== 'Cancelled' && <button type="button" onClick={() => void cancel(task)}>Hủy</button>}
                </td>
            </tr>)}
        </ManagementList>
    </ManagementPage>;
}
