import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import InventorySearch from './InventorySearch/InventorySearch';
import './App.css'; // File CSS tuỳ chọn hoặc viết inline
// Sau này có thể import thêm trang PushList ở đây nếu muốn

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Khung layout chung bọc bên ngoài */}
        <Route path="/" element={<AdminLayout />}>
          {/* Trang mặc định (Tra cứu tồn kho) */}
          <Route index element={<InventorySearch />} />
          
          {/* Trang quản lý cất hàng (Ví dụ thêm vào sau) */}
          <Route path="push-list" element={<div style={{padding: 20}}><h2>Trang Quản lý Cất Hàng (Đang phát triển...)</h2></div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}


