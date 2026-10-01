const db = require('../common/db');
const warehousesModel = {
  getAll: (cb) => { db.query('SELECT * FROM `warehouses`', cb); },
  getById: (id, cb) => { db.query('SELECT * FROM `warehouses` WHERE `id` = ?', [id], cb); },
  create: (data, cb) => { db.query('INSERT INTO `warehouses` SET ?', data, cb); },
  update: (id, data, cb) => { db.query('UPDATE `warehouses` SET ? WHERE `id` = ?', [data, id], cb); },
  delete: (id, cb) => { db.query('DELETE FROM `warehouses` WHERE `id` = ?', [id], cb); }
};
module.exports = warehousesModel;
