const db = require('../common/db');
const zonesModel = {
  getAll: (cb) => { db.query('SELECT * FROM `zones`', cb); },
  getById: (id, cb) => { db.query('SELECT * FROM `zones` WHERE `id` = ?', [id], cb); },
  create: (data, cb) => { db.query('INSERT INTO `zones` SET ?', data, cb); },
  update: (id, data, cb) => { db.query('UPDATE `zones` SET ? WHERE `id` = ?', [data, id], cb); },
  delete: (id, cb) => { db.query('DELETE FROM `zones` WHERE `id` = ?', [id], cb); }
};
module.exports = zonesModel;
