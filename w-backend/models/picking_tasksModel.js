const db = require('../common/db');
const picking_tasksModel = {
  getAll: (cb) => { db.query('SELECT * FROM `picking_tasks`', cb); },
  getById: (id, cb) => { db.query('SELECT * FROM `picking_tasks` WHERE `id` = ?', [id], cb); },
  create: (data, cb) => { db.query('INSERT INTO `picking_tasks` SET ?', data, cb); },
  update: (id, data, cb) => { db.query('UPDATE `picking_tasks` SET ? WHERE `id` = ?', [data, id], cb); },
  delete: (id, cb) => { db.query('DELETE FROM `picking_tasks` WHERE `id` = ?', [id], cb); }
};
module.exports = picking_tasksModel;
