import { useCallback, useEffect, useMemo, useState } from 'react';
import { dataService } from '../API/api';
import { getApiErrorMessage } from '../API/errors';
import { ManagementFeedback, ManagementList, ManagementPage } from '../components/ManagementUI';
import './Packing.css';

type PickingTask = {
    id: number;
    order_id: number;
    product_id: number;
    picked_quantity: number;
    status: string;
};

type OutboundOrder = {
    id: number;
    order_code: string;
    customer_name: string | null;
    shipping_id: number | null;
    tracking_code: string | null;
};

type Product = { id: number; sku: string; name: string };
type Shipping = { id: number; name: string };

type PackingRecord = {
    taskId: number;
    sku: string;
    productName: string;
    quantity: number;
    orderCode: string;
    customerName: string;
    shippingName: string;
    trackingCode: string;
};

export default function PackingManagement() {
    const [tasks, setTasks] = useState<PickingTask[]>([]);
    const [orders, setOrders] = useState<OutboundOrder[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [shippings, setShippings] = useState<Shipping[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedRecord, setSelectedRecord] = useState<PackingRecord | null>(null);

    const load = useCallback(async () => {
        try {
            const [taskRows, orderRows, productRows, shippingRows] = await Promise.all([
                dataService.getAll<PickingTask>('picking_tasks'),
                dataService.getAll<OutboundOrder>('outbound_orders'),
                dataService.getAll<Product>('products'),
                dataService.getAll<Shipping>('shippings'),
            ]);
            setTasks(taskRows);
            setOrders(orderRows);
            setProducts(productRows);
            setShippings(shippingRows);
        } catch (loadError) {
            console.error('Không thể tải nhiệm vụ đã hoàn thành để đóng gói:', loadError);
            setError(getApiErrorMessage(loadError));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void (async () => { await load(); })();
    }, [load]);

    useEffect(() => {
        if (!selectedRecord) return;
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setSelectedRecord(null);
        };
        window.addEventListener('keydown', closeOnEscape);
        return () => window.removeEventListener('keydown', closeOnEscape);
    }, [selectedRecord]);

    const completedRecords = useMemo(() => tasks
        .filter((task) => task.status === 'Completed')
        .map((task): PackingRecord => {
            const order = orders.find((row) => row.id === task.order_id);
            const product = products.find((row) => row.id === task.product_id);
            const shipping = shippings.find((row) => row.id === order?.shipping_id);
            return {
                taskId: task.id,
                sku: product?.sku ?? `SKU #${task.product_id}`,
                productName: product?.name ?? 'Không tìm thấy sản phẩm',
                quantity: Number(task.picked_quantity) || 0,
                orderCode: order?.order_code ?? `Đơn #${task.order_id}`,
                customerName: order?.customer_name || '—',
                shippingName: shipping?.name ?? '—',
                trackingCode: order?.tracking_code || '—',
            };
        }), [tasks, orders, products, shippings]);

    const exportSlip = (record: PackingRecord) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            window.alert('Trình duyệt đã chặn cửa sổ xuất phiếu. Hãy cho phép cửa sổ bật lên rồi thử lại.');
            return;
        }

        const escapeHtml = (value: string) => value
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
        const fields: [string, string][] = [
            ['Mã đơn', record.orderCode],
            ['Khách hàng', record.customerName],
            ['Đơn vị vận chuyển', record.shippingName],
            ['Mã vận đơn', record.trackingCode],
        ];

        printWindow.document.write(`<!doctype html>
            <html lang="vi">
            <head>
                <meta charset="utf-8">
                <title>Phiếu đóng gói ${escapeHtml(record.orderCode)}</title>
                <style>
                    body { margin: 0; padding: 40px; color: #243447; font: 14px Arial, sans-serif; }
                    main { max-width: 760px; margin: 0 auto; }
                    h1 { margin: 0 0 8px; font-size: 24px; }
                    .subtitle { margin: 0 0 28px; color: #647286; }
                    dl { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 0 0 28px; }
                    dl div { padding: 12px; border: 1px solid #dce3e9; border-radius: 6px; }
                    dt { margin-bottom: 6px; color: #718096; font-size: 12px; }
                    dd { margin: 0; font-weight: 700; overflow-wrap: anywhere; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { padding: 12px; border: 1px solid #dce3e9; text-align: left; }
                    th { background: #f5f7f9; }
                    .quantity { text-align: right; }
                    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 64px; text-align: center; }
                    .signatures div { padding-top: 10px; border-top: 1px solid #9ba8b5; }
                    @media print { body { padding: 0; } }
                </style>
            </head>
            <body>
                <main>
                    <h1>PHIẾU ĐÓNG GÓI</h1>
                    <p class="subtitle">Kho Hưng Yên · Task Picking #${record.taskId}</p>
                    <dl>${fields.map(([label, value]) => `<div><dt>${label}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}</dl>
                    <table>
                        <thead><tr><th>Mã SKU</th><th>Tên sản phẩm</th><th class="quantity">Số lượng</th></tr></thead>
                        <tbody><tr><td>${escapeHtml(record.sku)}</td><td>${escapeHtml(record.productName)}</td><td class="quantity">${record.quantity}</td></tr></tbody>
                    </table>
                    <div class="signatures"><div>Người đóng gói</div><div>Người bàn giao</div></div>
                </main>
                <script>window.onload = () => window.print();</script>
            </body>
            </html>`);
        printWindow.document.close();
    };

    return <ManagementPage title="Đóng gói" description="Các nhiệm vụ picking đã hoàn thành, sẵn sàng đóng gói và xuất phiếu." onRefresh={() => {
        setLoading(true);
        setError('');
        void load();
    }} loading={loading}>
        <ManagementFeedback error={error} success="" />
        <ManagementList title="Nhiệm vụ đã hoàn thành" count={completedRecords.length} loading={loading}
            headers={['Mã SKU', 'Số lượng', 'Mã đơn', 'Khách hàng', 'Đơn vị vận chuyển', 'Mã vận đơn', 'Thao tác']}
            emptyMessage="Chưa có nhiệm vụ picking nào hoàn thành.">
            {completedRecords.map((record) => <tr key={record.taskId}>
                <td className="management-primary">{record.sku}</td>
                <td>{record.quantity}</td>
                <td>{record.orderCode}</td>
                <td>{record.customerName}</td>
                <td>{record.shippingName}</td>
                <td>{record.trackingCode}</td>
                <td><button type="button" className="packing-detail-button" onClick={() => setSelectedRecord(record)}>Chi tiết</button></td>
            </tr>)}
        </ManagementList>
        {selectedRecord && <div className="modal-backdrop no-print" onMouseDown={(event) => event.target === event.currentTarget && setSelectedRecord(null)}>
            <section className="detail-modal packing-detail-modal" role="dialog" aria-modal="true" aria-labelledby="packing-detail-title">
                <div className="modal-heading">
                    <div><span className="eyebrow">WMS / ĐÓNG GÓI</span><h2 id="packing-detail-title">Chi tiết phiếu {selectedRecord.orderCode}</h2></div>
                    <button type="button" className="modal-close" onClick={() => setSelectedRecord(null)} aria-label="Đóng">×</button>
                </div>
                <div className="detail-list">
                    <div><span>Mã đơn</span><strong>{selectedRecord.orderCode}</strong></div>
                    <div><span>Khách hàng</span><strong>{selectedRecord.customerName}</strong></div>
                    <div><span>Đơn vị vận chuyển</span><strong>{selectedRecord.shippingName}</strong></div>
                    <div><span>Mã vận đơn</span><strong>{selectedRecord.trackingCode}</strong></div>
                    <div><span>Mã SKU</span><strong>{selectedRecord.sku}</strong></div>
                    <div><span>Tên sản phẩm</span><strong>{selectedRecord.productName}</strong></div>
                    <div><span>Số lượng đã lấy</span><strong>{selectedRecord.quantity}</strong></div>
                    <div><span>Mã nhiệm vụ</span><strong>#{selectedRecord.taskId}</strong></div>
                </div>
                <div className="modal-footer">
                    <button type="button" className="button secondary" onClick={() => setSelectedRecord(null)}>Đóng</button>
                    <button type="button" className="button primary" onClick={() => exportSlip(selectedRecord)}>Xuất phiếu</button>
                </div>
            </section>
        </div>}
    </ManagementPage>;
}
