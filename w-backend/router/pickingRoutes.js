const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/pickingController');

// Lấy danh sách task lấy hàng theo ID đơn xuất
router.get('/order/:orderId', ctrl.getByOrderId);

// Cập nhật số lượng đã lấy của một task cụ thể
router.put('/:id', ctrl.updateProgress);

module.exports = router;