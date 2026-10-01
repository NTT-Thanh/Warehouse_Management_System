const db = require('../common/db');
const racksModel = {
  getAll: (cb) => { db.query('SELECT * FROM `racks`', cb); },
  getById: (id, cb) => { db.query('SELECT * FROM `racks` WHERE `id` = ?', [id], cb); },
  create: (data, cb) => { db.query('INSERT INTO `racks` SET ?', data, cb); },
  update: (id, data, cb) => { db.query('UPDATE `racks` SET ? WHERE `id` = ?', [data, id], cb); },
  delete: (id, cb) => { db.query('DELETE FROM `racks` WHERE `id` = ?', [id], cb); }
};
module.exports = racksModel;
