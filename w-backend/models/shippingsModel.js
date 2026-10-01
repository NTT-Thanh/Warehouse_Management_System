const db = require('../common/db');
const shippingsModel = {
  getAll: (cb) => { db.query('SELECT * FROM `shippings`', cb); },
  getById: (id, cb) => { db.query('SELECT * FROM `shippings` WHERE `id` = ?', [id], cb); },
  create: (data, cb) => { db.query('INSERT INTO `shippings` SET ?', data, cb); },
  update: (id, data, cb) => { db.query('UPDATE `shippings` SET ? WHERE `id` = ?', [data, id], cb); },
  delete: (id, cb) => { db.query('DELETE FROM `shippings` WHERE `id` = ?', [id], cb); }
};
module.exports = shippingsModel;
