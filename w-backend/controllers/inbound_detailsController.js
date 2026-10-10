const Model = require('../models/inbound_detailsModel');
exports.getAll = (req, res) => Model.getAll((err, r) => err ? res.status(500).json(err) : res.json(r));
exports.getById = (req, res) => Model.getById(req.params.id, (err, r) => err ? res.status(500).json(err) : res.json(r[0]));
exports.create = (req, res) => Model.create(req.body, (err, r) => err ? res.status(500).json(err) : res.json({ id: r.insertId }));
exports.update = (req, res) => Model.update(req.params.id, req.body, (err) => err ? res.status(500).json(err) : res.json({ message: 'Updated' }));
exports.confirm = (req, res) => {
  const actualQuantity = req.body.actual_quantity;
  const note = req.body.note;
  if (!Number.isInteger(actualQuantity) || actualQuantity < 0 || (note !== null && typeof note !== 'string')) {
    return res.status(400).json({ message: 'Số lượng thực nhận phải là số nguyên không âm và ghi chú phải là văn bản.' });
  }
  Model.confirm(req.params.id, actualQuantity, note, (err, result) => {
    if (err) {
      const status = err.code === 'INBOUND_DETAIL_NOT_FOUND' ? 404
        : err.code === 'INBOUND_RECEIPT_CLOSED' || err.code === 'INBOUND_DETAIL_CONFIRMED' ? 409
          : 500;
      return res.status(status).json({ message: err.message });
    }
    return res.json(result);
  });
};
exports.delete = (req, res) => Model.delete(req.params.id, (err) => err ? res.status(500).json(err) : res.json({ message: 'Deleted' }));
