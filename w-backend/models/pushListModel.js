const db = require('../common/db');

const pushListModel = {
    // Lấy danh sách tổng quan các phiếu nhập cần cất hàng phân công theo nhân viên
    getPutawayTasksByPusher: (pusherId, cb) => {
        const sql = `
            SELECT 
                pt.receipt_id AS order_id,
                ir.receipt_code AS order_code,
                s.name AS supplier_name,
                COUNT(pt.id) AS total_items,
                SUM(pt.quantity) AS total_quantity,
                COALESCE(l.code, 'Chưa xác định') AS primary_location,
                ir.status
            FROM putaway_tasks pt
            JOIN inbound_receipts ir ON pt.receipt_id = ir.id
            JOIN suppliers s ON ir.supplier_id = s.id
            LEFT JOIN bins b ON pt.suggested_bin_id = b.id
            LEFT JOIN locations l ON l.bin_id = b.id
            WHERE pt.assigned_to = ?
            GROUP BY pt.receipt_id, ir.receipt_code, s.name, l.code, ir.status
            ORDER BY ir.created_at DESC;
        `;
        db.query(sql, [pusherId], cb);
    }
};

module.exports = pushListModel;