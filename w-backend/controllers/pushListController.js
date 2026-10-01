const PushListModel = require('../models/pushListModel');

exports.getPutawayTasksByPusher = (req, res) => {
    const { pusherId } = req.params;
    PushListModel.getPutawayTasksByPusher(pusherId, (err, results) => {
        if (err) {
            console.error('Lỗi lấy danh sách task putaway:', err);
            return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, data: results });
    });
};