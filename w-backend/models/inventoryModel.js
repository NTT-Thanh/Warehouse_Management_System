const db = require('../common/db');
const inventoryModel = {
  getAll: (cb) => { db.query('SELECT * FROM `inventory`', cb); },
  getById: (id, cb) => { db.query('SELECT * FROM `inventory` WHERE `id` = ?', [id], cb); },
  create: (data, cb) => { db.query('INSERT INTO `inventory` SET ?', data, cb); },
  update: (id, data, cb) => { db.query('UPDATE `inventory` SET ? WHERE `id` = ?', [data, id], cb); },
  delete: (id, cb) => { db.query('DELETE FROM `inventory` WHERE `id` = ?', [id], cb); },
 searchByItem: (keyword, cb) => {
        const query = `
            SELECT 
               
                 i.id, p.sku, 
                p.name AS product_name, 
                i.quantity, 
                l.code AS location_code, 
                bt.batch_code,
                i.updated_at
            FROM inventory i
            JOIN products p ON i.product_id = p.id
            JOIN bins b ON i.bin_id = b.id
            LEFT JOIN locations l ON b.id = l.bin_id
            JOIN batches bt ON i.batch_id = bt.id
            WHERE p.name LIKE ? OR p.sku LIKE ?
        `;
        db.query(query, [`%${keyword}%`, `%${keyword}%`], cb);
    },

    // 2. Tìm kiếm tồn kho theo Vị trí (Location Code)
    searchByLoc: (locationCode, cb) => {
        const query = `
            SELECT  
                 i.id, p.sku, 
                p.name AS product_name, 
                i.quantity, 
                l.code AS location_code, 
                bt.batch_code,
                i.updated_at 
            FROM inventory i
            JOIN products p ON i.product_id = p.id
            JOIN bins b ON i.bin_id = b.id
            JOIN locations l ON b.id = l.bin_id
            JOIN batches bt ON i.batch_id = bt.id
            WHERE l.code LIKE ?
        `;
        db.query(query, [`%${locationCode}%`], cb);
    }
};
module.exports = inventoryModel;
