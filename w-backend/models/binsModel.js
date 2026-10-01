const db = require('../common/db');
const binsModel = {
  getAll: (cb) => { db.query('SELECT * FROM `bins`', cb); },
  getById: (id, cb) => { db.query('SELECT * FROM `bins` WHERE `id` = ?', [id], cb); },
  create: (data, cb) => { db.query('INSERT INTO `bins` SET ?', data, cb); },
  update: (id, data, cb) => { db.query('UPDATE `bins` SET ? WHERE `id` = ?', [data, id], cb); },
  delete: (id, cb) => { db.query('DELETE FROM `bins` WHERE `id` = ?', [id], cb); }
};
module.exports = binsModel;
