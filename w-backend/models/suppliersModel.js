const db = require('../common/db');
const suppliersModel = {
  getAll: (cb) => {
    db.query('SELECT `id`, `name`, `phone`, `email`, `address`, `created_at` FROM `suppliers` ORDER BY `id` DESC', cb);
  },
  getById: (id, cb) => {
    db.query('SELECT `id`, `name`, `phone`, `email`, `address`, `created_at` FROM `suppliers` WHERE `id` = ?', [id], cb);
  },
  search: (keyword, cb) => {
    const term = `%${keyword}%`;
    db.query(
      'SELECT `id`, `name`, `phone`, `email`, `address`, `created_at` FROM `suppliers` WHERE `name` LIKE ? OR `phone` LIKE ? OR `email` LIKE ? OR `address` LIKE ? ORDER BY `id` DESC',
      [term, term, term, term],
      cb
    );
  },
  create: (data, cb) => {
    db.query('INSERT INTO `suppliers` SET ?', data, cb);
  },
  update: (id, data, cb) => {
    db.query('UPDATE `suppliers` SET ? WHERE `id` = ?', [data, id], cb);
  },
  delete: (id, cb) => {
    db.query('DELETE FROM `suppliers` WHERE `id` = ?', [id], cb);
  }
};
module.exports = suppliersModel;
