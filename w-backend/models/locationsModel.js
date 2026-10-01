const db = require('../common/db');
const locationsModel = {
  getAll: (cb) => { db.query('SELECT * FROM `locations`', cb); },
  getById: (id, cb) => { db.query('SELECT * FROM `locations` WHERE `id` = ?', [id], cb); },
  create: (data, cb) => { db.query('INSERT INTO `locations` SET ?', data, cb); },
  update: (id, data, cb) => { db.query('UPDATE `locations` SET ? WHERE `id` = ?', [data, id], cb); },
  delete: (id, cb) => { db.query('DELETE FROM `locations` WHERE `id` = ?', [id], cb); }
};
module.exports = locationsModel;
