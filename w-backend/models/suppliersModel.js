const db = require('../common/db');
const suppliersModel = {
  getAll: (cb) => { db.query('SELECT * FROM `suppliers`', cb); },
  getById: (id, cb) => { db.query('SELECT * FROM `suppliers` WHERE `id` = ?', [id], cb); },
  create: (data, cb) => { db.query('INSERT INTO `suppliers` SET ?', data, cb); },
  update: (id, data, cb) => { db.query('UPDATE `suppliers` SET ? WHERE `id` = ?', [data, id], cb); },
  delete: (id, cb) => { db.query('DELETE FROM `suppliers` WHERE `id` = ?', [id], cb); }
};
module.exports = suppliersModel;
