const db = require('../common/db');

const pickingModel = {
    // Lấy các task được giao trong một đơn xuất (kèm thông tin vị trí ô chứa)
    getByOrderId: (orderId, pickerId, cb) => {
        const query = `
            SELECT
                pt.id,
                o.order_code,
                p.name,
                p.sku,
                pt.required_quantity AS required,
                pt.picked_quantity AS picked,
                l.code AS targetLocation
            FROM picking_tasks pt
            JOIN outbound_orders o ON pt.order_id = o.id
            JOIN products p ON pt.product_id = p.id
            JOIN bins b ON pt.bin_id = b.id
            JOIN locations l ON l.bin_id = b.id
            WHERE pt.order_id = ? AND pt.assigned_to = ?;
        `;
        db.query(query, [orderId, pickerId], cb);
    },

    getByTaskId: (taskId, pickerId, cb) => {
        const query = `
            SELECT 
                pt.id, 
                o.order_code,
                p.name, 
                p.sku, 
                pt.required_quantity AS required, 
                pt.picked_quantity AS picked,
                l.code AS targetLocation
            FROM picking_tasks pt
            JOIN outbound_orders o ON pt.order_id = o.id
            JOIN products p ON pt.product_id = p.id
            JOIN bins b ON pt.bin_id = b.id
            JOIN locations l ON l.bin_id = b.id
            WHERE pt.id = ? AND pt.assigned_to = ?;
        `;
        db.query(query, [taskId, pickerId], cb);
    },

    // Cập nhật số lượng đã pick (khi quét SKU thành công)
    updatePickedQuantity: (id, pickerId, pickedQuantity, cb) => {
        const query = 'UPDATE `picking_tasks` SET `picked_quantity` = ? WHERE `id` = ? AND `assigned_to` = ? AND `required_quantity` >= ?';
        db.query(query, [pickedQuantity, id, pickerId, pickedQuantity], cb);
    },

    completeTask: (id, pickerId, cb) => {
        const query = `
            UPDATE picking_tasks
            SET status = 'Completed'
            WHERE id = ? AND assigned_to = ? AND picked_quantity >= required_quantity;
        `;
        db.query(query, [id, pickerId], (err, result) => {
            if (err) return cb(err);
            if (result.affectedRows > 0) return cb(null, true);

            const verifyQuery = `
                SELECT status
                FROM picking_tasks
                WHERE id = ? AND assigned_to = ?;
            `;
            db.query(verifyQuery, [id, pickerId], (verifyErr, rows) => {
                if (verifyErr) return cb(verifyErr);
                cb(null, rows[0]?.status === 'Completed');
            });
        });
    }
};

module.exports = pickingModel;