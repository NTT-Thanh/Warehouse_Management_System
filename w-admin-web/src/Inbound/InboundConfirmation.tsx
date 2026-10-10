import { useCallback, useEffect, useMemo, useState } from 'react';
import { dataService, inboundService } from '../API/api';
import { getApiErrorMessage } from '../API/errors';
import { ManagementFeedback, ManagementList, ManagementPage, ManagementStatus } from '../components/ManagementUI';
import './Inbound.css';

type Receipt = {
    id: number;
    receipt_code: string;
    supplier_id: number;
    status: string;
    note: string | null;
};

type ReceiptDetail = {
    id: number;
    receipt_id: number;
    product_id: number;
    batch_id: number;
    expected_quantity: number;
    actual_quantity: number;
    note: string | null;
    confirmed: number | boolean;
};

type Supplier = { id: number; name: string };
type Product = { id: number; sku: string; name: string };
type Batch = { id: number; batch_code: string };

const receiptStatusLabels: Record<string, string> = {
    Pending: 'Chờ xử lý',
    Receiving: 'Đang nhận hàng',
    Completed: 'Hoàn thành',
    Cancelled: 'Đã hủy',
};

export default function InboundConfirmationManagement() {
    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [details, setDetails] = useState<ReceiptDetail[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [batches, setBatches] = useState<Batch[]>([]);
    const [selectedDetail, setSelectedDetail] = useState<ReceiptDetail | null>(null);
    const [actualQuantity, setActualQuantity] = useState('');
    const [note, setNote] = useState('');
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
            console.error('Không thể tải sản phẩm cần xác nhận nhập kho:', loadError);
            setError(getApiErrorMessage(loadError));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void (async () => { await load(); })();
    }, [load]);

    useEffect(() => {
        if (!selectedDetail) return;
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !saving) setSelectedDetail(null);
        };
        window.addEventListener('keydown', closeOnEscape);
        return () => window.removeEventListener('keydown', closeOnEscape);
    }, [selectedDetail, saving]);

    const pendingDetails = useMemo(() => details.filter((detail) => {
        const receipt = receipts.find((row) => row.id === detail.receipt_id);
        return receipt
            && receipt.status !== 'Completed'
            && receipt.status !== 'Cancelled'
            && !detail.confirmed;
    }), [details, receipts]);

    const openDetail = (detail: ReceiptDetail) => {
        setSelectedDetail(detail);
        setActualQuantity(String(detail.actual_quantity ?? 0));
        setNote(detail.note ?? '');
        setError('');
        setSuccess('');
    };

    const confirm = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedDetail || actualQuantity.trim() === ''
            || !Number.isInteger(Number(actualQuantity)) || Number(actualQuantity) < 0) {
            setError('Số lượng thực nhận phải là số nguyên không âm.');
            return;
        }

        const receipt = receipts.find((row) => row.id === selectedDetail.receipt_id);
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            const result = await inboundService.confirmDetail(selectedDetail.id, Number(actualQuantity), note);
            setSelectedDetail(null);
            setSuccess(result.receipt_status === 'Completed'
                ? `Đã xác nhận sản phẩm. Phiếu ${receipt?.receipt_code ?? ''} đã hoàn thành.`
                : `Đã xác nhận sản phẩm trong phiếu ${receipt?.receipt_code ?? ''}.`);
            await load();
        } catch (confirmError) {
            console.error('Không thể xác nhận sản phẩm nhập kho:', confirmError);
            setError(getApiErrorMessage(confirmError));
        } finally {
            setSaving(false);
        }
    };

    const selectedReceipt = selectedDetail
        ? receipts.find((receipt) => receipt.id === selectedDetail.receipt_id)
        : undefined;
    const selectedProduct = selectedDetail
        ? products.find((product) => product.id === selectedDetail.product_id)
        : undefined;
    const selectedBatch = selectedDetail
        ? batches.find((batch) => batch.id === selectedDetail.batch_id)
        : undefined;

    return <ManagementPage
        title="Xác nhận nhập kho"
        description="Ghi nhận số lượng thực nhận và ghi chú riêng cho từng sản phẩm trong phiếu nhập."
        onRefresh={() => void load()}
        loading={loading}
    >
        <ManagementFeedback error={error} success={success} />
        <ManagementList
            title="Sản phẩm chờ xác nhận"
            count={pendingDetails.length}
            loading={loading}
            headers={['Mã phiếu', 'Sản phẩm', 'Lô hàng', 'Số lượng dự kiến', 'Trạng thái phiếu', 'Thao tác']}
            emptyMessage="Không còn sản phẩm nào cần xác nhận nhập kho."
        >
            {pendingDetails.map((detail) => {
                const receipt = receipts.find((row) => row.id === detail.receipt_id);
                const product = products.find((row) => row.id === detail.product_id);
                const batch = batches.find((row) => row.id === detail.batch_id);
                return <tr key={detail.id}>
                    <td className="management-primary">{receipt?.receipt_code ?? `Phiếu #${detail.receipt_id}`}</td>
                    <td>{product ? `${product.sku} — ${product.name}` : `SKU #${detail.product_id}`}</td>
                    <td>{batch?.batch_code ?? `Lô #${detail.batch_id}`}</td>
                    <td>{detail.expected_quantity}</td>
                    <td>{receipt && <ManagementStatus value={receipt.status} labels={receiptStatusLabels} />}</td>
                    <td className="inbound-row-actions">
                        <button type="button" onClick={() => openDetail(detail)}>Chi tiết</button>
                    </td>
                </tr>;
            })}
        </ManagementList>
        {selectedDetail && selectedReceipt && <div
            className="modal-backdrop no-print"
            onMouseDown={(event) => event.target === event.currentTarget && !saving && setSelectedDetail(null)}
        >
            <form className="form-modal inbound-confirmation-modal" onSubmit={(event) => void confirm(event)}>
                <div className="modal-heading">
                    <div><span className="eyebrow">WMS / XÁC NHẬN NHẬP KHO</span><h2>Chi tiết {selectedReceipt.receipt_code}</h2></div>
                    <button type="button" className="modal-close" onClick={() => setSelectedDetail(null)} aria-label="Đóng" disabled={saving}>×</button>
                </div>
                <div className="detail-list">
                    <div><span>Nhà cung cấp</span><strong>{suppliers.find((row) => row.id === selectedReceipt.supplier_id)?.name ?? '—'}</strong></div>
                    <div><span>Sản phẩm</span><strong>{selectedProduct ? `${selectedProduct.sku} — ${selectedProduct.name}` : `SKU #${selectedDetail.product_id}`}</strong></div>
                    <div><span>Lô hàng</span><strong>{selectedBatch?.batch_code ?? `Lô #${selectedDetail.batch_id}`}</strong></div>
                    <div><span>Số lượng dự kiến</span><strong>{selectedDetail.expected_quantity}</strong></div>
                    <div><span>Ghi chú phiếu nhập</span><strong>{selectedReceipt.note || '—'}</strong></div>
                </div>
                <div className="inbound-confirmation-fields">
                    <label>
                        <span>Số lượng thực nhận *</span>
                        <input
                            type="number"
                            required
                            min={0}
                            step={1}
                            value={actualQuantity}
                            onChange={(event) => setActualQuantity(event.target.value)}
                            disabled={saving}
                        />
                    </label>
                    <label>
                        <span>Ghi chú sản phẩm</span>
                        <textarea value={note} onChange={(event) => setNote(event.target.value)} disabled={saving} rows={3} />
                    </label>
                </div>
                {error && <div className="management-feedback error inbound-form-error" role="alert">{error}</div>}
                <div className="modal-footer">
                    <button type="button" className="button secondary" onClick={() => setSelectedDetail(null)} disabled={saving}>Hủy</button>
                    <button type="submit" className="button primary" disabled={saving}>
                        {saving ? 'Đang xác nhận...' : 'Xác nhận nhập'}
                    </button>
                </div>
            </form>
        </div>}
    </ManagementPage>;
}
