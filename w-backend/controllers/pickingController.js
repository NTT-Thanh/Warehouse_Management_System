const PickingModel = require('../models/pickingModel');

exports.getByOrderId = (req, res) => {
    const orderId = Number(req.params.orderId);
    const pickerId = Number(req.query.pickerId);
    if (!Number.isInteger(orderId) || orderId <= 0 || !Number.isInteger(pickerId) || pickerId <= 0) {
        return res.status(400).json({ success: false, message: 'A valid orderId and pickerId are required.' });
    }

    PickingModel.getByOrderId(orderId, pickerId, (err, results) => {
        if (err) {
            console.error('Unable to load assigned picking tasks:', err);
            return res.status(500).json({ success: false, message: 'Unable to load picking tasks.' });
        }
        res.json({ success: true, data: results });
    });
};

exports.getByTaskId = (req, res) => {
    const taskId = Number(req.params.taskId);
    const pickerId = Number(req.query.pickerId);
    if (!Number.isInteger(taskId) || taskId <= 0 || !Number.isInteger(pickerId) || pickerId <= 0) {
        return res.status(400).json({ success: false, message: 'A valid taskId and pickerId are required.' });
    }

    PickingModel.getByTaskId(taskId, pickerId, (err, results) => {
        if (err) {
            console.error('Unable to load assigned picking task:', err);
            return res.status(500).json({ success: false, message: 'Unable to load picking task.' });
        }
        res.json({ success: true, data: results });
    });
};

exports.updateProgress = (req, res) => {
    const id = Number(req.params.id);
    const pickerId = Number(req.body.picker_id);
    const { picked_quantity } = req.body;
    if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(pickerId) || pickerId <= 0
        || !Number.isInteger(picked_quantity) || picked_quantity < 0) {
        return res.status(400).json({ success: false, message: 'A valid task, picker, and picked quantity are required.' });
    }

    PickingModel.updatePickedQuantity(id, pickerId, picked_quantity, (err, result) => {
        if (err) {
            console.error('Unable to update picking task progress:', err);
            return res.status(500).json({ success: false, message: 'Unable to update picking task progress.' });
        }
        if (result.affectedRows === 0) {
            return res.status(409).json({ success: false, message: 'Task is not assigned to this picker or picked quantity exceeds required quantity.' });
        }
        res.json({ success: true, message: 'Cập nhật tiến độ thành công' });
    });
};

exports.completeTask = (req, res) => {
    const id = Number(req.params.id);
    const pickerId = Number(req.body.picker_id);
    if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(pickerId) || pickerId <= 0) {
        return res.status(400).json({ success: false, message: 'A valid task and picker are required.' });
    }

    PickingModel.completeTask(id, pickerId, (err, completed) => {
        if (err) {
            console.error('Unable to complete picking task:', err);
            return res.status(500).json({ success: false, message: 'Unable to complete picking task.' });
        }
        if (!completed) {
            return res.status(409).json({ success: false, message: 'Task is not assigned to this picker or required quantity has not been picked.' });
        }
        res.json({ success: true, message: 'Task đã được hoàn thành.' });
    });
};