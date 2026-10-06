const Model = require('../models/shippingsModel');

const allowedFields = ['name', 'phone', 'contact_person'];

function validateId(id) {
  return /^\d+$/.test(id) && Number(id) > 0;
}

function getPayload(body, requireName) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Shipping data must be an object' };
  }

  const payload = {};
  allowedFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      const value = body[field];
      if (value !== null && typeof value !== 'string') {
        payload.error = `${field} must be a string`;
        return;
      }
      payload[field] = typeof value === 'string' ? value.trim() || null : null;
    }
  });

  if (payload.error) return { error: payload.error };
  if (Object.prototype.hasOwnProperty.call(body, 'name') && !payload.name) {
    return { error: 'Shipping name cannot be empty' };
  }
  if (requireName && (typeof payload.name !== 'string' || !payload.name)) {
    return { error: 'Shipping name is required' };
  }
  if (payload.name && payload.name.length > 100) return { error: 'Shipping name must not exceed 100 characters' };
  if (payload.phone && payload.phone.length > 20) return { error: 'Phone must not exceed 20 characters' };
  if (payload.contact_person && payload.contact_person.length > 100) {
    return { error: 'Contact person must not exceed 100 characters' };
  }
  if (!Object.keys(payload).length) return { error: 'At least one shipping field is required' };
  return { payload };
}

exports.getAll = (req, res) => {
  Model.getAll((err, rows) => {
    if (err) return res.status(500).json({ message: 'Unable to load shipping companies' });
    return res.json(rows);
  });
};

exports.getById = (req, res) => {
  if (!validateId(req.params.id)) return res.status(400).json({ message: 'Invalid shipping id' });
  Model.getById(req.params.id, (err, rows) => {
    if (err) return res.status(500).json({ message: 'Unable to load shipping company' });
    if (!rows.length) return res.status(404).json({ message: 'Shipping company not found' });
    return res.json(rows[0]);
  });
};

exports.search = (req, res) => {
  const keyword = typeof req.query.keyword === 'string' ? req.query.keyword.trim() : '';
  if (!keyword) return res.status(400).json({ message: 'Search keyword is required' });
  Model.search(keyword, (err, rows) => {
    if (err) return res.status(500).json({ message: 'Unable to search shipping companies' });
    return res.json(rows);
  });
};

exports.create = (req, res) => {
  const { error, payload } = getPayload(req.body, true);
  if (error) return res.status(400).json({ message: error });
  Model.create(payload, (err, result) => {
    if (err) return res.status(500).json({ message: 'Unable to create shipping company', code: err.code });
    return res.status(201).json({ id: result.insertId });
  });
};

exports.update = (req, res) => {
  if (!validateId(req.params.id)) return res.status(400).json({ message: 'Invalid shipping id' });
  const { error, payload } = getPayload(req.body, false);
  if (error) return res.status(400).json({ message: error });
  Model.update(req.params.id, payload, (err, result) => {
    if (err) return res.status(500).json({ message: 'Unable to update shipping company', code: err.code });
    if (!result.affectedRows) return res.status(404).json({ message: 'Shipping company not found' });
    return res.json({ message: 'Shipping company updated' });
  });
};

exports.delete = (req, res) => {
  if (!validateId(req.params.id)) return res.status(400).json({ message: 'Invalid shipping id' });
  Model.delete(req.params.id, (err, result) => {
    if (err?.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({ message: 'Shipping company is in use by an outbound order', code: err.code });
    }
    if (err) return res.status(500).json({ message: 'Unable to delete shipping company', code: err.code });
    if (!result.affectedRows) return res.status(404).json({ message: 'Shipping company not found' });
    return res.json({ message: 'Shipping company deleted' });
  });
};
