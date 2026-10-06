const db = require('../common/db');
const shippingsModel = {
  getAll: (cb) => {
    db.query('SELECT `id`, `name`, `phone`, `contact_person`, `created_at` FROM `shippings` ORDER BY `id` DESC', cb);
  },
  getById: (id, cb) => {
    db.query('SELECT `id`, `name`, `phone`, `contact_person`, `created_at` FROM `shippings` WHERE `id` = ?', [id], cb);
  },
  search: (keyword, cb) => {
    const term = `%${keyword}%`;
    db.query(
      'SELECT `id`, `name`, `phone`, `contact_person`, `created_at` FROM `shippings` WHERE `name` LIKE ? OR `phone` LIKE ? OR `contact_person` LIKE ? ORDER BY `id` DESC',
      [term, term, term],
      cb
    );
  },
  create: (data, cb) => {
    db.query('INSERT INTO `shippings` SET ?', data, cb);
  },
  update: (id, data, cb) => {
    db.query('UPDATE `shippings` SET ? WHERE `id` = ?', [data, id], cb);
  },
  delete: (id, cb) => {
    db.query('DELETE FROM `shippings` WHERE `id` = ?', [id], cb);
  }
};
module.exports = shippingsModel;
