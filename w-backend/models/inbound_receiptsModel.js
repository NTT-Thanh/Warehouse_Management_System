const db = require('../common/db');
const inbound_receiptsModel = {
  getAll: (cb) => { db.query('SELECT * FROM `inbound_receipts`', cb); },
  getById: (id, cb) => { db.query('SELECT * FROM `inbound_receipts` WHERE `id` = ?', [id], cb); },
  create: (data, cb) => { db.query('INSERT INTO `inbound_receipts` SET ?', data, cb); },
  update: (id, data, cb) => { db.query('UPDATE `inbound_receipts` SET ? WHERE `id` = ?', [data, id], cb); },
  delete: (id, cb) => { db.query('DELETE FROM `inbound_receipts` WHERE `id` = ?', [id], cb); }
};
module.exports = inbound_receiptsModel;
