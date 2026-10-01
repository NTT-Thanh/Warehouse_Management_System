const db = require('../common/db');
const inventory_auditsModel = {
  getAll: (cb) => { db.query('SELECT * FROM `inventory_audits`', cb); },
  getById: (id, cb) => { db.query('SELECT * FROM `inventory_audits` WHERE `id` = ?', [id], cb); },
  create: (data, cb) => { db.query('INSERT INTO `inventory_audits` SET ?', data, cb); },
  update: (id, data, cb) => { db.query('UPDATE `inventory_audits` SET ? WHERE `id` = ?', [data, id], cb); },
  delete: (id, cb) => { db.query('DELETE FROM `inventory_audits` WHERE `id` = ?', [id], cb); }
};
module.exports = inventory_auditsModel;
