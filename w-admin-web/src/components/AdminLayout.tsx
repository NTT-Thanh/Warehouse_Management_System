import { Outlet, Link, useLocation } from 'react-router-dom';
import './AdminLayout.css';

export default function AdminLayout() {
    const location = useLocation();

    return (
        <div className="admin-layout">
            {/* Thanh điều hướng bên trái (Sidebar) */}
            <aside className="admin-sidebar">
                <div className="sidebar-brand">
                    <h2>W-Admin Warehouse</h2>
                </div>
                <nav className="sidebar-menu">
                    <Link 
                        to="/" 
                        className={location.pathname === '/' ? 'menu-item active' : 'menu-item'}
                    >
                        🔍 Tra cứu Tồn kho
                    </Link>
                    <Link 
                        to="/push-list" 
                        className={location.pathname === '/push-list' ? 'menu-item active' : 'menu-item'}
                    >
                        📦 Quản lý Cất Hàng
                    </Link>
                    {/* Sau này có thể thêm các trang khác ở đây */}
                </nav>
            </aside>

            {/* Khu vực nội dung chính bên phải */}
            <main className="admin-content">
                <header className="content-header">
                    <h3>Hệ thống Quản lý Kho Hàng Thông Minh</h3>
                    <span className="user-badge">Admin Workspace</span>
                </header>
                <div className="content-body">
                    {/* Các trang con (child) sẽ được hiển thị tự động tại đây */}
                    <Outlet />
                </div>
            </main>
        </div>
    );
}