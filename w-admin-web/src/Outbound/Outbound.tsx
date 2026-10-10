import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { dataService, type ApiRecord, type SignedInUser } from '../API/api';
import { getApiErrorMessage } from '../API/errors';
import { ManagementFeedback, ManagementList, ManagementPage, ManagementRowActions, ManagementSearch, ManagementStatus, type ManagementField } from '../components/ManagementUI';
import { formatManagementDate } from '../utils/formatDate';
import './Outbound.css';

type Order = { id: number; order_code: string; customer_name: string | null; shipping_id: number | null; tracking_code: string | null; created_by: number; status: string; created_at: string };
type OrderDetail = { id: number; order_id: number; product_id: number; ordered_quantity: number; picked_quantity: number };
type Product = { id: number; sku: string; name: string };
type Shipping = { id: number; name: string };
type FormState = Record<string, string>;
type OrderLineForm = { key: number; product_id: string; ordered_quantity: string; picked_quantity: string };

const statuses = ['Pending', 'Allocated', 'Picking', 'Packing', 'Dispatched', 'Cancelled'];
const statusLabels: Record<string, string> = { Pending: 'Chờ xử lý', Allocated: 'Đã phân bổ', Picking: 'Đang picking', Packing: 'Đang đóng gói', Dispatched: 'Đã giao', Cancelled: 'Đã hủy' };
const emptyForm: FormState = {
    order_code: '', customer_name: '', shipping_id: '', tracking_code: '', status: 'Pending',
};
const emptyOrderLine = (key: number): OrderLineForm => ({ key, product_id: '', ordered_quantity: '1', picked_quantity: '0' });

