import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import InventorySearch from './InventorySearch/InventorySearch';
import './App.css'; // File CSS tuỳ chọn hoặc viết inline
import User from './User/User';
// Sau này có thể import thêm trang PushList ở đây nếu muốn

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Khung layout chung bọc bên ngoài */}
        <Route path="/" element={<AdminLayout />}>
          {/* Trang mặc định ( cứu tồn kho) */}
          <Route index element={<InventorySearch />} />
          {/* Trang quản lý user */}
          <Route path="user" element={<div style={{padding: 20}}><User /><h2>Trang user</h2></div>} />   
          {/* Trang quản lý cất hàng (Ví dụ thêm vào sau) */}
          <Route path="push-list" element={<div style={{padding: 20}}><h2>Trang user</h2></div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}


