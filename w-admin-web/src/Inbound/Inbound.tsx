import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { dataService, type ApiRecord, type SignedInUser } from '../API/api';
import { getApiErrorMessage } from '../API/errors';
import { ManagementFeedback, ManagementList, ManagementPage, ManagementRowActions, ManagementSearch, ManagementStatus, type ManagementField } from '../components/ManagementUI';
import { formatManagementDate } from '../utils/formatDate';
import './Inbound.css';

type Receipt = { id: number; receipt_code: string; supplier_id: number; created_by: number; status: string; note: string | null; created_at: string };
type ReceiptDetail = { id: number; receipt_id: number; product_id: number; batch_id: number; expected_quantity: number; actual_quantity: number };
type Supplier = { id: number; name: string };
type Product = { id: number; sku: string; name: string };
type Batch = { id: number; batch_code: string; product_id: number };
type FormState = Record<string, string>;
type ReceiptLineForm = { key: number; product_id: string; batch_id: string; expected_quantity: string; actual_quantity: string };

const statuses = ['Pending', 'Receiving', 'Completed', 'Cancelled'];
const statusLabels: Record<string, string> = { Pending: 'Chờ xử lý', Receiving: 'Đang nhận hàng', Completed: 'Hoàn thành', Cancelled: 'Đã hủy' };
const emptyForm: FormState = {
    receipt_code: '', supplier_id: '', status: 'Pending', note: '',
};
const emptyReceiptLine = (key: number): ReceiptLineForm => ({
    key, product_id: '', batch_id: '', expected_quantity: '1', actual_quantity: '0',
});

