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
import OutboundManagement from './Outbound/Outbound';
import PickingManagement from './Picking/Picking';
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
  { to: '/products', icon: '◈', label: 'Sản phẩm / SKU' },
  { to: '/inventory', icon: '▤', label: 'Tra cứu tồn kho' },
  { to: '/locations', icon: '⌖', label: 'Vị trí kho' },
  { to: '/outbound', icon: '↑', label: 'Lệnh xuất hàng', group: 'XUẤT HÀNG' },
  { to: '/picking', icon: '✓', label: 'Nhiệm vụ Picking' },
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
    products: ['Danh mục sản phẩm / SKU', 'Quản lý sản phẩm và định mức tồn kho.'],
    inventory: ['Tra cứu tồn kho', 'Tra cứu số lượng theo sản phẩm, vị trí và mã lô.'],
    locations: ['Cấu hình vị trí kho', 'Quản lý vị trí và ô chứa trong kho.'],
    outbound: ['Lệnh xuất hàng', 'Quản lý đơn xuất và thông tin giao hàng.'],
    picking: ['Nhiệm vụ Picking', 'Phân công nhân viên và giám sát tiến độ lấy hàng.'],
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
  const openTasks = dashboard.tasks.filter((task) => !['Completed', 'Cancelled'].includes(task.status)).length;

  return (
    <BrowserRouter>
      <Routes>
        {/* Khung layout chung bọc bên ngoài */}
        <Route path="/" element={<AdminLayout />}>
          {/* Trang mặc định (Tra cứu tồn kho) */}
         

<Route index element={<User />} />
          
          {/* Trang quản lý cất hàng (Ví dụ thêm vào sau) */}
          <Route path="push-list" element={<div style={{padding: 20}}><h2>Trang Quản lý Cất Hàng (Đang phát triển...)</h2></div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
