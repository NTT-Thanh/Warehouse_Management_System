const db = require('../common/db');

const pickingModel = {
    // Lấy danh sách sản phẩm cần pick theo order_id (kèm thông tin vị trí ô chứa)
    getByOrderId: (orderId, cb) => {
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
            WHERE pt.order_id = ?;
        `;
        db.query(query, [orderId], cb);
    },

    // Cập nhật số lượng đã pick (khi quét SKU thành công)
    updatePickedQuantity: (id, pickedQuantity, cb) => {
        const query = 'UPDATE `picking_tasks` SET `picked_quantity` = ? WHERE `id` = ?';
        db.query(query, [pickedQuantity, id], cb);
    }
};

module.exports = pickingModel;