const db = require('../common/db');
const outbound_detailsModel = {
  getAll: (cb) => { db.query('SELECT * FROM `outbound_details`', cb); },
  getById: (id, cb) => { db.query('SELECT * FROM `outbound_details` WHERE `id` = ?', [id], cb); },
  create: (data, cb) => { db.query('INSERT INTO `outbound_details` SET ?', data, cb); },
  update: (id, data, cb) => { db.query('UPDATE `outbound_details` SET ? WHERE `id` = ?', [data, id], cb); },
  delete: (id, cb) => { db.query('DELETE FROM `outbound_details` WHERE `id` = ?', [id], cb); }
};
module.exports = outbound_detailsModel;
