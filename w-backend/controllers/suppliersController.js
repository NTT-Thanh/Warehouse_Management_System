const Model = require('../models/suppliersModel');

const allowedFields = ['name', 'phone', 'email', 'address'];
const maxLengths = { name: 150, phone: 20, email: 100, address: 255 };

function isValidId(id) {
  return /^\d+$/.test(id) && Number(id) > 0;
}

function getPayload(body, requireName) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Supplier data must be an object' };
  }

  const payload = {};
  for (const field of allowedFields) {
    if (!Object.prototype.hasOwnProperty.call(body, field)) continue;
    const value = body[field];
    if (value !== null && typeof value !== 'string') {
      return { error: `${field} must be a string` };
    }
    payload[field] = typeof value === 'string' ? value.trim() || null : null;
    if (payload[field] && payload[field].length > maxLengths[field]) {
      return { error: `${field} must not exceed ${maxLengths[field]} characters` };
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, 'name') && !payload.name) {
    return { error: 'Supplier name cannot be empty' };
  }
  if (requireName && !payload.name) return { error: 'Supplier name is required' };
  if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    return { error: 'Email address is invalid' };
  }
  if (!Object.keys(payload).length) return { error: 'At least one supplier field is required' };
  return { payload };
}

exports.getAll = (req, res) => {
  Model.getAll((err, rows) => {
    if (err) return res.status(500).json({ message: 'Unable to load suppliers' });
    return res.json(rows);
  });
};

exports.getById = (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid supplier id' });
  Model.getById(req.params.id, (err, rows) => {
    if (err) return res.status(500).json({ message: 'Unable to load supplier' });
    if (!rows.length) return res.status(404).json({ message: 'Supplier not found' });
    return res.json(rows[0]);
  });
};

exports.search = (req, res) => {
  const keyword = typeof req.query.keyword === 'string' ? req.query.keyword.trim() : '';
  if (!keyword) return res.status(400).json({ message: 'Search keyword is required' });
  Model.search(keyword, (err, rows) => {
    if (err) return res.status(500).json({ message: 'Unable to search suppliers' });
    return res.json(rows);
  });
};

exports.create = (req, res) => {
  const { error, payload } = getPayload(req.body, true);
  if (error) return res.status(400).json({ message: error });
  Model.create(payload, (err, result) => {
    if (err) return res.status(500).json({ message: 'Unable to create supplier', code: err.code });
    return res.status(201).json({ id: result.insertId });
  });
};

exports.update = (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid supplier id' });
  const { error, payload } = getPayload(req.body, false);
  if (error) return res.status(400).json({ message: error });
  Model.update(req.params.id, payload, (err, result) => {
    if (err) return res.status(500).json({ message: 'Unable to update supplier', code: err.code });
    if (!result.affectedRows) return res.status(404).json({ message: 'Supplier not found' });
    return res.json({ message: 'Supplier updated' });
  });
};

exports.delete = (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid supplier id' });
  Model.delete(req.params.id, (err, result) => {
    if (err?.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({ message: 'Supplier is in use by an inbound receipt', code: err.code });
    }
    if (err) return res.status(500).json({ message: 'Unable to delete supplier', code: err.code });
    if (!result.affectedRows) return res.status(404).json({ message: 'Supplier not found' });
    return res.json({ message: 'Supplier deleted' });
  });
};
