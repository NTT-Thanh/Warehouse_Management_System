const PickingModel = require('../models/pickingModel');

exports.getByOrderId = (req, res) => {
    PickingModel.getByOrderId(req.params.orderId, (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, error: err });
        }
        res.json({ success: true, data: results });
    });
};

exports.updateProgress = (req, res) => {
    const { id } = req.params;
    const { picked_quantity } = req.body;

    PickingModel.updatePickedQuantity(id, picked_quantity, (err) => {
        if (err) {
            return res.status(500).json({ success: false, error: err });
        }
        res.json({ success: true, message: 'Cập nhật tiến độ thành công' });
    });
};