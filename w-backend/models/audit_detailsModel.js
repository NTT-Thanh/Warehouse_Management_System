const db = require('../common/db');
const audit_detailsModel = {
  getAll: (cb) => { db.query('SELECT * FROM `audit_details`', cb); },
  getById: (id, cb) => { db.query('SELECT * FROM `audit_details` WHERE `id` = ?', [id], cb); },
  create: (data, cb) => { db.query('INSERT INTO `audit_details` SET ?', data, cb); },
  update: (id, data, cb) => { db.query('UPDATE `audit_details` SET ? WHERE `id` = ?', [data, id], cb); },
  delete: (id, cb) => { db.query('DELETE FROM `audit_details` WHERE `id` = ?', [id], cb); }
};
module.exports = audit_detailsModel;
