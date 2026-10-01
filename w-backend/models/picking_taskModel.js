const db = require('../common/db');

const picking_taskModel = {
    getByPickerId: (pickerId, cb) => {
        const sql = `
            SELECT 
                pt.order_id,
                od.order_code,
                COUNT(pt.id) AS total_items,
                SUM(pt.required_quantity) AS total_quantity,
                l.code AS primary_location,
                od.status
            FROM picking_tasks pt
            JOIN outbound_orders od ON pt.order_id = od.id
            JOIN bins b ON pt.bin_id = b.id
            JOIN locations l ON l.bin_id = b.id
            WHERE pt.assigned_to = ?
            GROUP BY pt.order_id, od.order_code, l.code, od.status;
        `;
        db.query(sql, [pickerId], cb);
    }
};

module.exports = picking_taskModel;