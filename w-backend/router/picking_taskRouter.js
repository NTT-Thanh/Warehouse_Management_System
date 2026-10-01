const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/picking_taskController');

router.get('/tasks/picker/:pickerId', ctrl.getByPickerId);

module.exports = router;