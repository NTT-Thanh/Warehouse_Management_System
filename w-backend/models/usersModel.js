const db = require('../common/db');
const usersModel = {
  getAll: (cb) => { db.query('SELECT * FROM `users`', cb); },
  getById: (id, cb) => { db.query('SELECT * FROM `users` WHERE `id` = ?', [id], cb); },
  create: (data, cb) => { db.query('INSERT INTO `users` SET ?', data, cb); },
  update: (id, data, cb) => { db.query('UPDATE `users` SET ? WHERE `id` = ?', [data, id], cb); },
  delete: (id, cb) => { db.query('DELETE FROM `users` WHERE `id` = ?', [id], cb); }
};
module.exports = usersModel;
