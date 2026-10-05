const db = require('../common/db');
const usersModel = {
  getAll: (cb) => { db.query('SELECT `id`, `username`, `full_name`, `role`, `created_at` FROM `users`', cb); },
  getById: (id, cb) => { db.query('SELECT `id`, `username`, `full_name`, `role`, `created_at` FROM `users` WHERE `id` = ?', [id], cb); },
  getByUsername: (username, cb) => { db.query('SELECT `id`, `username`, `password`, `full_name`, `role`, `created_at` FROM `users` WHERE `username` = ? LIMIT 1', [username], cb); },
  create: (data, cb) => { db.query('INSERT INTO `users` SET ?', data, cb); },
  update: (id, data, cb) => { db.query('UPDATE `users` SET ? WHERE `id` = ?', [data, id], cb); },
  delete: (id, cb) => { db.query('DELETE FROM `users` WHERE `id` = ?', [id], cb); }
};
module.exports = usersModel;
