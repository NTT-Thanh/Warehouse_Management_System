const db = require('../common/db');
const picking_taskModel = {
    getByPickerId: (pickerId, cb) => {
      const sql = `
        SELECT
          pt.id AS task_id,
          pt.order_id,
          od.order_code,
          p.name,
          p.sku,
          pt.required_quantity AS required,
          pt.picked_quantity AS picked,
          l.code AS primary_location,
          CASE
            WHEN pt.status = 'In_Progress' THEN 'Đang lấy'
            WHEN pt.status = 'Assigned' THEN 'Đã phân công'
            WHEN pt.status = 'Short_Picked' THEN 'Thiếu hàng'
            WHEN pt.status = 'Cancelled' THEN 'Đã hủy'
            ELSE 'Chờ xử lý'
          END AS status
        FROM picking_tasks pt
        JOIN outbound_orders od ON pt.order_id = od.id
        JOIN products p ON pt.product_id = p.id
        JOIN bins b ON pt.bin_id = b.id
        JOIN locations l ON l.bin_id = b.id
        WHERE pt.assigned_to = ? AND pt.status <> 'Completed'
        ORDER BY pt.order_id, pt.id;
      `;
      db.query(sql, [pickerId], cb);
    }
};

module.exports = picking_taskModel;