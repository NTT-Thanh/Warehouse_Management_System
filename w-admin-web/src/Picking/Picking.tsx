import { useCallback, useEffect, useMemo, useState } from 'react';
import { dataService, type ApiRecord } from '../API/api';
import { getApiErrorMessage } from '../API/errors';
import { ManagementFeedback, ManagementForm, ManagementList, ManagementPage, ManagementRowActions, ManagementSearch, ManagementStatus, type ManagementField } from '../components/ManagementUI';
import './Picking.css';

type Task = { id: number; order_id: number; order_detail_id: number; product_id: number; batch_id: number; bin_id: number; assigned_to: number | null; required_quantity: number; picked_quantity: number; status: string; created_at: string };
type Order = { id: number; order_code: string; status: string };
type OrderDetail = { id: number; order_id: number; product_id: number; ordered_quantity: number; picked_quantity: number };
type Product = { id: number; sku: string; name: string };
type Batch = { id: number; batch_code: string };
type Location = { id: number; bin_id: number; code: string; description: string | null };
type Inventory = { id: number; product_id: number; batch_id: number; bin_id: number; quantity: number };
type User = { id: number; username: string; full_name: string | null; role: string };
type FormState = Record<string, string>;

const statuses = ['Pending', 'Assigned', 'In_Progress', 'Completed', 'Short_Picked', 'Cancelled'];
const statusLabels: Record<string, string> = { Pending: 'Chờ phân công', Assigned: 'Đã phân công', In_Progress: 'Đang lấy hàng', Completed: 'Hoàn thành', Short_Picked: 'Lấy thiếu', Cancelled: 'Đã hủy' };
const emptyForm: FormState = {
    order_id: '', order_detail_id: '', product_id: '', batch_id: '', location_id: '',
    required_quantity: '1', picked_quantity: '0', status: 'Pending',
};

