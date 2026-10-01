const Model = require('../models/picking_taskModel');

exports.getByPickerId = (req, res) => {
    Model.getByPickerId(req.params.pickerId, (err, r) => 
        err ? res.status(500).json({ success: false, error: err }) : res.json({ success: true, data: r })
    );
};