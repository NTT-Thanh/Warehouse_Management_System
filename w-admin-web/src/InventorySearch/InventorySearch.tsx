import { useState } from 'react';
import { apiService } from '../API/api'; // Đảm bảo đường dẫn đúng với vị trí của file api.ts
import './InventorySearch.css'; // File CSS tuỳ chọn hoặc viết inline

// Kiểu dữ liệu trả về của một dòng tồn kho
type InventoryItem = {
    id: number;
    product_name: string;
    sku: string;
    location_code: string;
    batch_code: string;
    quantity: number;
    updated_at: string;
};

export default function InventorySearch() {
    const [searchType, setSearchType] = useState<'item' | 'loc'>('item');
    const [keyword, setKeyword] = useState('');
    const [data, setData] = useState<InventoryItem[]>([]);
    const [searched, setSearched] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!keyword.trim()) return;

        setLoading(true);
        try {
            let res;
            if (searchType === 'item') {
                res = await apiService.searchInventoryByItem(keyword);
            } else {
                res = await apiService.searchInventoryByLoc(keyword);
            }

            if (res.success) {
                setData(res.data);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error(error);
            setData([]);
        } finally {
            setLoading(false);
            setSearched(true);
        }
    };

    return (
        <div className="inventory-container">
            <h2>Tra cứu Tồn kho Kho hàng</h2>

            {/* Thanh chọn chế độ tìm kiếm */}
            <div className="search-tabs">
                <button 
                    className={searchType === 'item' ? 'tab-btn active' : 'tab-btn'}
                    onClick={() => { setSearchType('item'); setKeyword(''); setData([]); setSearched(false); }}
                >
                    🔍 Tìm theo Tên Sản Phẩm (Item Inventory)
                </button>
                <button 
                    className={searchType === 'loc' ? 'tab-btn active' : 'tab-btn'}
                    onClick={() => { setSearchType('loc'); setKeyword(''); setData([]); setSearched(false); }}
                >
                    📍 Tìm theo Vị Trí (Location / Bin)
                </button>
            </div>

            {/* Form nhập từ khóa */}
            <form onSubmit={handleSearch} className="search-form">
                <input
                    type="text"
                    placeholder={searchType === 'item' ? "Nhập tên hoặc mã sản phẩm..." : "Nhập mã vị trí kệ (Ví dụ: A-01-02)..."}
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="search-input"
                />
                <button type="submit" className="search-btn">Tra cứu</button>
            </form>

            {/* Khu vực hiển thị kết quả */}
            <div className="result-section">
                {loading ? (
                    <p className="status-text">Đang tải dữ liệu...</p>
                ) : !searched ? (
                    <p className="status-text text-muted">Vui lòng nhập từ khóa để tra cứu thông tin tồn kho.</p>
                ) : data.length === 0 ? (
                    <p className="status-text text-warning">Không tìm thấy bản ghi nào phù hợp.</p>
                ) : (
                    <table className="inventory-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Sản phẩm</th>
                                <th>Mã SKU</th>
                                <th>Vị trí (Bin)</th>
                                <th>Mã Lô (Batch)</th>
                                <th>Số lượng tồn</th>
                                <th>Cập nhật cuối</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.id}</td>
                                    <td className="fw-bold">{item.product_name}</td>
                                    <td>{item.sku}</td>
                                    <td><span className="badge-loc">{item.location_code}</span></td>
                                    <td>{item.batch_code}</td>
                                    <td className="fw-bold text-success">{item.quantity}</td>
                                    <td>{new Date(item.updated_at).toLocaleString('vi-VN')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}