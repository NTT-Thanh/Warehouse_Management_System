const db = require('../common/db');

const pushModel = {
    // Lấy danh sách các task Putaway phân công cho nhân viên cất hàng (pusher)
    getTasksByPusherId: (pusherId, cb) => {
        const sql = `
            SELECT 
                pt.receipt_id AS order_id,
                ir.receipt_code AS order_code,
                COUNT(pt.id) AS total_items,
                SUM(pt.quantity) AS total_quantity,
                l.code AS primary_location,
                ir.status
            FROM putaway_tasks pt
            JOIN inbound_receipts ir ON pt.receipt_id = ir.id
            LEFT JOIN bins b ON pt.suggested_bin_id = b.id
            LEFT JOIN locations l ON l.bin_id = b.id
            WHERE pt.assigned_to = ?
            GROUP BY pt.receipt_id, ir.receipt_code, l.code, ir.status;
        `;
        db.query(sql, [pusherId], cb);
    },

    // Lấy chi tiết các sản phẩm cần cất theo phiếu nhập (receipt_id / orderId)
    // Bao gồm: Mã phiếu, vị trí cất, tên sản phẩm, SKU, mã lô, số lượng
    getByOrderId: (receiptId, cb) => {
        const sql = `
            SELECT 
                pt.id,
                p.name,
                p.sku,
                bt.batch_code AS batch_name,
                pt.quantity AS 'required',
                0 AS 'picked', 
                COALESCE(l_actual.code, l_suggested.code, 'Chưa xác định') AS targetLocation,
                ir.receipt_code AS order_code
            FROM putaway_tasks pt
            JOIN products p ON pt.product_id = p.id
            JOIN inbound_receipts ir ON pt.receipt_id = ir.id
            JOIN batches bt ON pt.batch_id = bt.id
            LEFT JOIN bins b_suggested ON pt.suggested_bin_id = b_suggested.id
            LEFT JOIN locations l_suggested ON l_suggested.bin_id = b_suggested.id
            LEFT JOIN bins b_actual ON pt.actual_bin_id = b_actual.id
            LEFT JOIN locations l_actual ON l_actual.bin_id = b_actual.id
            WHERE pt.receipt_id = ?;
        `;
        db.query(sql, [receiptId], cb);
    },

    // Cập nhật vị trí thực tế và tiến độ task khi pusher thao tác
    updateTaskProgress: (taskId, actualBinId, cb) => {
        const sql = `
            UPDATE putaway_tasks 
            SET actual_bin_id = ?, status = 'Completed' 
            WHERE id = ?;
        `;
        db.query(sql, [actualBinId, taskId], cb);
    }
};

module.exports = pushModel;