const db = require('../common/db');
const inbound_detailsModel = {
  getAll: (cb) => { db.query('SELECT * FROM `inbound_details`', cb); },
  getById: (id, cb) => { db.query('SELECT * FROM `inbound_details` WHERE `id` = ?', [id], cb); },
  create: (data, cb) => { db.query('INSERT INTO `inbound_details` SET ?', data, cb); },
  update: (id, data, cb) => { db.query('UPDATE `inbound_details` SET ? WHERE `id` = ?', [data, id], cb); },
  confirm: (id, actualQuantity, note, cb) => {
    db.getConnection((connectionError, connection) => {
      if (connectionError) return cb(connectionError);
      connection.beginTransaction((beginError) => {
        if (beginError) {
          connection.release();
          return cb(beginError);
        }

        const rollback = (error) => connection.rollback(() => {
          connection.release();
          cb(error);
        });

        connection.query(
          `SELECT d.receipt_id, d.confirmed, r.status AS receipt_status
           FROM inbound_details d
           JOIN inbound_receipts r ON r.id = d.receipt_id
           WHERE d.id = ? FOR UPDATE`,
          [id],
          (selectError, rows) => {
            if (selectError) return rollback(selectError);
            if (rows.length === 0) {
              const error = new Error('Không tìm thấy dòng sản phẩm trong phiếu nhập.');
              error.code = 'INBOUND_DETAIL_NOT_FOUND';
              return rollback(error);
            }

            const detail = rows[0];
            if (detail.receipt_status === 'Completed' || detail.receipt_status === 'Cancelled') {
              const error = new Error('Phiếu nhập đã đóng hoặc đã hủy, không thể xác nhận thêm.');
              error.code = 'INBOUND_RECEIPT_CLOSED';
              return rollback(error);
            }
            if (detail.confirmed) {
              const error = new Error('Sản phẩm trong phiếu nhập đã được xác nhận trước đó.');
              error.code = 'INBOUND_DETAIL_CONFIRMED';
              return rollback(error);
            }

            connection.query(
              'UPDATE inbound_details SET actual_quantity = ?, note = ?, confirmed = 1 WHERE id = ?',
              [actualQuantity, note, id],
              (updateError) => {
                if (updateError) return rollback(updateError);
                connection.query(
                  'SELECT COUNT(*) AS total, SUM(confirmed) AS confirmed_count FROM inbound_details WHERE receipt_id = ?',
                  [detail.receipt_id],
                  (countError, countRows) => {
                    if (countError) return rollback(countError);
                    const allConfirmed = Number(countRows[0].total) > 0
                      && Number(countRows[0].total) === Number(countRows[0].confirmed_count);
                    const nextStatus = allConfirmed ? 'Completed' : 'Receiving';
                    connection.query(
                      'UPDATE inbound_receipts SET status = ? WHERE id = ?',
                      [nextStatus, detail.receipt_id],
                      (receiptError) => {
                        if (receiptError) return rollback(receiptError);
                        connection.commit((commitError) => {
                          if (commitError) return rollback(commitError);
                          connection.release();
                          cb(null, { receipt_status: nextStatus });
                        });
                      }
                    );
                  }
                );
              }
            );
          }
        );
      });
    });
  },
  delete: (id, cb) => { db.query('DELETE FROM `inbound_details` WHERE `id` = ?', [id], cb); }
};
module.exports = inbound_detailsModel;
