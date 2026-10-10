import { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { authService, dataService, type SignedInUser } from './API/api';
import { getApiErrorMessage } from './API/errors';
import User from './User/User';
import InventorySearch from './InventorySearch/InventorySearch';
import ShippingManagement from './Shipping/Shipping';
import SupplierManagement from './Supplier/Supplier';
import ProductsManagement from './Products/Products';
import LocationsManagement from './Locations/Locations';
import InboundManagement from './Inbound/Inbound';
import InboundConfirmationManagement from './Inbound/InboundConfirmation';
import OutboundManagement from './Outbound/Outbound';
import PickingManagement from './Picking/Picking';
import PickingDistribution from './Picking/PickingDistribution';
import PackingManagement from './Picking/Packing';
import OutboundDispatchManagement from './Outbound/Dispatch';
import './App.css';

type DashboardProduct = { id: number };
type DashboardReceipt = { id: number; status: string };
type DashboardOutbound = { id: number };
type DashboardTask = { id: number; status: string };
type DashboardData = {
  products: DashboardProduct[];
  inbounds: DashboardReceipt[];
  outbounds: DashboardOutbound[];
  tasks: DashboardTask[];
};
const emptyDashboard: DashboardData = { products: [], inbounds: [], outbounds: [], tasks: [] };

const navItems = [
  { to: '/', icon: '▦', label: 'Tổng quan', group: 'VẬN HÀNH' },
  { to: '/inbound', icon: '↓', label: 'Lệnh nhập kho' },
  { to: '/inbound-confirmation', icon: '✓', label: 'Xác nhận nhập kho' },
  { to: '/products', icon: '◈', label: 'Sản phẩm / SKU' },
  { to: '/inventory', icon: '▤', label: 'Tra cứu tồn kho' },
  { to: '/locations', icon: '⌖', label: 'Vị trí kho' },
  { to: '/outbound', icon: '↑', label: 'Lệnh xuất hàng', group: 'XUẤT HÀNG' },
  { to: '/picking', icon: '✓', label: 'Nhiệm vụ Picking' },
  { to: '/picking-distribution', icon: '⇄', label: 'Phân bố nhiệm vụ' },
  { to: '/packing', icon: '▣', label: 'Đóng gói' },
  { to: '/dispatch', icon: '⇢', label: 'Xuất đơn' },
  { to: '/shipping', icon: '⇢', label: 'Đơn vị vận chuyển', group: 'ĐỐI TÁC' },
  { to: '/suppliers', icon: '◇', label: 'Nhà cung cấp' },
  { to: '/users', icon: '♙', label: 'Tài khoản' },
];

function AdminApp() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<SignedInUser | null>(null);
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardData>(emptyDashboard);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState('');
  const page = location.pathname.replace('/', '') || 'overview';
  const pageTitles: Record<string, [string, string]> = {
    overview: ['Tổng quan kho hàng', 'Theo dõi dữ liệu và hoạt động kho từ cơ sở dữ liệu.'],
    inbound: ['Lệnh nhập kho', 'Quản lý phiếu nhập và nhà cung cấp.'],
    'inbound-confirmation': ['Xác nhận nhập kho', 'Ghi nhận số lượng thực nhận và xác nhận từng sản phẩm trong phiếu nhập.'],
    products: ['Danh mục sản phẩm / SKU', 'Quản lý sản phẩm và định mức tồn kho.'],
    inventory: ['Tra cứu tồn kho', 'Tra cứu số lượng theo sản phẩm, vị trí và mã lô.'],
    locations: ['Cấu hình vị trí kho', 'Quản lý vị trí và ô chứa trong kho.'],
    outbound: ['Lệnh xuất hàng', 'Quản lý đơn xuất và thông tin giao hàng.'],
    picking: ['Nhiệm vụ Picking', 'Phân công nhân viên và giám sát tiến độ lấy hàng.'],
    'picking-distribution': ['Phân bố nhiệm vụ', 'Chọn nhiệm vụ đang chờ và gán cho nhân viên phụ trách.'],
    packing: ['Đóng gói', 'Xem các nhiệm vụ picking đã hoàn thành và xuất phiếu đóng gói.'],
    dispatch: ['Xuất đơn', 'Xác nhận giao các đơn xuất có toàn bộ nhiệm vụ picking đã hoàn thành.'],
    users: ['Tài khoản & nhân viên', 'Quản lý người dùng và phân quyền truy cập.'],
    shipping: ['Đơn vị vận chuyển', 'Quản lý đối tác giao nhận và thông tin liên hệ.'],
    suppliers: ['Nhà cung cấp', 'Quản lý nhà cung cấp và thông tin liên hệ.'],
  };
  const [title, subtitle] = pageTitles[page] ?? pageTitles.overview;

  const refreshDashboard = useCallback(async () => {
    if (!currentUser) return;
    setDashboardLoading(true);
    setDashboardError('');
    try {
      const [products, inbounds, outbounds, tasks] = await Promise.all([
        dataService.getAll<DashboardProduct>('products'),
        dataService.getAll<DashboardReceipt>('inbound_receipts'),
        dataService.getAll<DashboardOutbound>('outbound_orders'),
        dataService.getAll<DashboardTask>('picking_tasks'),
      ]);
      setDashboard({ products, inbounds, outbounds, tasks });
    } catch (error) {
      console.error('Không thể tải số liệu tổng quan:', error);
      setDashboardError(getApiErrorMessage(error));
    } finally {
      setDashboardLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      void (async () => { await refreshDashboard(); })();
    }
  }, [currentUser, page, refreshDashboard]);

  if (!currentUser) {
    return <LoginScreen
      error={loginError}
      loading={loggingIn}
      onLogin={async (username, password) => {
        setLoggingIn(true);
        setLoginError('');
        try {
          setCurrentUser(await authService.login(username, password));
        } catch (error) {
          console.error('Đăng nhập thất bại:', error);
          setLoginError(axios.isAxiosError(error) && error.response?.status === 401
            ? 'Tên đăng nhập hoặc mật khẩu không đúng.'
            : getApiErrorMessage(error));
        } finally {
          setLoggingIn(false);
        }
      }}
    />;
  }

  const signOut = () => {
    setCurrentUser(null);
    setDashboard(emptyDashboard);
    navigate('/');
  };
  const roleNames: Record<SignedInUser['role'], string> = {
    admin: 'Quản trị viên',
    manager: 'Quản lý kho',
    staff: 'Nhân viên kho',
  };
  return (
    <div className="admin-shell">
      <aside className="sidebar no-print">
        <Link className="brand" to="/">
          <span className="brand-mark">W</span>
          <span><strong>WAREHOUSE</strong><small>MANAGEMENT SYSTEM</small></span>
        </Link>
        <div className="warehouse-switch"><span className="warehouse-icon">⌂</span><span><small>ĐANG QUẢN LÝ</small><strong>Kho Hưng Yên</strong></span><span className="chevron">⌄</span></div>
        <nav className="side-nav">
          {navItems.filter((item) => item.to !== '/users' || currentUser.role === 'admin').map((item) => (
            <div key={item.to}>
              {item.group && <div className="nav-group">{item.group}</div>}
              <Link className={`nav-link ${location.pathname === item.to ? 'active' : ''}`} to={item.to}>
                <span className="nav-icon">{item.icon}</span><span>{item.label}</span>
              </Link>
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom"><div className="help-card"><span className="help-icon">?</span><div><strong>Cần hỗ trợ?</strong><small>Xem hướng dẫn sử dụng</small></div><span>↗</span></div><div className="sidebar-version">WMS ADMIN <span>v1.0.0</span></div></div>
      </aside>

      <main className="main-area">
        <header className="topbar no-print">
          <div className="breadcrumbs">Kho Hưng Yên <span>/</span> <strong>{title}</strong></div>
          <div className="topbar-actions"><div className="system-status"><i /> MySQL / Backend</div><div className="profile"><div className="avatar">{getInitials(currentUser.full_name || currentUser.username)}</div><span><strong>{currentUser.full_name || currentUser.username}</strong><small>{roleNames[currentUser.role]}</small></span><button className="sign-out" onClick={signOut}>Đăng xuất</button></div></div>
        </header>
        <section className="workspace">
          <div className="page-heading">
            <div><div className="eyebrow">WMS <span>/</span> {page === 'overview' ? 'DASHBOARD' : page.toUpperCase()}</div><h1>{title}</h1><p>{subtitle}</p></div>
            {page === 'overview' && <button className="button secondary" onClick={() => void refreshDashboard()} disabled={dashboardLoading}>↻ Tải lại</button>}
          </div>
          {page === 'overview' && <>
            {dashboardError && <div className="user-feedback error" role="alert">{dashboardError}</div>}
            {dashboardLoading ? <div className="panel"><p className="user-empty">Đang tải số liệu từ MySQL...</p></div> : <Dashboard data={dashboard} navigate={navigate} />}
          </>}
          {page === 'users' && currentUser.role === 'admin' && <User />}
          {page === 'users' && currentUser.role !== 'admin' && <Panel title="Không có quyền truy cập" count="TÀI KHOẢN"><p className="permission-message">Chỉ quản trị viên mới có thể quản lý tài khoản nhân viên.</p></Panel>}
          {page === 'products' && <ProductsManagement />}
          {page === 'locations' && <LocationsManagement />}
          {page === 'inbound' && <InboundManagement currentUser={currentUser} />}
          {page === 'inbound-confirmation' && <InboundConfirmationManagement />}
          {page === 'outbound' && <OutboundManagement currentUser={currentUser} />}
          {page === 'picking' && <PickingManagement />}
          {page === 'picking-distribution' && <PickingDistribution />}
          {page === 'packing' && <PackingManagement />}
          {page === 'dispatch' && <OutboundDispatchManagement />}
          {page === 'inventory' && <InventorySearch />}
          {page === 'shipping' && <ShippingManagement />}
          {page === 'suppliers' && <SupplierManagement />}
        </section>
      </main>
    </div>
  );
}

function Dashboard({ data, navigate }: { data: DashboardData; navigate: (path: string) => void }) {
  const openTasks = data.tasks.filter((task) => !['Completed', 'Cancelled'].includes(task.status)).length;
  const pendingReceipts = data.inbounds.filter((row) => !['Completed', 'Cancelled'].includes(row.status)).length;
  return <div className="page-stack dashboard-stack">
    <div className="welcome-banner"><div><span className="welcome-kicker">{new Date().toLocaleDateString('vi-VN', { dateStyle: 'full' })}</span><h2>Chào mừng, {`Admin`} <span>✦</span></h2><p>Số liệu được tải trực tiếp từ cơ sở dữ liệu MySQL.</p></div><div className="banner-art"><span>▦</span><i>↗</i><b>⌖</b></div></div>
    <div className="metric-grid"><Metric label="Tổng sản phẩm" value={String(data.products.length).padStart(2, '0')} note="SKU trong MySQL" icon="◈" tone="blue" /><Metric label="Phiếu nhập đang mở" value={String(pendingReceipts).padStart(2, '0')} note="Cần tiếp nhận" icon="↓" tone="orange" /><Metric label="Đơn xuất" value={String(data.outbounds.length).padStart(2, '0')} note="Tất cả trạng thái" icon="↑" tone="green" /><Metric label="Picking đang mở" value={String(openTasks).padStart(2, '0')} note={`${data.tasks.length - openTasks} đã hoàn tất hoặc hủy`} icon="✓" tone="purple" /></div>
    <div className="dashboard-grid"><Panel title="Công việc cần chú ý" count="MYSQL"><div className="attention-list"><button onClick={() => navigate('/inbound')}><span className="attention-icon orange">↓</span><span><strong>Phiếu nhập cần tiếp nhận</strong><small>{pendingReceipts} phiếu đang mở</small></span><b>›</b></button><button onClick={() => navigate('/picking')}><span className="attention-icon blue">✓</span><span><strong>Nhiệm vụ picking chưa xong</strong><small>{openTasks} nhiệm vụ cần theo dõi</small></span><b>›</b></button><button onClick={() => navigate('/inventory')}><span className="attention-icon purple">▤</span><span><strong>Kiểm tra tồn kho</strong><small>Tra cứu theo dữ liệu tồn kho</small></span><b>›</b></button></div></Panel><Panel title="Truy cập nhanh" count="THAO TÁC"><div className="quick-links"><button onClick={() => navigate('/inbound')}><span>＋</span><strong>Tạo phiếu nhập</strong><small>Ghi vào MySQL</small></button><button onClick={() => navigate('/outbound')}><span>↗</span><strong>Tạo lệnh xuất</strong><small>Ghi vào MySQL</small></button><button onClick={() => navigate('/products')}><span>◈</span><strong>Thêm sản phẩm</strong><small>Cập nhật danh mục SKU</small></button></div></Panel></div>
  </div>;
}

function Metric({ label, value, note, icon, tone }: { label: string; value: string; note: string; icon: string; tone: string }) {
  return <article className="metric-card"><div className={`metric-icon ${tone}`}>{icon}</div><span className="metric-label">{label}</span><strong className="metric-value">{value}</strong><span className="metric-note">{note}</span><span className="metric-spark">⌁</span></article>;
}

function Panel({ title, count, children }: { title: string; count: string; children: React.ReactNode }) {
  return <section className="panel"><div className="panel-heading"><div><h2>{title}</h2><span>{count}</span></div><button className="more-button" aria-label="Tùy chọn">•••</button></div>{children}</section>;
}

function getInitials(name: string) {
  return name.trim().split(/\s+/).slice(-2).map((part) => part[0]?.toLocaleUpperCase('vi-VN') ?? '').join('');
}

function LoginScreen({ error, loading, onLogin }: { error: string; loading: boolean; onLogin: (username: string, password: string) => Promise<void> }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  return (
    <main className="login-screen">
      <section className="login-card">
        <Link className="brand login-brand" to="/">
          <span className="brand-mark">W</span>
          <span><strong>WAREHOUSE</strong><small>MANAGEMENT SYSTEM</small></span>
        </Link>
        <div className="login-heading"><span>WMS ADMIN</span><h1>Đăng nhập tài khoản</h1><p>Sử dụng tài khoản nhân viên kho của bạn để tiếp tục.</p></div>
        <form onSubmit={(event) => { event.preventDefault(); void onLogin(username, password); }}>
          <label><span>Tên đăng nhập</span><input autoComplete="username" autoFocus required value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Nhập tên đăng nhập" /></label>
          <label><span>Mật khẩu</span><input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Nhập mật khẩu" /></label>
          {error && <div className="login-error" role="alert">{error}</div>}
          <button className="button primary login-submit" type="submit" disabled={loading}>{loading ? 'Đang xác thực...' : 'Đăng nhập'}</button>
        </form>
        <div className="login-hint"><span>i</span> Bạn cần đăng nhập lại sau khi tải lại trang.</div>
      </section>
    </main>
  );
}

export default function App() {
  return <BrowserRouter><AdminApp /></BrowserRouter>;
}