export default function InboundManagement({ currentUser }: { currentUser: SignedInUser }) {
    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [details, setDetails] = useState<ReceiptDetail[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [batches, setBatches] = useState<Batch[]>([]);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [receiptLines, setReceiptLines] = useState<ReceiptLineForm[]>([emptyReceiptLine(1)]);
    const [modalOpen, setModalOpen] = useState(false);
    const [formError, setFormError] = useState('');
    const nextLineKey = useRef(2);
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
            const [receiptRows, detailRows, supplierRows, productRows, batchRows] = await Promise.all([
                dataService.getAll<Receipt>('inbound_receipts'),
                dataService.getAll<ReceiptDetail>('inbound_details'),
                dataService.getAll<Supplier>('suppliers'),
                dataService.getAll<Product>('products'),
                dataService.getAll<Batch>('batches'),
            ]);
            setReceipts(receiptRows);
            setDetails(detailRows);
            setSuppliers(supplierRows);
            setProducts(productRows);
            setBatches(batchRows);
        } catch (loadError) {
            console.error('Không thể tải phiếu nhập:', loadError);
            setError(getApiErrorMessage(loadError));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void (async () => { await load(); })();
    }, [load]);

    const fields: ManagementField[] = [
        { name: 'receipt_code', label: 'Mã phiếu nhập', required: true, maxLength: 50 },
        { name: 'supplier_id', label: 'Nhà cung cấp', required: true, options: suppliers.map((row) => ({ value: String(row.id), label: row.name })) },
        { name: 'status', label: 'Trạng thái', required: true, options: statuses.map((value) => ({ value, label: statusLabels[value] })) },
        { name: 'note', label: 'Ghi chú' },
    ];

    const filtered = useMemo(() => receipts.filter((receipt) => {
        const supplier = suppliers.find((row) => row.id === receipt.supplier_id)?.name ?? '';
        const textMatches = `${receipt.receipt_code} ${supplier}`.toLocaleLowerCase().includes(keyword.toLocaleLowerCase());
        return textMatches && (!statusFilter || receipt.status === statusFilter);
    }), [receipts, suppliers, keyword, statusFilter]);

    const resetForm = () => {
        setEditingId(null);
        setForm(emptyForm);
        setReceiptLines([emptyReceiptLine(nextLineKey.current++)]);
        setFormError('');
        setModalOpen(false);
    };

    const edit = (receipt: Receipt) => {
        setEditingId(receipt.id);
        setForm({
            ...emptyForm,
            receipt_code: receipt.receipt_code,
            supplier_id: String(receipt.supplier_id),
            status: receipt.status,
            note: receipt.note ?? '',
        });
        setReceiptLines([]);
        setFormError('');
        setModalOpen(true);
        setError('');
        setSuccess('');
    };

    const startCreate = () => {
        setEditingId(null);
        setForm(emptyForm);
        setReceiptLines([emptyReceiptLine(nextLineKey.current++)]);
        setFormError('');
        setModalOpen(true);
        setError('');
        setSuccess('');
    };

    const addReceiptLine = () => {
        setReceiptLines((lines) => [...lines, emptyReceiptLine(nextLineKey.current++)]);
    };

    const updateReceiptLine = (key: number, field: keyof Omit<ReceiptLineForm, 'key'>, value: string) => {
        setReceiptLines((lines) => lines.map((line) => line.key === key ? { ...line, [field]: value } : line));
    };

    const save = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaving(true);
        setError('');
        setFormError('');
        setSuccess('');
        if (editingId === null && receiptLines.length === 0) {
            setFormError('Phiếu nhập phải có ít nhất một sản phẩm.');
            setSaving(false);
            return;
        }
        if (editingId === null && receiptLines.some((line) =>
            !line.product_id || !line.batch_id || !line.expected_quantity
            || !Number.isInteger(Number(line.expected_quantity)) || Number(line.expected_quantity) <= 0
            || line.actual_quantity === '' || !Number.isInteger(Number(line.actual_quantity))
            || Number(line.actual_quantity) < 0 || Number(line.actual_quantity) > Number(line.expected_quantity))) {
            setFormError('Mỗi dòng cần có sản phẩm, lô hàng, số lượng dự kiến lớn hơn 0 và số lượng thực nhận từ 0 đến số lượng dự kiến.');
            setSaving(false);
            return;
        }
        const payload: ApiRecord = {
            receipt_code: form.receipt_code.trim().toUpperCase(),
            supplier_id: Number(form.supplier_id),
            status: form.status,
            note: form.note.trim() || null,
        };
        if (editingId === null) payload.created_by = currentUser.id;
        let newReceiptId: number | null = null;
        try {
            if (editingId === null) {
                const result = await dataService.create('inbound_receipts', payload);
                newReceiptId = result.id;
                await Promise.all(receiptLines.map((line) => dataService.create('inbound_details', {
                        receipt_id: result.id,
                        product_id: Number(line.product_id),
                        batch_id: Number(line.batch_id),
                        expected_quantity: Number(line.expected_quantity),
                        actual_quantity: Number(line.actual_quantity),
                    })));
                setSuccess('Đã thêm phiếu nhập vào MySQL.');
            } else {
                await dataService.update('inbound_receipts', editingId, payload);
                setSuccess('Đã cập nhật phiếu nhập trong MySQL.');
            }
            resetForm();
            await load();
        } catch (saveError) {
            console.error('Không thể lưu phiếu nhập:', saveError);
            if (newReceiptId !== null) {
                try {
                    await dataService.delete('inbound_receipts', newReceiptId);
                } catch (rollbackError) {
                    console.error('Không thể xóa phiếu nhập sau lỗi chi tiết:', rollbackError);
                    setError(`${getApiErrorMessage(saveError)} Không thể tự hủy phiếu vừa tạo; hãy kiểm tra MySQL.`);
                    await load();
                    setSaving(false);
                    return;
                }
            }
            setFormError(getApiErrorMessage(saveError));
        } finally {
            setSaving(false);
        }
    };

    const remove = async (receipt: Receipt) => {
        if (!window.confirm(`Bạn có chắc muốn xóa phiếu "${receipt.receipt_code}" không?`)) return;
        setError('');
        setSuccess('');
        try {
            await dataService.delete('inbound_receipts', receipt.id);
            if (editingId === receipt.id) resetForm();
            setSuccess('Đã xóa phiếu nhập khỏi MySQL.');
            await load();
        } catch (deleteError) {
            console.error('Không thể xóa phiếu nhập:', deleteError);
            setError(getApiErrorMessage(deleteError));
        }
    };

    const receive = async (receipt: Receipt) => {
        try {
            await dataService.update('inbound_receipts', receipt.id, { status: 'Completed' });
            setSuccess(`Đã xác nhận nhận hàng cho phiếu ${receipt.receipt_code}.`);
            await load();
        } catch (receiveError) {
            console.error('Không thể xác nhận nhận hàng:', receiveError);
            setError(getApiErrorMessage(receiveError));
        }
    };

    return <ManagementPage title="Quản lý lệnh nhập kho" description="Quản lý phiếu nhập và dòng sản phẩm trong MySQL." onRefresh={() => void load()} loading={loading}>
        <ManagementFeedback error={error} success={success} />
        <ManagementSearch value={keyword} onChange={setKeyword} onSubmit={(event) => event.preventDefault()} onReset={() => { setKeyword(''); setStatusFilter(''); }} placeholder="Tìm mã phiếu nhập hoặc nhà cung cấp..." loading={loading} filter={statusFilter} onFilterChange={setStatusFilter} filterOptions={statuses.map((value) => ({ value, label: statusLabels[value] }))} filterLabel="Tất cả trạng thái" />
        <div className="inbound-create-action"><button type="button" onClick={startCreate}>＋ Tạo phiếu nhập</button></div>
        <ManagementList title="Danh sách phiếu nhập" count={filtered.length} loading={loading} headers={['Mã phiếu', 'Nhà cung cấp', 'Chi tiết hàng', 'Ngày tạo', 'Trạng thái', 'Thao tác']} emptyMessage="Chưa có phiếu nhập phù hợp.">
            {filtered.map((receipt) => {
                const lines = details.filter((row) => row.receipt_id === receipt.id);
                return <tr key={receipt.id}>
                    <td>{receipt.receipt_code}</td><td>{suppliers.find((row) => row.id === receipt.supplier_id)?.name ?? `#${receipt.supplier_id}`}</td>
                    <td>{lines.length ? lines.map((line) => `${products.find((row) => row.id === line.product_id)?.sku ?? `SKU #${line.product_id}`} / ${batches.find((row) => row.id === line.batch_id)?.batch_code ?? `Lô #${line.batch_id}`} × ${line.actual_quantity}/${line.expected_quantity}`).join('; ') : receipt.note || '—'}</td>
                    <td>{formatManagementDate(receipt.created_at)}</td><td><ManagementStatus value={receipt.status} labels={statusLabels} /></td>
                    <td className="inbound-row-actions">
                        {receipt.status !== 'Completed' && receipt.status !== 'Cancelled' && <button type="button" onClick={() => void receive(receipt)}>Nhận hàng</button>}
                        <ManagementRowActions onEdit={() => edit(receipt)} onDelete={() => void remove(receipt)} />
                    </td>
                </tr>;
            })}
        </ManagementList>
        {modalOpen && <div className="modal-backdrop no-print" onMouseDown={(event) => event.target === event.currentTarget && resetForm()}>
            <form className="form-modal inbound-modal" onSubmit={(event) => void save(event)}>
                <div className="modal-heading">
                    <div><span className="eyebrow">WMS / QUẢN LÝ NHẬP KHO</span><h2>{editingId === null ? 'Tạo phiếu nhập kho' : 'Chỉnh sửa phiếu nhập kho'}</h2></div>
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
                {editingId === null && <section className="inbound-lines">
                    <div className="inbound-lines-heading"><div><h3>Sản phẩm trong phiếu nhập</h3><p>Thêm một hoặc nhiều sản phẩm và lô hàng vào cùng phiếu.</p></div><button type="button" onClick={addReceiptLine}>＋ Thêm sản phẩm</button></div>
                    {receiptLines.map((line, index) => <div className="inbound-line" key={line.key}>
                        <strong className="inbound-line-number">{index + 1}</strong>
                        <label><span>Sản phẩm *</span><select required value={line.product_id} onChange={(event) => updateReceiptLine(line.key, 'product_id', event.target.value)}>
                            <option value="">-- Chọn sản phẩm --</option>
                            {products.map((product) => <option key={product.id} value={product.id}>{product.sku} - {product.name}</option>)}
                        </select></label>
                        <label><span>Lô hàng *</span><select required value={line.batch_id} onChange={(event) => updateReceiptLine(line.key, 'batch_id', event.target.value)}>
                            <option value="">-- Chọn lô hàng --</option>
                            {batches.filter((batch) => !line.product_id || products.find((product) => product.id === Number(line.product_id))?.id === batch.product_id).map((batch) => <option key={batch.id} value={batch.id}>{batch.batch_code}</option>)}
                        </select></label>
                        <label><span>Số lượng dự kiến *</span><input type="number" required min={1} step={1} value={line.expected_quantity} onChange={(event) => updateReceiptLine(line.key, 'expected_quantity', event.target.value)} /></label>
                        <label><span>Thực nhận</span><input type="number" required min={0} step={1} value={line.actual_quantity} onChange={(event) => updateReceiptLine(line.key, 'actual_quantity', event.target.value)} /></label>
                        <button type="button" className="inbound-line-remove" onClick={() => setReceiptLines((lines) => lines.filter((item) => item.key !== line.key))} disabled={receiptLines.length === 1} aria-label={`Xóa sản phẩm dòng ${index + 1}`}>×</button>
                    </div>)}
                </section>}
                {editingId !== null && <p className="inbound-edit-note">Chỉnh sửa thông tin phiếu. Các dòng sản phẩm hiện có được giữ nguyên.</p>}
                {formError && <div className="management-feedback error inbound-form-error" role="alert">{formError}</div>}
                <div className="modal-footer">
                    <button type="button" className="button secondary" onClick={resetForm}>Hủy</button>
                    <button type="submit" className="button primary" disabled={saving}>{saving ? 'Đang lưu...' : editingId === null ? 'Tạo phiếu nhập' : 'Lưu thay đổi'}</button>
                </div>
            </form>
        </div>}
    </ManagementPage>;
}
