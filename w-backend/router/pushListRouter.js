const express = require('express');
const router = express.Router();
const pushListController = require('../controllers/pushListController');

// API lấy danh sách task putaway của một nhân viên cất hàng
router.get('/list/:pusherId', pushListController.getPutawayTasksByPusher);

module.exports = router;