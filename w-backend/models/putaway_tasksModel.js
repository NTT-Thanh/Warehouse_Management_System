const db = require('../common/db');
const putaway_tasksModel = {
  getAll: (cb) => { db.query('SELECT * FROM `putaway_tasks`', cb); },
  getById: (id, cb) => { db.query('SELECT * FROM `putaway_tasks` WHERE `id` = ?', [id], cb); },
  create: (data, cb) => { db.query('INSERT INTO `putaway_tasks` SET ?', data, cb); },
  update: (id, data, cb) => { db.query('UPDATE `putaway_tasks` SET ? WHERE `id` = ?', [data, id], cb); },
  delete: (id, cb) => { db.query('DELETE FROM `putaway_tasks` WHERE `id` = ?', [id], cb); }
};
module.exports = putaway_tasksModel;
