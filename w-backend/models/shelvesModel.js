const db = require('../common/db');
const shelvesModel = {
  getAll: (cb) => { db.query('SELECT * FROM `shelves`', cb); },
  getById: (id, cb) => { db.query('SELECT * FROM `shelves` WHERE `id` = ?', [id], cb); },
  create: (data, cb) => { db.query('INSERT INTO `shelves` SET ?', data, cb); },
  update: (id, data, cb) => { db.query('UPDATE `shelves` SET ? WHERE `id` = ?', [data, id], cb); },
  delete: (id, cb) => { db.query('DELETE FROM `shelves` WHERE `id` = ?', [id], cb); }
};
module.exports = shelvesModel;