export default function PickingManagement() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [orderDetails, setOrderDetails] = useState<OrderDetail[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [batches, setBatches] = useState<Batch[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [inventory, setInventory] = useState<Inventory[]>([]);
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
            const [taskRows, orderRows, detailRows, productRows, batchRows, locationRows, inventoryRows, userRows] = await Promise.all([
                dataService.getAll<Task>('picking_tasks'),
                dataService.getAll<Order>('outbound_orders'),
                dataService.getAll<OrderDetail>('outbound_details'),
                dataService.getAll<Product>('products'),
                dataService.getAll<Batch>('batches'),
                dataService.getAll<Location>('locations'),
                dataService.getAll<Inventory>('inventory'),
                dataService.getAll<User>('users'),
            ]);
            setTasks(taskRows);
            setOrders(orderRows);
            setOrderDetails(detailRows);
            setProducts(productRows);
            setBatches(batchRows);
            setLocations(locationRows);
            setInventory(inventoryRows);
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

    const selectedOrderId = Number(form.order_id);
    const selectedProductId = Number(form.product_id);
    const selectedBatchId = Number(form.batch_id);
    const editingTask = tasks.find((task) => task.id === editingId);
    const availableOrders = orders.filter((order) =>
        order.id === editingTask?.order_id
        || (order.status === 'Pending' && orderDetails.some((detail) =>
            detail.order_id === order.id
            && (detail.id === editingTask?.order_detail_id || !tasks.some((task) => task.order_detail_id === detail.id)))));
    const availableOrderDetails = orderDetails.filter((detail) =>
        detail.order_id === selectedOrderId
        && (detail.id === editingTask?.order_detail_id
            || !tasks.some((task) => task.order_detail_id === detail.id)));
    const availableProductIds = new Set(availableOrderDetails.map((detail) => detail.product_id));
    const availableProducts = products.filter((product) => availableProductIds.has(product.id));
    const availableBatches = batches.filter((batch) =>
        inventory.some((row) => row.product_id === selectedProductId && row.batch_id === batch.id && row.quantity > 0)
        || (editingTask?.product_id === selectedProductId && editingTask.batch_id === batch.id));
    const availableInventory = inventory.filter((row) =>
        row.product_id === selectedProductId && row.batch_id === selectedBatchId && row.quantity > 0);
    const availableLocationIds = new Set(availableInventory.map((row) => row.bin_id));
    if (editingTask?.product_id === selectedProductId && editingTask.batch_id === selectedBatchId) {
        availableLocationIds.add(editingTask.bin_id);
    }
    const availableLocations = locations.filter((location) => availableLocationIds.has(location.bin_id));
    const selectedLocation = locations.find((location) => location.id === Number(form.location_id));
    const locationStock = selectedLocation
        ? availableInventory.filter((row) => row.bin_id === selectedLocation.bin_id).reduce((total, row) => total + row.quantity, 0)
        : 0;

    const fields: ManagementField[] = [
        { name: 'order_id', label: 'Đơn xuất', required: true, options: availableOrders.map((row) => ({ value: String(row.id), label: row.order_code })) },
        { name: 'order_detail_id', label: 'Dòng đơn xuất', required: true, options: availableOrderDetails.map((row) => ({ value: String(row.id), label: `${products.find((product) => product.id === row.product_id)?.sku ?? `SKU #${row.product_id}`} — đặt ${row.ordered_quantity}` })) },
        { name: 'product_id', label: 'Sản phẩm', required: true, options: availableProducts.map((row) => ({ value: String(row.id), label: `${row.sku} - ${row.name}` })) },
        { name: 'batch_id', label: 'Lô hàng', required: true, options: availableBatches.map((row) => ({ value: String(row.id), label: row.batch_code })) },
        { name: 'location_id', label: 'Vị trí', required: true, options: availableLocations.map((location) => {
            const quantity = availableInventory.filter((row) => row.bin_id === location.bin_id).reduce((total, row) => total + row.quantity, 0);
            return { value: String(location.id), label: `${location.code} — tồn ${quantity}` };
        }) },
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
            location_id: String(locations.find((location) => location.bin_id === task.bin_id)?.id ?? ''),
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
        const selectedOrderDetail = availableOrderDetails.find((detail) => detail.id === Number(form.order_detail_id));
        if (!selectedOrderDetail || selectedOrderDetail.product_id !== Number(form.product_id)) {
            setError('Vui lòng chọn dòng đơn xuất và sản phẩm thuộc cùng đơn hàng.');
            setSaving(false);
            return;
        }
        if (tasks.some((task) => task.order_detail_id === selectedOrderDetail.id && task.id !== editingId)) {
            setError('Dòng đơn xuất này đã được tạo thành nhiệm vụ picking.');
            setSaving(false);
            return;
        }
        if (!selectedLocation) {
            setError('Vui lòng chọn vị trí có tồn kho cho sản phẩm và lô hàng đã chọn.');
            setSaving(false);
            return;
        }
        if (!Number.isInteger(Number(form.required_quantity)) || Number(form.required_quantity) <= 0
            || !Number.isInteger(Number(form.picked_quantity)) || Number(form.picked_quantity) < 0
            || Number(form.picked_quantity) > Number(form.required_quantity)) {
            setError('Số lượng cần lấy phải lớn hơn 0; số lượng đã lấy phải từ 0 đến số lượng cần lấy.');
            setSaving(false);
            return;
        }
        if (editingId === null && Number(form.required_quantity) > locationStock) {
            setError(`Số lượng cần lấy vượt quá tồn kho tại vị trí này (${locationStock}).`);
            setSaving(false);
            return;
        }
        const payload: ApiRecord = {
            order_id: Number(form.order_id),
            order_detail_id: Number(form.order_detail_id),
            product_id: Number(form.product_id),
            batch_id: Number(form.batch_id),
            bin_id: selectedLocation.bin_id,
            required_quantity: Number(form.required_quantity),
            picked_quantity: Number(form.picked_quantity),
            status: form.status,
        };
        if (editingId === null) payload.assigned_to = null;
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

    const handleFormChange = (name: string, value: string) => {
        if (name === 'order_id') {
            setForm({ ...emptyForm, order_id: value });
        } else if (name === 'order_detail_id') {
            const detail = orderDetails.find((row) => row.id === Number(value));
            setForm({ ...form, order_detail_id: value, product_id: detail ? String(detail.product_id) : '', batch_id: '', location_id: '' });
        } else if (name === 'product_id') {
            const selectedDetail = orderDetails.find((row) => row.id === Number(form.order_detail_id));
            setForm({
                ...form,
                product_id: value,
                order_detail_id: selectedDetail?.product_id === Number(value) ? form.order_detail_id : '',
                batch_id: '',
                location_id: '',
            });
        } else if (name === 'batch_id') {
            setForm({ ...form, batch_id: value, location_id: '' });
        } else {
            setForm({ ...form, [name]: value });
        }
    };

    return <ManagementPage title="Quản lý nhiệm vụ picking" description="Phân công, cập nhật và theo dõi tiến độ lấy hàng trong MySQL." onRefresh={() => void load()} loading={loading}>
        <ManagementFeedback error={error} success={success} />
        <div className="picking-toolbar"><ManagementSearch value={keyword} onChange={setKeyword} onSubmit={(event) => event.preventDefault()} onReset={() => { setKeyword(''); setStatusFilter(''); }} placeholder="Tìm mã đơn xuất hoặc SKU..." loading={loading} filter={statusFilter} onFilterChange={setStatusFilter} filterOptions={statuses.map((value) => ({ value, label: statusLabels[value] }))} filterLabel="Tất cả trạng thái" /></div>
        <ManagementForm title={editingId === null ? 'Tạo nhiệm vụ picking' : `Cập nhật nhiệm vụ #${editingId}`} fields={fields} values={form} onChange={handleFormChange} onSubmit={(event) => void save(event)} onCancel={resetForm} editing={editingId !== null} saving={saving} error="" submitLabel={editingId === null ? 'Thêm nhiệm vụ' : 'Lưu thay đổi'} />
        <ManagementList title="Danh sách nhiệm vụ" count={filtered.length} loading={loading} headers={['ID', 'Mã đơn xuất', 'Sản phẩm', 'Vị trí / Lô', 'Cần / Đã lấy', 'Nhân viên', 'Trạng thái', 'Thao tác']} emptyMessage="Chưa có nhiệm vụ phù hợp.">
            {filtered.map((task) => <tr key={task.id}>
                <td>#{task.id}</td><td>{orders.find((row) => row.id === task.order_id)?.order_code ?? `#${task.order_id}`}</td>
                <td>{products.find((row) => row.id === task.product_id)?.sku ?? `SKU #${task.product_id}`}</td>
                <td>{locations.find((row) => row.bin_id === task.bin_id)?.code ?? `Vị trí #${task.bin_id}`} / {batches.find((row) => row.id === task.batch_id)?.batch_code ?? `Lô #${task.batch_id}`}</td>
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
