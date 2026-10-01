const db = require('../common/db');
const categoriesModel = {
  getAll: (cb) => { db.query('SELECT * FROM `categories`', cb); },
  getById: (id, cb) => { db.query('SELECT * FROM `categories` WHERE `id` = ?', [id], cb); },
  create: (data, cb) => { db.query('INSERT INTO `categories` SET ?', data, cb); },
  update: (id, data, cb) => { db.query('UPDATE `categories` SET ? WHERE `id` = ?', [data, id], cb); },
  delete: (id, cb) => { db.query('DELETE FROM `categories` WHERE `id` = ?', [id], cb); }
};
module.exports = categoriesModel;
