const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true
}));
app.use(express.json());

app.use('/api/audit_details', require('./router/audit_detailsRouter'));
app.use('/api/batches', require('./router/batchesRouter'));
app.use('/api/bins', require('./router/binsRouter'));
app.use('/api/categories', require('./router/categoriesRouter'));
app.use('/api/inbound_details', require('./router/inbound_detailsRouter'));
app.use('/api/inbound_receipts', require('./router/inbound_receiptsRouter'));
app.use('/api/inventory', require('./router/inventoryRouter'));
app.use('/api/inventory_audits', require('./router/inventory_auditsRouter'));
app.use('/api/locations', require('./router/locationsRouter'));
app.use('/api/outbound_details', require('./router/outbound_detailsRouter'));
app.use('/api/outbound_orders', require('./router/outbound_ordersRouter'));
app.use('/api/picking_tasks', require('./router/picking_tasksRouter'));
app.use('/api/products', require('./router/productsRouter'));
app.use('/api/putaway_tasks', require('./router/putaway_tasksRouter'));
app.use('/api/racks', require('./router/racksRouter'));
app.use('/api/shelves', require('./router/shelvesRouter'));
app.use('/api/shippings', require('./router/shippingsRouter'));
app.use('/api/suppliers', require('./router/suppliersRouter'));
app.use('/api/users', require('./router/usersRouter'));
app.use('/api/warehouses', require('./router/warehousesRouter'));
app.use('/api/zones', require('./router/zonesRouter'));
app.use('/api/picking', require('./router/pickingRoutes'));
app.use('/api/picking_task', require('./router/picking_taskRouter'));
app.use('/api/push', require('./router/pushRouter'));
app.use('/api/pushList', require('./router/pushListRouter'));
// Thay vì chỉ viết: app.listen(3000, () => { ... })
// Hãy sửa thành:
app.listen(3000, '0.0.0.0', () => {
    console.log('Server đang chạy tại cổng 3000');
});
