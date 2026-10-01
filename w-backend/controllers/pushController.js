const Model = require('../models/pushModel');

exports.getTasksByPusherId = (req, res) => {
    Model.getTasksByPusherId(req.params.pusherId, (err, r) => 
        err ? res.status(500).json({ success: false, error: err }) : res.json({ success: true, data: r })
    );
};

exports.getByOrderId = (req, res) => {
    Model.getByOrderId(req.params.orderId, (err, r) => 
        err ? res.status(500).json({ success: false, error: err }) : res.json({ success: true, data: r })
    );
};

exports.updateTaskProgress = (req, res) => {
    const { actual_bin_id } = req.body;
    Model.updateTaskProgress(req.params.taskId, actual_bin_id, (err, r) => 
        err ? res.status(500).json({ success: false, error: err }) : res.json({ success: true, data: r })
    );
};