export default function OutboundManagement({ currentUser }: { currentUser: SignedInUser }) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [details, setDetails] = useState<OrderDetail[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [shippings, setShippings] = useState<Shipping[]>([]);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [orderLines, setOrderLines] = useState<OrderLineForm[]>([emptyOrderLine(1)]);
    const [modalOpen, setModalOpen] = useState(false);
    const nextLineKey = useRef(2);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [keyword, setKeyword] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [orderRows, detailRows, productRows, shippingRows] = await Promise.all([
                dataService.getAll<Order>('outbound_orders'),
                dataService.getAll<OrderDetail>('outbound_details'),
                dataService.getAll<Product>('products'),
                dataService.getAll<Shipping>('shippings'),
            ]);
            setOrders(orderRows);
            setDetails(detailRows);
            setProducts(productRows);
            setShippings(shippingRows);
        } catch (loadError) {
            console.error('Không thể tải đơn xuất:', loadError);
            setError(getApiErrorMessage(loadError));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void (async () => { await load(); })();
    }, [load]);

    useEffect(() => {
        if (!selectedOrder) return;

        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setSelectedOrder(null);
        };
        window.addEventListener('keydown', closeOnEscape);
        return () => window.removeEventListener('keydown', closeOnEscape);
    }, [selectedOrder]);

    const fields: ManagementField[] = [
        { name: 'order_code', label: 'Mã đơn xuất', required: true, maxLength: 50 },
        { name: 'customer_name', label: 'Khách hàng / nơi nhận', maxLength: 150 },
        { name: 'shipping_id', label: 'Đơn vị vận chuyển', options: shippings.map((row) => ({ value: String(row.id), label: row.name })) },
        { name: 'tracking_code', label: 'Mã vận đơn', maxLength: 100 },
        { name: 'status', label: 'Trạng thái', required: true, options: statuses.map((value) => ({ value, label: statusLabels[value] })) },
    ];

    const filteredOrders = useMemo(() => orders.filter((order) =>
        `${order.order_code} ${order.customer_name ?? ''} ${order.tracking_code ?? ''}`.toLocaleLowerCase().includes(keyword.toLocaleLowerCase())
        && (!statusFilter || order.status === statusFilter)), [orders, keyword, statusFilter]);

    const resetForm = () => {
        setEditingId(null);
        setForm(emptyForm);
        setOrderLines([emptyOrderLine(nextLineKey.current++)]);
        setModalOpen(false);
    };

    const edit = (order: Order) => {
        setEditingId(order.id);
        setForm({
            ...emptyForm,
            order_code: order.order_code,
            customer_name: order.customer_name ?? '',
            shipping_id: order.shipping_id === null ? '' : String(order.shipping_id),
            tracking_code: order.tracking_code ?? '',
            status: order.status,
        });
        setOrderLines([]);
        setModalOpen(true);
        setError('');
        setSuccess('');
    };

    const startCreate = () => {
        setEditingId(null);
        setForm(emptyForm);
        setOrderLines([emptyOrderLine(nextLineKey.current++)]);
        setModalOpen(true);
        setError('');
        setSuccess('');
    };

    const addOrderLine = () => {
        setOrderLines((lines) => [...lines, emptyOrderLine(nextLineKey.current++)]);
    };

    const updateOrderLine = (key: number, field: keyof Omit<OrderLineForm, 'key'>, value: string) => {
        setOrderLines((lines) => lines.map((line) => line.key === key ? { ...line, [field]: value } : line));
    };

    const save = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');
        if (editingId === null && orderLines.length === 0) {
            setError('Đơn xuất phải có ít nhất một sản phẩm.');
            setSaving(false);
            return;
        }
        if (editingId === null && orderLines.some((line) =>
            !line.product_id || !line.ordered_quantity || !Number.isInteger(Number(line.ordered_quantity))
            || Number(line.ordered_quantity) <= 0 || !line.picked_quantity
            || !Number.isInteger(Number(line.picked_quantity)) || Number(line.picked_quantity) < 0
            || Number(line.picked_quantity) > Number(line.ordered_quantity))) {
            setError('Mỗi dòng cần có sản phẩm, số lượng đặt lớn hơn 0 và số lượng đã lấy từ 0 đến số lượng đặt.');
            setSaving(false);
            return;
        }
        const payload: ApiRecord = {
            order_code: form.order_code.trim().toUpperCase(),
            customer_name: form.customer_name.trim() || null,
            shipping_id: form.shipping_id ? Number(form.shipping_id) : null,
            tracking_code: form.tracking_code.trim() || null,
            status: form.status,
        };
        if (editingId === null) payload.created_by = currentUser.id;
        let newOrderId: number | null = null;
        try {
            if (editingId === null) {
                const result = await dataService.create('outbound_orders', payload);
                newOrderId = result.id;
                await Promise.all(orderLines.map((line) => dataService.create('outbound_details', {
                        order_id: result.id,
                        product_id: Number(line.product_id),
                        ordered_quantity: Number(line.ordered_quantity),
                        picked_quantity: Number(line.picked_quantity),
                    })));
                setSuccess('Đã tạo đơn xuất trong MySQL.');
            } else {
                await dataService.update('outbound_orders', editingId, payload);
                setSuccess('Đã cập nhật đơn xuất trong MySQL.');
            }
            resetForm();
            await load();
        } catch (saveError) {
            console.error('Không thể lưu đơn xuất:', saveError);
            if (newOrderId !== null) {
                try {
                    await dataService.delete('outbound_orders', newOrderId);
                } catch (rollbackError) {
                    console.error('Không thể xóa đơn sau lỗi dòng chi tiết:', rollbackError);
                    setError(`${getApiErrorMessage(saveError)} Không thể tự hủy đơn vừa tạo; hãy kiểm tra MySQL.`);
                    await load();
                    setSaving(false);
                    return;
                }
            }
            setError(getApiErrorMessage(saveError));
        } finally {
            setSaving(false);
        }
    };

    const remove = async (order: Order) => {
        if (!window.confirm(`Bạn có chắc muốn xóa đơn "${order.order_code}" không?`)) return;
        setError('');
        setSuccess('');
        try {
            await dataService.delete('outbound_orders', order.id);
            if (editingId === order.id) resetForm();
            if (selectedOrder?.id === order.id) setSelectedOrder(null);
            setSuccess('Đã xóa đơn xuất khỏi MySQL.');
            await load();
        } catch (deleteError) {
            console.error('Không thể xóa đơn xuất:', deleteError);
            setError(getApiErrorMessage(deleteError));
        }
    };

    return <ManagementPage title="Quản lý lệnh xuất hàng" description="Quản lý đơn xuất, đơn vị vận chuyển và sản phẩm giao." onRefresh={() => void load()} loading={loading}>
        <ManagementFeedback error={error} success={success} />
        <ManagementSearch value={keyword} onChange={setKeyword} onSubmit={(event) => event.preventDefault()} onReset={() => { setKeyword(''); setStatusFilter(''); }} placeholder="Tìm mã đơn, khách hàng hoặc mã vận đơn..." loading={loading} filter={statusFilter} onFilterChange={setStatusFilter} filterOptions={statuses.map((value) => ({ value, label: statusLabels[value] }))} filterLabel="Tất cả trạng thái" />
        <div className="outbound-create-action"><button type="button" onClick={startCreate}>＋ Tạo lệnh xuất</button></div>
        <ManagementList title="Danh sách đơn xuất" count={filteredOrders.length} loading={loading} headers={['Mã đơn', 'Khách hàng', 'Đơn vị vận chuyển', 'Mã vận đơn', 'Sản phẩm & số lượng', 'Ngày tạo', 'Trạng thái', 'Thao tác']} emptyMessage="Chưa có đơn xuất phù hợp.">
            {filteredOrders.map((order) => {
                const lines = details.filter((row) => row.order_id === order.id);
                return <tr key={order.id}>
                    <td className="management-primary">{order.order_code}</td><td>{order.customer_name || '—'}</td>
                    <td>{shippings.find((row) => row.id === order.shipping_id)?.name ?? '—'}</td><td>{order.tracking_code || '—'}</td>
                    <td>{lines.length ? lines.map((line) => `${products.find((row) => row.id === line.product_id)?.sku ?? `SKU #${line.product_id}`} × ${line.ordered_quantity}`).join('; ') : '—'}</td>
                    <td>{formatManagementDate(order.created_at)}</td><td><ManagementStatus value={order.status} labels={statusLabels} /></td>
                    <td className="outbound-row-actions"><button type="button" onClick={() => setSelectedOrder(order)}>Chi tiết</button><ManagementRowActions onEdit={() => edit(order)} onDelete={() => void remove(order)} /></td>
                </tr>;
            })}
        </ManagementList>
        {selectedOrder && <div className="modal-backdrop no-print" onMouseDown={(event) => event.target === event.currentTarget && setSelectedOrder(null)}>
            <section className="detail-modal outbound-detail-modal" role="dialog" aria-modal="true" aria-labelledby="outbound-detail-title">
                <div className="modal-heading">
                    <div><span className="eyebrow">WMS / QUẢN LÝ XUẤT HÀNG</span><h2 id="outbound-detail-title">Chi tiết đơn {selectedOrder.order_code}</h2></div>
                    <button type="button" className="modal-close" onClick={() => setSelectedOrder(null)} aria-label="Đóng">×</button>
                </div>
                <div className="detail-list">
                    <div><span>Khách hàng / nơi nhận</span><strong>{selectedOrder.customer_name || '—'}</strong></div>
                    <div><span>Đơn vị vận chuyển</span><strong>{shippings.find((row) => row.id === selectedOrder.shipping_id)?.name ?? '—'}</strong></div>
                    <div><span>Mã vận đơn</span><strong>{selectedOrder.tracking_code || '—'}</strong></div>
                    <div><span>Ngày tạo</span><strong>{formatManagementDate(selectedOrder.created_at)}</strong></div>
                    <div><span>Trạng thái</span><strong><ManagementStatus value={selectedOrder.status} labels={statusLabels} /></strong></div>
                </div>
                <section className="outbound-detail-lines">
                    <h3>Sản phẩm trong đơn</h3>
                    {details.filter((line) => line.order_id === selectedOrder.id).length === 0
                        ? <p>Đơn hàng chưa có dòng sản phẩm.</p>
                        : <div className="management-table-wrap"><table>
                            <thead><tr><th>SKU</th><th>Tên sản phẩm</th><th>Số lượng đặt</th><th>Đã lấy</th></tr></thead>
                            <tbody>{details.filter((line) => line.order_id === selectedOrder.id).map((line) => {
                                const product = products.find((row) => row.id === line.product_id);
                                return <tr key={line.id}>
                                    <td className="management-primary">{product?.sku ?? `SKU #${line.product_id}`}</td>
                                    <td>{product?.name ?? 'Không tìm thấy sản phẩm'}</td>
                                    <td>{line.ordered_quantity}</td>
                                    <td>{line.picked_quantity}</td>
                                </tr>;
                            })}</tbody>
                        </table></div>}
                </section>
                <div className="modal-footer">
                    <button type="button" className="button secondary" onClick={() => setSelectedOrder(null)}>Đóng</button>
                </div>
            </section>
        </div>}
        {modalOpen && <div className="modal-backdrop no-print" onMouseDown={(event) => event.target === event.currentTarget && resetForm()}>
            <form className="form-modal outbound-modal" onSubmit={(event) => void save(event)}>
                <div className="modal-heading">
                    <div><span className="eyebrow">WMS / QUẢN LÝ XUẤT HÀNG</span><h2>{editingId === null ? 'Tạo lệnh xuất hàng' : 'Chỉnh sửa lệnh xuất hàng'}</h2></div>
                    <button type="button" className="modal-close" onClick={resetForm} aria-label="Đóng">×</button>
                </div>
                <div className="form-grid">
                    {fields.map((field) => <label key={field.name}>
                        <span>{field.label}{field.required && <b> *</b>}</span>
                        {field.options ? <select required={field.required} value={form[field.name] ?? ''} onChange={(event) => setForm({ ...form, [field.name]: event.target.value })}>
                            <option value="">-- Chọn --</option>
                            {field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select> : <input required={field.required} maxLength={field.maxLength} value={form[field.name] ?? ''} onChange={(event) => setForm({ ...form, [field.name]: event.target.value })} />}
                    </label>)}
                </div>
                {editingId === null && <section className="outbound-lines">
                    <div className="outbound-lines-heading"><div><h3>Sản phẩm trong đơn</h3><p>Thêm một hoặc nhiều sản phẩm cho cùng đơn xuất.</p></div><button type="button" onClick={addOrderLine}>＋ Thêm sản phẩm</button></div>
                    {orderLines.map((line, index) => <div className="outbound-line" key={line.key}>
                        <strong className="outbound-line-number">{index + 1}</strong>
                        <label><span>Sản phẩm *</span><select required value={line.product_id} onChange={(event) => updateOrderLine(line.key, 'product_id', event.target.value)}>
                            <option value="">-- Chọn sản phẩm --</option>
                            {products.map((product) => <option key={product.id} value={product.id}>{product.sku} - {product.name}</option>)}
                        </select></label>
                        <label><span>Số lượng đặt *</span><input type="number" required min={1} step={1} value={line.ordered_quantity} onChange={(event) => updateOrderLine(line.key, 'ordered_quantity', event.target.value)} /></label>
                        <label><span>Đã lấy</span><input type="number" required min={0} step={1} value={line.picked_quantity} onChange={(event) => updateOrderLine(line.key, 'picked_quantity', event.target.value)} /></label>
                        <button type="button" className="outbound-line-remove" onClick={() => setOrderLines((lines) => lines.filter((item) => item.key !== line.key))} disabled={orderLines.length === 1} aria-label={`Xóa sản phẩm dòng ${index + 1}`}>×</button>
                    </div>)}
                </section>}
                {editingId !== null && <p className="outbound-edit-note">Chỉnh sửa thông tin đơn. Các dòng sản phẩm hiện có được giữ nguyên.</p>}
                {error && <div className="management-feedback error outbound-form-error" role="alert">{error}</div>}
                <div className="modal-footer">
                    <button type="button" className="button secondary" onClick={resetForm}>Hủy</button>
                    <button type="submit" className="button primary" disabled={saving}>{saving ? 'Đang lưu...' : editingId === null ? 'Tạo đơn hàng' : 'Lưu thay đổi'}</button>
                </div>
            </form>
        </div>}
    </ManagementPage>;
}
