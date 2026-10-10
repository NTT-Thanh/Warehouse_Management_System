import { useCallback, useEffect, useMemo, useState } from 'react';
import { dataService } from '../API/api';
import { getApiErrorMessage } from '../API/errors';
import { ManagementFeedback, ManagementList, ManagementPage, ManagementStatus } from '../components/ManagementUI';

type OutboundOrder = {
    id: number;
    order_code: string;
    customer_name: string | null;
    shipping_id: number | null;
    tracking_code: string | null;
    status: string;
};

type PickingTask = {
    id: number;
    order_id: number;
    status: string;
};

type Shipping = { id: number; name: string };

const orderStatusLabels: Record<string, string> = {
    Pending: 'Chờ xử lý',
    Allocated: 'Đã phân bổ',
    Picking: 'Đang picking',
    Packing: 'Đang đóng gói',
    Dispatched: 'Đã giao',
    Cancelled: 'Đã hủy',
};

export default function OutboundDispatchManagement() {
    const [orders, setOrders] = useState<OutboundOrder[]>([]);
    const [tasks, setTasks] = useState<PickingTask[]>([]);
    const [shippings, setShippings] = useState<Shipping[]>([]);
    const [loading, setLoading] = useState(true);
    const [dispatchingId, setDispatchingId] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [orderRows, taskRows, shippingRows] = await Promise.all([
                dataService.getAll<OutboundOrder>('outbound_orders'),
                dataService.getAll<PickingTask>('picking_tasks'),
                dataService.getAll<Shipping>('shippings'),
            ]);
            setOrders(orderRows);
            setTasks(taskRows);
            setShippings(shippingRows);
        } catch (loadError) {
            console.error('Không thể tải đơn xuất sẵn sàng giao:', loadError);
            setError(getApiErrorMessage(loadError));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void (async () => { await load(); })();
    }, [load]);

    const readyOrders = useMemo(() => orders.filter((order) => {
        if (order.status === 'Dispatched' || order.status === 'Cancelled') return false;
        const orderTasks = tasks.filter((task) => task.order_id === order.id);
        return orderTasks.length > 0 && orderTasks.every((task) => task.status === 'Completed');
    }), [orders, tasks]);

    const dispatchOrder = async (order: OutboundOrder) => {
        setDispatchingId(order.id);
        setError('');
        setSuccess('');
        try {
            await dataService.update('outbound_orders', order.id, { status: 'Dispatched' });
            setSuccess(`Đơn ${order.order_code} đã được chuyển sang trạng thái Đã giao.`);
            await load();
        } catch (dispatchError) {
            console.error(`Không thể xác nhận giao đơn ${order.order_code}:`, dispatchError);
            setError(getApiErrorMessage(dispatchError));
        } finally {
            setDispatchingId(null);
        }
    };

    return <ManagementPage
        title="Xuất đơn"
        description="Các đơn xuất có toàn bộ nhiệm vụ picking đã hoàn thành, sẵn sàng bàn giao."
        onRefresh={() => void load()}
        loading={loading}
    >
        <ManagementFeedback error={error} success={success} />
        <ManagementList
            title="Đơn xuất sẵn sàng giao"
            count={readyOrders.length}
            loading={loading}
            headers={['Mã đơn', 'Khách hàng / nơi nhận', 'Đơn vị vận chuyển', 'Mã vận đơn', 'Nhiệm vụ', 'Trạng thái', 'Thao tác']}
            emptyMessage="Chưa có đơn xuất nào có toàn bộ nhiệm vụ picking hoàn thành."
        >
            {readyOrders.map((order) => {
                const orderTasks = tasks.filter((task) => task.order_id === order.id);
                return <tr key={order.id}>
                    <td className="management-primary">{order.order_code}</td>
                    <td>{order.customer_name || '—'}</td>
                    <td>{shippings.find((shipping) => shipping.id === order.shipping_id)?.name ?? '—'}</td>
                    <td>{order.tracking_code || '—'}</td>
                    <td>{orderTasks.length} nhiệm vụ</td>
                    <td><ManagementStatus value={order.status} labels={orderStatusLabels} /></td>
                    <td>
                        <button
                            type="button"
                            className="button primary"
                            onClick={() => void dispatchOrder(order)}
                            disabled={dispatchingId !== null || loading}
                        >
                            {dispatchingId === order.id ? 'Đang xuất...' : 'Xuất đơn'}
                        </button>
                    </td>
                </tr>;
            })}
        </ManagementList>
    </ManagementPage>;
}
