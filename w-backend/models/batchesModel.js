const db = require('../common/db');
const batchesModel = {
  getAll: (cb) => { db.query('SELECT * FROM `batches`', cb); },
  getById: (id, cb) => { db.query('SELECT * FROM `batches` WHERE `id` = ?', [id], cb); },
  create: (data, cb) => { db.query('INSERT INTO `batches` SET ?', data, cb); },
  update: (id, data, cb) => { db.query('UPDATE `batches` SET ? WHERE `id` = ?', [data, id], cb); },
  delete: (id, cb) => { db.query('DELETE FROM `batches` WHERE `id` = ?', [id], cb); }
};
module.exports = batchesModel;
