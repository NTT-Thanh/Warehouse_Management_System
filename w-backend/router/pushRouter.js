const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/pushController');

// Route lấy danh sách task dành riêng cho Pusher
router.get('/tasks/pusher/:pusherId', ctrl.getTasksByPusherId);

// Route lấy chi tiết các mặt hàng cần cất trong phiếu nhập
router.get('/order/:orderId', ctrl.getByOrderId);

// Route cập nhật trạng thái/vị trí cất hàng
router.put('/:taskId', ctrl.updateTaskProgress);

module.exports = router;