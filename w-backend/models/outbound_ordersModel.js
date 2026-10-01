const db = require('../common/db');
const outbound_ordersModel = {
  getAll: (cb) => { db.query('SELECT * FROM `outbound_orders`', cb); },
  getById: (id, cb) => { db.query('SELECT * FROM `outbound_orders` WHERE `id` = ?', [id], cb); },
  create: (data, cb) => { db.query('INSERT INTO `outbound_orders` SET ?', data, cb); },
  update: (id, data, cb) => { db.query('UPDATE `outbound_orders` SET ? WHERE `id` = ?', [data, id], cb); },
  delete: (id, cb) => { db.query('DELETE FROM `outbound_orders` WHERE `id` = ?', [id], cb); }
  
};
module.exports = outbound_ordersModel;
