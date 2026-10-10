const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/pickingController');

// Lấy danh sách task lấy hàng theo ID đơn xuất
router.get('/order/:orderId', ctrl.getByOrderId);

// Lấy một task được giao cụ thể
router.get('/task/:taskId', ctrl.getByTaskId);

// Đánh dấu hoàn thành một task đã lấy đủ số lượng
router.put('/:id/complete', ctrl.completeTask);

// Cập nhật số lượng đã lấy của một task cụ thể
router.put('/:id', ctrl.updateProgress);

module.exports = router;