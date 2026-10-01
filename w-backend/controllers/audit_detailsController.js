const Model = require('../models/audit_detailsModel');
exports.getAll = (req, res) => Model.getAll((err, r) => err ? res.status(500).json(err) : res.json(r));
exports.getById = (req, res) => Model.getById(req.params.id, (err, r) => err ? res.status(500).json(err) : res.json(r[0]));
exports.create = (req, res) => Model.create(req.body, (err, r) => err ? res.status(500).json(err) : res.json({ id: r.insertId }));
exports.update = (req, res) => Model.update(req.params.id, req.body, (err) => err ? res.status(500).json(err) : res.json({ message: 'Updated' }));
exports.delete = (req, res) => Model.delete(req.params.id, (err) => err ? res.status(500).json(err) : res.json({ message: 'Deleted' }));
