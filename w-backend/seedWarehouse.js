const db = require('./common/db');

async function seedData() {
    console.log('Đang bắt đầu tạo dữ liệu mẫu...');
    let connection;

    try {
        // Lấy một kết nối cố định từ pool để đảm bảo các lệnh chạy chung một phiên làm việc (session)
        connection = await db.promise().getConnection();

        console.log('Đang dọn dẹp dữ liệu cũ...');
        await connection.query('SET FOREIGN_KEY_CHECKS = 0;');
        await connection.query('DELETE FROM locations;');
        await connection.query('DELETE FROM bins;');
        await connection.query('DELETE FROM shelves;');
        await connection.query('DELETE FROM racks;');
        await connection.query('DELETE FROM zones;');
        await connection.query('SET FOREIGN_KEY_CHECKS = 1;');

        console.log('Đang tạo Zones...');
        await connection.query(`INSERT INTO zones (id, warehouse_id, name) VALUES (1, 1, 'Khu A'), (2, 1, 'Khu B')`);

        console.log('Đang tạo Racks (A1-A10, B1-B10)...');
        let rackQueries = [];
        let rackId = 1;
        
        for (let i = 1; i <= 10; i++) {
            rackQueries.push(`(${rackId++}, 1, 'Kệ A${i}')`);
        }
        for (let i = 1; i <= 10; i++) {
            rackQueries.push(`(${rackId++}, 2, 'Kệ B${i}')`);
        }
        await connection.query(`INSERT INTO racks (id, zone_id, name) VALUES ${rackQueries.join(', ')}`);

        console.log('Đang tạo Shelves (3 tầng mỗi kệ)...');
        let shelfQueries = [];
        let shelfId = 1;
        for (let r = 1; r <= 20; r++) {
            for (let floor = 1; floor <= 3; floor++) {
                shelfQueries.push(`(${shelfId++}, ${r}, 'Tầng ${floor}')`);
            }
        }
        await connection.query(`INSERT INTO shelves (id, rack_id, name) VALUES ${shelfQueries.join(', ')}`);

        console.log('Đang tạo 1200 Bins và Locations (Quá trình này mất khoảng 2-3 giây)...');
        for (let r = 1; r <= 20; r++) {
            const rackName = r <= 10 ? `A${r}` : `B${r - 10}`;
            for (let floor = 1; floor <= 3; floor++) {
                const currentShelfId = (r - 1) * 3 + floor;

                for (let pos = 1; pos <= 20; pos++) {
                    const posStr = pos < 10 ? `0${pos}` : `${pos}`;
                    const binName = `Bin-${rackName}-${posStr}`;
                    const locCode = `${rackName}-${pos}-${floor}`; // Chuẩn định dạng: A1-17-1

                    // Insert Bin
                    const [binResult] = await connection.query(
                        `INSERT INTO bins (shelf_id, name) VALUES (?, ?)`,
                        [currentShelfId, binName]
                    );
                    const insertedBinId = binResult.insertId;

                    // Insert Location tương ứng
                    await connection.query(
                        `INSERT INTO locations (bin_id, code, description) VALUES (?, ?, ?)`,
                        [insertedBinId, locCode, `Vị trí tự động tại kệ ${rackName}, ô ${pos}, tầng ${floor}`]
                    );
                }
            }
        }

        console.log('🎉 Đã tạo thành công toàn bộ dữ liệu kho lớn (1200 bins & locations chuẩn xác)!');
        
        // Trả lại kết nối cho pool
        connection.release();
        process.exit();
    } catch (error) {
        if (connection) connection.release();
        console.error('Lỗi khi seed dữ liệu:', error);
        process.exit(1);
    }
}

seedData();