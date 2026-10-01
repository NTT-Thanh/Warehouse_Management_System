const db = require('../common/db');
const inbound_detailsModel = {
  getAll: (cb) => { db.query('SELECT * FROM `inbound_details`', cb); },
  getById: (id, cb) => { db.query('SELECT * FROM `inbound_details` WHERE `id` = ?', [id], cb); },
  create: (data, cb) => { db.query('INSERT INTO `inbound_details` SET ?', data, cb); },
  update: (id, data, cb) => { db.query('UPDATE `inbound_details` SET ? WHERE `id` = ?', [data, id], cb); },
  delete: (id, cb) => { db.query('DELETE FROM `inbound_details` WHERE `id` = ?', [id], cb); }
};
module.exports = inbound_detailsModel;
