import { useMemo, useState } from 'react';
import { BrowserRouter, Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { authService, type SignedInUser } from './API/api';
import User from './User/User';
import './App.css';

type Product = { sku: string; name: string; category: string; unit: string; minimum: number };
type Location = { code: string; zone: string; rack: string; occupied: boolean };
type Inbound = { code: string; supplier: string; items: string; created: string; expected: string; status: string };
type Outbound = { code: string; customer: string; items: string; created: string; status: string };
type PickingTask = { id: number; order: string; sku: string; name: string; location: string; lot: string; required: number; picked: number; assignee: string; status: string; note: string };
type FormType = 'product' | 'location' | 'inbound' | 'outbound' | 'task';
type FormField = { name: string; label: string; required?: boolean; type?: string; options?: string[] };

const initialProducts: Product[] = [
  { sku: 'BEX10002321', name: 'WINDOW_FRAME_REAR_DECORATIVE_FILM', category: 'Linh kiện điện tử', unit: 'pcs', minimum: 10 },
  { sku: 'STD90007074', name: 'HEX_FLANGE_BOLT_M8', category: 'Phụ tùng ô tô', unit: 'pcs', minimum: 50 },
  { sku: 'BEX32953200AA', name: 'OUTER_REAR_VIEW_MIRROR_HOUSING_ASSY', category: 'Phụ tùng ô tô', unit: 'Units', minimum: 5 },
];
const initialLocations: Location[] = [
  { code: 'M24-25-A', zone: 'Active', rack: 'Dãy M24 - Kệ 25', occupied: true },
  { code: 'KK1-001-1', zone: 'Reserve', rack: 'Dãy KK1 - Kệ 01', occupied: true },
  { code: 'B02-04-C', zone: 'Reserve', rack: 'Dãy B02 - Kệ 04', occupied: true },
  { code: 'SA402-BD', zone: 'Staging', rack: 'Khu tập kết xuất hàng', occupied: false },
];
const initialInbounds: Inbound[] = [
  { code: 'PO-2026-0901', supplier: 'Công ty TNHH Linh Kiện Điện Tử ABC', items: 'BEX10002321 · 300 pcs, STD90007074 · 150 pcs', created: '22/09/2026', expected: '2026-09-25', status: 'Chờ giao hàng' },
  { code: 'PO-2026-0902', supplier: 'Tập đoàn Công nghệ VinParts', items: 'STD88881111 · 500 pcs', created: '20/09/2026', expected: '2026-09-23', status: 'Hoàn thành' },
  { code: 'PO-2026-0903', supplier: 'Công ty Cơ khí Đông Á', items: 'BEX32953200AA · 80 pcs', created: '24/09/2026', expected: '2026-09-28', status: 'Đang nhập kho' },
];
const initialOutbounds: Outbound[] = [
  { code: 'OUT-202609-001', customer: 'VFVN PART PDC (Bình Dương)', items: 'BEX10002321 · 10 pcs', created: '24/09/2026', status: 'Đang picking' },
  { code: 'OUT-202609-002', customer: 'Nhà máy lắp ráp Hưng Yên', items: 'STD90007074 · 24 pcs', created: '23/09/2026', status: 'Chờ xử lý' },
  { code: 'OUT-202609-003', customer: 'Công ty Phụ tùng Việt', items: 'BEX32953200AA · 6 Units', created: '22/09/2026', status: 'Đã giao' },
];
const initialTasks: PickingTask[] = [
  { id: 101, order: 'OUT-202609-001', sku: 'BEX10002321', name: 'WINDOW_FRAME_REAR', location: 'M24-25-A', lot: 'BATCH-09A', required: 10, picked: 4, assignee: 'Trần Ngọc Anh', status: 'In_Progress', note: '' },
  { id: 102, order: 'OUT-202609-001', sku: 'STD90007074', name: 'HEX_FLANGE_BOLT_M8', location: 'KK1-001-1', lot: 'LOT-X99', required: 8, picked: 8, assignee: 'Nguyễn Văn Hùng', status: 'Completed', note: '' },
  { id: 103, order: 'OUT-202609-002', sku: 'STD90007074', name: 'HEX_FLANGE_BOLT_M8', location: 'B02-04-C', lot: 'LOT-V55', required: 24, picked: 0, assignee: 'Chưa phân công', status: 'Pending', note: '' },
  { id: 104, order: 'OUT-202609-003', sku: 'BEX32953200AA', name: 'MIRROR_HOUSING_ASSY', location: 'M24-25-A', lot: 'BATCH-09B', required: 6, picked: 3, assignee: 'Lê Thị Mai', status: 'Short_Picked', note: 'Thiếu 3 sản phẩm tại vị trí.' },
];

const navItems = [
  { to: '/', icon: '▦', label: 'Tổng quan', group: 'VẬN HÀNH' },
  { to: '/inbound', icon: '↓', label: 'Lệnh nhập kho' },
  { to: '/products', icon: '◈', label: 'Sản phẩm / SKU' },
  { to: '/inventory', icon: '▤', label: 'Tra cứu tồn kho' },
  { to: '/locations', icon: '⌖', label: 'Vị trí kho' },
  { to: '/outbound', icon: '↑', label: 'Lệnh xuất hàng', group: 'XUẤT HÀNG' },
  { to: '/picking', icon: '✓', label: 'Nhiệm vụ Picking' },
  { to: '/users', icon: '♙', label: 'Tài khoản' },
];

const formFields: Record<FormType, FormField[]> = {
  product: [
    { name: 'sku', label: 'Mã SKU', required: true },
    { name: 'name', label: 'Tên sản phẩm', required: true },
    { name: 'category', label: 'Danh mục', required: true, options: ['Linh kiện điện tử', 'Phụ tùng ô tô', 'Khác'] },
    { name: 'unit', label: 'Đơn vị tính', required: true },
    { name: 'minimum', label: 'Tồn tối thiểu', type: 'number', required: true },
  ],
  location: [
    { name: 'code', label: 'Mã vị trí', required: true },
    { name: 'zone', label: 'Khu vực', required: true, options: ['Active', 'Reserve', 'Staging'] },
    { name: 'rack', label: 'Dãy / kệ', required: true },
    { name: 'occupied', label: 'Trạng thái', required: true, options: ['Đang chứa hàng', 'Trống'] },
  ],
  inbound: [
    { name: 'code', label: 'Mã phiếu nhập (PO)', required: true },
    { name: 'supplier', label: 'Nhà cung cấp', required: true },
    { name: 'items', label: 'Sản phẩm & số lượng', required: true },
    { name: 'expected', label: 'Ngày dự kiến giao', type: 'date', required: true },
    { name: 'status', label: 'Trạng thái', required: true, options: ['Chờ giao hàng', 'Đang nhập kho', 'Hoàn thành'] },
  ],
  outbound: [
    { name: 'code', label: 'Mã đơn xuất', required: true },
    { name: 'customer', label: 'Khách hàng / nơi nhận', required: true },
    { name: 'items', label: 'Sản phẩm & số lượng', required: true },
    { name: 'status', label: 'Trạng thái', required: true, options: ['Chờ xử lý', 'Đang picking', 'Đã đóng gói', 'Đã giao'] },
  ],
  task: [
    { name: 'order', label: 'Mã đơn xuất', required: true },
    { name: 'sku', label: 'Mã SKU', required: true },
    { name: 'name', label: 'Tên sản phẩm', required: true },
    { name: 'location', label: 'Vị trí (Bin)', required: true },
    { name: 'lot', label: 'Mã lô', required: true },
    { name: 'required', label: 'Số lượng cần lấy', type: 'number', required: true },
    { name: 'picked', label: 'Số lượng đã lấy', type: 'number', required: true },
    { name: 'assignee', label: 'Nhân viên phụ trách', required: true, options: ['Chưa phân công', 'Trần Ngọc Anh', 'Nguyễn Văn Hùng', 'Lê Thị Mai', 'Phạm Hoàng Long'] },
    { name: 'status', label: 'Trạng thái', required: true, options: ['Pending', 'Assigned', 'In_Progress', 'Completed', 'Short_Picked', 'Cancelled'] },
    { name: 'note', label: 'Ghi chú tiến độ / thiếu hàng' },
  ],
};

function useStoredState<T,>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? (JSON.parse(saved) as T) : initial;
    } catch (error) {
      console.error(`Không thể đọc dữ liệu demo "${key}" từ trình duyệt.`, error);
      return initial;
    }
  });
  const update = (next: T | ((previous: T) => T)) => {
    setValue((previous) => {
      const resolved = typeof next === 'function' ? (next as (previous: T) => T)(previous) : next;
      try {
        localStorage.setItem(key, JSON.stringify(resolved));
      } catch (error) {
        console.error(`Không thể lưu dữ liệu demo "${key}" vào trình duyệt.`, error);
      }
      return resolved;
    });
  };
  return [value, update] as const;
}

function AdminApp() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<SignedInUser | null>(() => {
    try {
      const saved = localStorage.getItem('wms-current-user');
      return saved ? JSON.parse(saved) as SignedInUser : null;
    } catch (error) {
      console.error('Không thể đọc phiên đăng nhập đã lưu.', error);
      return null;
    }
  });
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [products, setProducts] = useStoredState('wms-demo-products', initialProducts);
  const [locations, setLocations] = useStoredState('wms-demo-locations', initialLocations);
  const [inbounds, setInbounds] = useStoredState('wms-demo-inbounds', initialInbounds);
  const [outbounds, setOutbounds] = useStoredState('wms-demo-outbounds', initialOutbounds);
  const [tasks, setTasks] = useStoredState('wms-demo-picking', initialTasks);
  const [modal, setModal] = useState<{ type: FormType; id?: string | number; title?: string } | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [detail, setDetail] = useState<Inbound | PickingTask | Outbound | null>(null);
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [printOrder, setPrintOrder] = useState<Outbound | null>(null);
  const page = location.pathname.replace('/', '') || 'overview';
  const pageTitles: Record<string, [string, string]> = {
    overview: ['Tổng quan kho hàng', 'Theo dõi hoạt động và tình hình kho trong ngày.'],
    inbound: ['Lệnh nhập kho', 'Quản lý đơn nhập, nhà cung cấp và tiến độ nhận hàng.'],
    products: ['Danh mục sản phẩm / SKU', 'Quản lý mặt hàng, đơn vị tính và định mức tồn tối thiểu.'],
    inventory: ['Tra cứu tồn kho', 'Kiểm tra số lượng theo sản phẩm, vị trí và mã lô.'],
    locations: ['Cấu hình vị trí kho', 'Quản lý khu vực, dãy kệ và sức chứa trong kho.'],
    outbound: ['Lệnh xuất hàng', 'Theo dõi đơn xuất và chuẩn bị phiếu giao hàng.'],
    picking: ['Nhiệm vụ Picking', 'Phân công nhân viên và giám sát tiến độ lấy hàng.'],
    users: ['Tài khoản & nhân viên', 'Quản lý người dùng và phân quyền truy cập.'],
  };
  const [title, subtitle] = pageTitles[page] ?? pageTitles.overview;
  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  };
  const openForm = (type: FormType, item?: Record<string, unknown>, id?: string | number) => {
    const nextForm: Record<string, string> = {};
    (formFields[type] ?? []).forEach(({ name }) => {
      const value = item?.[name];
      nextForm[name] = name === 'occupied'
        ? value ? 'Đang chứa hàng' : 'Trống'
        : value === undefined || value === null ? '' : String(value);
    });
    setForm(nextForm);
    setModal({ type, id });
  };
  const saveForm = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!modal) return;
    const values = { ...form };
    if (modal.type === 'product') {
      const product = { sku: values.sku.trim().toUpperCase(), name: values.name.trim(), category: values.category, unit: values.unit, minimum: Number(values.minimum) };
      setProducts((rows) => modal.id ? rows.map((row) => row.sku === modal.id ? product : row) : [product, ...rows]);
    } else if (modal.type === 'location') {
      const item: Location = { code: values.code.trim().toUpperCase(), zone: values.zone, rack: values.rack, occupied: values.occupied === 'Đang chứa hàng' };
      setLocations((rows) => modal.id ? rows.map((row) => row.code === modal.id ? item : row) : [item, ...rows]);
    } else if (modal.type === 'inbound') {
      const item: Inbound = { code: values.code.trim().toUpperCase(), supplier: values.supplier, items: values.items, created: new Date().toLocaleDateString('vi-VN'), expected: values.expected, status: values.status };
      setInbounds((rows) => modal.id ? rows.map((row) => row.code === modal.id ? { ...row, ...item } : row) : [item, ...rows]);
    } else if (modal.type === 'outbound') {
      const item: Outbound = { code: values.code.trim().toUpperCase(), customer: values.customer, items: values.items, created: new Date().toLocaleDateString('vi-VN'), status: values.status };
      setOutbounds((rows) => modal.id ? rows.map((row) => row.code === modal.id ? { ...row, ...item } : row) : [item, ...rows]);
    } else {
      const item: PickingTask = {
        id: modal.id ? Number(modal.id) : Math.max(100, ...tasks.map((task) => task.id)) + 1,
        order: values.order.trim().toUpperCase(), sku: values.sku.trim().toUpperCase(), name: values.name,
        location: values.location.trim().toUpperCase(), lot: values.lot.trim().toUpperCase(),
        required: Number(values.required), picked: Number(values.picked), assignee: values.assignee,
        status: values.status, note: values.note,
      };
      setTasks((rows) => modal.id ? rows.map((row) => row.id === Number(modal.id) ? item : row) : [item, ...rows]);
    }
    setModal(null);
    notify(modal.id ? 'Đã cập nhật thông tin.' : 'Đã thêm bản ghi mới.');
  };
  const filteredProducts = useMemo(() => products.filter((item) => `${item.sku} ${item.name}`.toLowerCase().includes(search.toLowerCase()) && (!filter || item.category === filter)), [products, search, filter]);
  const filteredLocations = useMemo(() => locations.filter((item) => `${item.code} ${item.rack}`.toLowerCase().includes(search.toLowerCase()) && (!filter || item.zone === filter)), [locations, search, filter]);
  const filteredInbounds = useMemo(() => inbounds.filter((item) => `${item.code} ${item.supplier}`.toLowerCase().includes(search.toLowerCase()) && (!filter || item.status === filter)), [inbounds, search, filter]);
  const filteredOutbounds = useMemo(() => outbounds.filter((item) => `${item.code} ${item.customer}`.toLowerCase().includes(search.toLowerCase()) && (!filter || item.status === filter)), [outbounds, search, filter]);
  const filteredTasks = useMemo(() => tasks.filter((item) => `${item.order} ${item.sku}`.toLowerCase().includes(search.toLowerCase()) && (!filter || item.status === filter)), [tasks, search, filter]);
  const inventory = [
    { sku: 'BEX10002321', lot: 'LOT2026-09A', location: 'M24-25-A', quantity: 150, allocated: 30 },
    { sku: 'BEX10002321', lot: 'LOT2026-09B', location: 'KK1-001-1', quantity: 500, allocated: 120 },
    { sku: 'STD90007074', lot: 'LOT-X99', location: 'M24-25-A', quantity: 80, allocated: 0 },
    { sku: 'STD88881111', lot: 'LOT-V55', location: 'B02-04-C', quantity: 320, allocated: 50 },
  ].filter((item) => `${item.sku} ${item.location} ${item.lot}`.toLowerCase().includes(search.toLowerCase()));

  const remove = (type: FormType, id: string | number) => {
    if (!window.confirm('Bạn có chắc muốn xóa bản ghi này?')) return;
    if (type === 'product') setProducts((rows) => rows.filter((item) => item.sku !== id));
    if (type === 'location') setLocations((rows) => rows.filter((item) => item.code !== id));
    if (type === 'inbound') setInbounds((rows) => rows.filter((item) => item.code !== id));
    if (type === 'outbound') setOutbounds((rows) => rows.filter((item) => item.code !== id));
    if (type === 'task') setTasks((rows) => rows.filter((item) => item.id !== id));
    notify('Đã xóa bản ghi.');
  };

  if (!currentUser) {
    return <LoginScreen
      error={loginError}
      loading={loggingIn}
      onLogin={async (username, password) => {
        setLoggingIn(true);
        setLoginError('');
        try {
          const user = await authService.login(username, password);
          localStorage.setItem('wms-current-user', JSON.stringify(user));
          setCurrentUser(user);
        } catch (error) {
          console.error('Đăng nhập thất bại:', error);
          if (axios.isAxiosError(error) && error.response?.status === 401) {
            setLoginError('Tên đăng nhập hoặc mật khẩu không đúng.');
          } else if (axios.isAxiosError(error) && error.code === 'ERR_NETWORK') {
            setLoginError('Không kết nối được backend. Hãy khởi động backend và kiểm tra cấu hình MySQL.');
          } else {
            setLoginError('Đăng nhập thất bại. Hãy kiểm tra backend và thử lại.');
          }
        } finally {
          setLoggingIn(false);
        }
      }}
    />;
  }
  const signOut = () => {
    localStorage.removeItem('wms-current-user');
    setCurrentUser(null);
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
                {item.to === '/picking' && <span className="nav-count">{tasks.filter((task) => task.status !== 'Completed').length}</span>}
              </Link>
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom"><div className="help-card"><span className="help-icon">?</span><div><strong>Cần hỗ trợ?</strong><small>Xem hướng dẫn sử dụng</small></div><span>↗</span></div><div className="sidebar-version">WMS ADMIN <span>v1.0.0</span></div></div>
      </aside>

      <main className="main-area">
        <header className="topbar no-print">
          <div className="breadcrumbs">Kho Hưng Yên <span>/</span> <strong>{title}</strong></div>
          <div className="topbar-actions"><div className="system-status"><i /> Hệ thống hoạt động</div><button className="icon-button" aria-label="Thông báo">♧<b /></button><div className="profile"><div className="avatar">{getInitials(currentUser.full_name || currentUser.username)}</div><span><strong>{currentUser.full_name || currentUser.username}</strong><small>{roleNames[currentUser.role]}</small></span><button className="sign-out" onClick={signOut}>Đăng xuất</button></div></div>
        </header>
        <section className="workspace">
          <div className="page-heading">
            <div><div className="eyebrow">WMS <span>/</span> {page === 'overview' ? 'DASHBOARD' : page.toUpperCase()}</div><h1>{title}</h1><p>{subtitle}</p></div>
            {page === 'inbound' && <button className="button primary" onClick={() => openForm('inbound')}><span>＋</span> Tạo lệnh nhập</button>}
            {page === 'products' && <button className="button primary" onClick={() => openForm('product')}><span>＋</span> Thêm sản phẩm</button>}
            {page === 'locations' && <button className="button primary" onClick={() => openForm('location')}><span>＋</span> Thêm vị trí</button>}
            {page === 'outbound' && <button className="button primary" onClick={() => openForm('outbound')}><span>＋</span> Tạo lệnh xuất</button>}
            {page === 'picking' && <button className="button primary" onClick={() => { setTasks((rows) => rows.map((task) => task.status === 'Pending' ? { ...task, assignee: 'Phạm Hoàng Long', status: 'Assigned' } : task)); notify('Đã phân bổ các task đang chờ.'); }}>⇄ <span>Phân bổ tự động</span></button>}
          </div>

          {page === 'overview' && <Dashboard products={products} inbounds={inbounds} outbounds={outbounds} tasks={tasks} navigate={navigate} />}
          {page === 'users' && currentUser.role === 'admin' && <User />}
          {page === 'users' && currentUser.role !== 'admin' && <Panel title="Không có quyền truy cập" count="TÀI KHOẢN"><p className="permission-message">Chỉ quản trị viên mới có thể quản lý tài khoản nhân viên.</p></Panel>}
          {page === 'products' && <div className="page-stack">
            <FilterBar search={search} setSearch={setSearch} placeholder="Tìm theo mã SKU hoặc tên sản phẩm..." filter={filter} setFilter={setFilter} options={['Linh kiện điện tử', 'Phụ tùng ô tô']} filterLabel="Tất cả danh mục" />
            <Panel title="Danh sách sản phẩm" count={`${filteredProducts.length} sản phẩm`}><Table headers={['Mã SKU', 'Tên sản phẩm', 'Danh mục', 'Đơn vị tính', 'Tồn tối thiểu', 'Thao tác']}>
              {filteredProducts.map((item) => <tr key={item.sku}><td><span className="code-link">{item.sku}</span></td><td className="primary-cell">{item.name}</td><td><span className="soft-tag">{item.category}</span></td><td>{item.unit}</td><td><span className="quantity-warn">{item.minimum} {item.unit}</span></td><td><RowActions onEdit={() => openForm('product', item as unknown as Record<string, unknown>, item.sku)} onDelete={() => remove('product', item.sku)} /></td></tr>)}
            </Table>{filteredProducts.length === 0 && <EmptyState />}</Panel>
          </div>}
          {page === 'locations' && <div className="page-stack">
            <FilterBar search={search} setSearch={setSearch} placeholder="Tìm mã vị trí, dãy hoặc kệ..." filter={filter} setFilter={setFilter} options={['Active', 'Reserve', 'Staging']} filterLabel="Tất cả khu vực" />
            <Panel title="Sơ đồ vị trí kho" count={`${filteredLocations.length} vị trí`}><Table headers={['Mã vị trí', 'Khu vực / Zone', 'Dãy / kệ', 'Sức chứa', 'Trạng thái', 'Thao tác']}>
              {filteredLocations.map((item) => <tr key={item.code}><td><span className="code-link">{item.code}</span></td><td><StatusBadge value={item.zone} /></td><td>{item.rack}</td><td><div className="capacity"><span><i style={{ width: item.occupied ? '68%' : '0%' }} /></span><small>{item.occupied ? '68%' : 'Trống'}</small></div></td><td><StatusBadge value={item.occupied ? 'Đang chứa hàng' : 'Trống'} /></td><td><RowActions onEdit={() => openForm('location', item as unknown as Record<string, unknown>, item.code)} onDelete={() => remove('location', item.code)} /></td></tr>)}
            </Table>{filteredLocations.length === 0 && <EmptyState />}</Panel>
          </div>}
          {page === 'inbound' && <div className="page-stack">
            <FilterBar search={search} setSearch={setSearch} placeholder="Tìm mã phiếu nhập hoặc nhà cung cấp..." filter={filter} setFilter={setFilter} options={['Chờ giao hàng', 'Đang nhập kho', 'Hoàn thành']} filterLabel="Tất cả trạng thái" />
            <Panel title="Danh sách phiếu nhập" count={`${filteredInbounds.length} phiếu`}><Table headers={['Mã phiếu (PO)', 'Nhà cung cấp', 'Sản phẩm & số lượng', 'Ngày tạo', 'Dự kiến giao', 'Trạng thái', 'Thao tác']}>
              {filteredInbounds.map((item) => <tr key={item.code}><td><span className="code-link">{item.code}</span></td><td className="primary-cell">{item.supplier}</td><td className="muted-cell">{item.items}</td><td>{item.created}</td><td>{formatDate(item.expected)}</td><td><StatusBadge value={item.status} /></td><td><div className="row-actions"><button className="text-action" onClick={() => setDetail(item)}>Chi tiết</button>{item.status !== 'Hoàn thành' && <button className="text-action green" onClick={() => { setInbounds((rows) => rows.map((row) => row.code === item.code ? { ...row, status: 'Hoàn thành' } : row)); notify('Đã xác nhận nhận hàng.'); }}>Nhận hàng</button>}<button className="text-action" onClick={() => openForm('inbound', item as unknown as Record<string, unknown>, item.code)}>Sửa</button><button className="text-action red" onClick={() => remove('inbound', item.code)}>Xóa</button></div></td></tr>)}
            </Table>{filteredInbounds.length === 0 && <EmptyState />}</Panel>
          </div>}
          {page === 'inventory' && <div className="page-stack">
            <div className="filter-bar inventory-filters"><label><span>Mã sản phẩm (SKU)</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Ví dụ: BEX10002321" /></label><label><span>Vị trí kho (Location)</span><input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Ví dụ: M24-25-A" /></label><button className="button primary" onClick={() => notify('Đã cập nhật kết quả tra cứu.')}>⌕ <span>Tra cứu tồn kho</span></button></div>
            <Panel title="Tồn kho theo sản phẩm & vị trí" count={`${inventory.filter((item) => !filter || item.location.toLowerCase().includes(filter.toLowerCase())).length} bản ghi`}><Table headers={['Mã sản phẩm', 'Mã lô (Batch)', 'Vị trí kho', 'Tồn thực tế', 'Đã phân bổ', 'Có thể xuất']}>
              {inventory.filter((item) => !filter || item.location.toLowerCase().includes(filter.toLowerCase())).map((item) => <tr key={`${item.sku}-${item.lot}`}><td><span className="code-link">{item.sku}</span></td><td>{item.lot}</td><td><span className="location-chip">⌖ {item.location}</span></td><td className="primary-cell">{item.quantity.toLocaleString()} pcs</td><td><span className="quantity-warn">{item.allocated.toLocaleString()} pcs</span></td><td className="available">{(item.quantity - item.allocated).toLocaleString()} pcs</td></tr>)}
            </Table>{inventory.filter((item) => `${item.sku} ${item.location} ${item.lot}`.toLowerCase().includes(search.toLowerCase()) && (!filter || item.location.toLowerCase().includes(filter.toLowerCase()))).length === 0 && <EmptyState />}</Panel>
          </div>}
          {page === 'outbound' && <div className="page-stack">
            <FilterBar search={search} setSearch={setSearch} placeholder="Tìm mã đơn hoặc khách hàng..." filter={filter} setFilter={setFilter} options={['Chờ xử lý', 'Đang picking', 'Đã đóng gói', 'Đã giao']} filterLabel="Tất cả trạng thái" />
            <Panel title="Danh sách lệnh xuất" count={`${filteredOutbounds.length} đơn xuất`}><Table headers={['Mã đơn xuất', 'Khách hàng / nơi nhận', 'Sản phẩm & số lượng', 'Ngày tạo', 'Trạng thái', 'Thao tác']}>
              {filteredOutbounds.map((item) => <tr key={item.code}><td><span className="code-link">{item.code}</span></td><td className="primary-cell">{item.customer}</td><td>{item.items}</td><td>{item.created}</td><td><StatusBadge value={item.status} /></td><td><div className="row-actions"><button className="text-action" onClick={() => setDetail(item)}>Chi tiết</button><button className="text-action" onClick={() => setPrintOrder(item)}>Phiếu giao</button><button className="text-action" onClick={() => openForm('outbound', item as unknown as Record<string, unknown>, item.code)}>Sửa</button><button className="text-action red" onClick={() => remove('outbound', item.code)}>Xóa</button></div></td></tr>)}
            </Table>{filteredOutbounds.length === 0 && <EmptyState />}</Panel>
          </div>}
          {page === 'picking' && <div className="page-stack">
            <FilterBar search={search} setSearch={setSearch} placeholder="Tìm theo mã đơn xuất hoặc SKU..." filter={filter} setFilter={setFilter} options={['Pending', 'Assigned', 'In_Progress', 'Completed', 'Short_Picked', 'Cancelled']} filterLabel="Tất cả trạng thái" />
            <Panel title="Danh sách nhiệm vụ lấy hàng" count={`${filteredTasks.length} nhiệm vụ`}><Table headers={['ID Task', 'Mã đơn xuất', 'Sản phẩm / SKU', 'Vị trí & lô', 'Cần / Đã lấy', 'Nhân viên', 'Trạng thái', 'Thao tác']}>
              {filteredTasks.map((item) => <tr key={item.id}><td className="primary-cell">#{item.id}</td><td><span className="code-link">{item.order}</span></td><td><strong>{item.sku}</strong><small className="table-sub">{item.name}</small></td><td><span className="location-chip">{item.location}</span><small className="table-sub">Lô: {item.lot}</small></td><td><strong>{item.required}</strong><span className="picked-count"> / {item.picked}</span></td><td>{item.assignee}</td><td><StatusBadge value={item.status} /></td><td><div className="row-actions"><button className="text-action" onClick={() => setDetail(item)}>Chi tiết</button><button className="text-action" onClick={() => openForm('task', item as unknown as Record<string, unknown>, item.id)}>Cập nhật</button>{item.status !== 'Cancelled' && item.status !== 'Completed' && <button className="text-action red" onClick={() => { setTasks((rows) => rows.map((task) => task.id === item.id ? { ...task, status: 'Cancelled' } : task)); notify('Đã hủy nhiệm vụ.'); }}>Hủy</button>}</div></td></tr>)}
            </Table>{filteredTasks.length === 0 && <EmptyState />}</Panel>
          </div>}
        </section>
      </main>

      {modal && <div className="modal-backdrop no-print" onMouseDown={(event) => event.target === event.currentTarget && setModal(null)}><form className="form-modal" onSubmit={saveForm}><div className="modal-heading"><div><span className="eyebrow">WMS / QUẢN LÝ DỮ LIỆU</span><h2>{modal.id ? 'Cập nhật thông tin' : `Thêm ${modal.type === 'product' ? 'sản phẩm' : modal.type === 'location' ? 'vị trí' : modal.type === 'inbound' ? 'lệnh nhập kho' : modal.type === 'outbound' ? 'lệnh xuất hàng' : 'nhiệm vụ picking'}`}</h2></div><button type="button" className="modal-close" onClick={() => setModal(null)}>×</button></div><div className="form-grid">{formFields[modal.type].map((field) => <label key={field.name} className={field.name === 'items' || field.name === 'note' ? 'wide' : ''}><span>{field.label}{field.required && <b> *</b>}</span>{field.options ? <select required={field.required} value={form[field.name] ?? ''} onChange={(event) => setForm({ ...form, [field.name]: event.target.value })}><option value="">-- Chọn --</option>{field.options.map((option) => <option key={option} value={option}>{option}</option>)}</select> : <input required={field.required} type={field.type ?? 'text'} min={field.type === 'number' ? 0 : undefined} value={form[field.name] ?? ''} onChange={(event) => setForm({ ...form, [field.name]: event.target.value })} />}</label>)}</div><div className="modal-footer"><button type="button" className="button secondary" onClick={() => setModal(null)}>Hủy</button><button type="submit" className="button primary">Lưu thông tin</button></div></form></div>}
      {detail && <div className="modal-backdrop no-print" onMouseDown={(event) => event.target === event.currentTarget && setDetail(null)}><div className="detail-modal"><div className="modal-heading"><div><span className="eyebrow">CHI TIẾT BẢN GHI</span><h2>{'code' in detail ? detail.code : `Nhiệm vụ #${detail.id}`}</h2></div><button className="modal-close" onClick={() => setDetail(null)}>×</button></div><div className="detail-list">{Object.entries(detail).map(([key, value]) => <div key={key}><span>{key}</span><strong>{String(value)}</strong></div>)}</div><div className="modal-footer"><button className="button secondary" onClick={() => setDetail(null)}>Đóng</button></div></div></div>}
      {printOrder && <div className="modal-backdrop print-backdrop"><article className="print-document"><div className="print-toolbar no-print"><span>Xem trước phiếu giao hàng</span><div><button className="button secondary" onClick={() => setPrintOrder(null)}>Đóng</button><button className="button primary" onClick={() => window.print()}>▣ In phiếu</button></div></div><div className="delivery-heading"><div><strong className="delivery-brand">WAREHOUSE</strong><small>Warehouse Management System</small></div><div><h2>Delivery Note / Phiếu Giao Hàng</h2><p>Mã đơn xuất: <strong>{printOrder.code}</strong></p></div></div><div className="delivery-details"><p><b>Kho:</b> Hưng Yên</p><p><b>Ngày xuất:</b> {new Date().toLocaleDateString('vi-VN')}</p><p><b>Đơn hàng:</b> {printOrder.code}</p><p><b>Giao đến:</b> {printOrder.customer}</p><p><b>Trạng thái:</b> {printOrder.status}</p></div><table className="delivery-table"><thead><tr><th>Carton Nbr</th><th>Item (Mã hàng)</th><th>Description</th><th>UOM</th><th>Ship Qty</th><th>Actual Qty</th><th>Loại thùng</th></tr></thead><tbody><tr><td>—</td><td>{printOrder.items.split(' · ')[0]}</td><td>Hàng hóa xuất kho</td><td>pcs</td><td>—</td><td>—</td><td>—</td></tr></tbody></table><div className="signature-row"><span>Người giao hàng<br /><br />__________________</span><span>Người nhận hàng<br /><br />__________________</span><span>Xác nhận kho<br /><br />__________________</span></div></article></div>}
      {toast && <div className="toast no-print"><span>✓</span>{toast}</div>}
    </div>
  );
}

function Dashboard({ products, inbounds, outbounds, tasks, navigate }: { products: Product[]; inbounds: Inbound[]; outbounds: Outbound[]; tasks: PickingTask[]; navigate: (path: string) => void }) {
  const openTasks = tasks.filter((task) => !['Completed', 'Cancelled'].includes(task.status)).length;
  return <div className="page-stack dashboard-stack">
    <div className="welcome-banner"><div><span className="welcome-kicker">THỨ NĂM, 24 THÁNG 09, 2026</span><h2>Chào buổi sáng, Admin <span>✦</span></h2><p>Đây là tình hình hoạt động kho của bạn hôm nay.</p></div><div className="banner-art"><span>▦</span><i>↗</i><b>⌖</b></div></div>
    <div className="metric-grid"><Metric label="Tổng sản phẩm" value={products.length.toString().padStart(2, '0')} note="SKU đang quản lý" icon="◈" tone="blue" /><Metric label="Phiếu nhập chờ xử lý" value={inbounds.filter((item) => item.status !== 'Hoàn thành').length.toString().padStart(2, '0')} note="Cần tiếp nhận" icon="↓" tone="orange" /><Metric label="Đơn xuất hôm nay" value={outbounds.length.toString().padStart(2, '0')} note="Tất cả trạng thái" icon="↑" tone="green" /><Metric label="Picking đang mở" value={openTasks.toString().padStart(2, '0')} note={`${tasks.length - openTasks} đã hoàn tất`} icon="✓" tone="purple" /></div>
    <div className="dashboard-grid"><Panel title="Công việc cần chú ý" count="HÔM NAY"><div className="attention-list"><button onClick={() => navigate('/inbound')}><span className="attention-icon orange">↓</span><span><strong>Phiếu nhập cần tiếp nhận</strong><small>{inbounds.filter((item) => item.status !== 'Hoàn thành').length} phiếu đang chờ xử lý</small></span><b>›</b></button><button onClick={() => navigate('/picking')}><span className="attention-icon blue">✓</span><span><strong>Nhiệm vụ picking chưa xong</strong><small>{openTasks} nhiệm vụ cần theo dõi</small></span><b>›</b></button><button onClick={() => navigate('/inventory')}><span className="attention-icon purple">▤</span><span><strong>Kiểm tra tồn kho</strong><small>Tra cứu hàng theo lô và vị trí</small></span><b>›</b></button></div></Panel><Panel title="Truy cập nhanh" count="THAO TÁC"><div className="quick-links"><button onClick={() => navigate('/inbound')}><span>＋</span><strong>Tạo phiếu nhập</strong><small>Tiếp nhận hàng hóa</small></button><button onClick={() => navigate('/outbound')}><span>↗</span><strong>Tạo lệnh xuất</strong><small>Chuẩn bị đơn hàng</small></button><button onClick={() => navigate('/products')}><span>◈</span><strong>Thêm sản phẩm</strong><small>Cập nhật danh mục SKU</small></button></div></Panel></div>
    <div className="demo-note"><span>i</span><div><strong>Chế độ trình diễn</strong><p>Dữ liệu mẫu được lưu trong trình duyệt này để bạn có thể trải nghiệm các luồng quản lý. Kết nối backend sẽ được cấu hình ở bước tích hợp.</p></div></div>
  </div>;
}

function Metric({ label, value, note, icon, tone }: { label: string; value: string; note: string; icon: string; tone: string }) {
  return <article className="metric-card"><div className={`metric-icon ${tone}`}>{icon}</div><span className="metric-label">{label}</span><strong className="metric-value">{value}</strong><span className="metric-note">{note}</span><span className="metric-spark">⌁</span></article>;
}
function FilterBar({ search, setSearch, placeholder, filter, setFilter, options, filterLabel }: { search: string; setSearch: (value: string) => void; placeholder: string; filter: string; setFilter: (value: string) => void; options: string[]; filterLabel: string }) {
  return <div className="filter-bar"><label className="search-field"><span className="search-icon">⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={placeholder} /></label><select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="">{filterLabel}</option>{options.map((option) => <option key={option}>{option}</option>)}</select><button className="button secondary filter-reset" onClick={() => { setSearch(''); setFilter(''); }}>↻ Đặt lại</button></div>;
}
function Panel({ title, count, children }: { title: string; count: string; children: React.ReactNode }) {
  return <section className="panel"><div className="panel-heading"><div><h2>{title}</h2><span>{count}</span></div><button className="more-button" aria-label="Tùy chọn">•••</button></div>{children}</section>;
}
function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return <div className="table-scroll"><table className="data-table"><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;
}
function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return <div className="row-actions"><button className="text-action" onClick={onEdit}>Sửa</button><button className="text-action red" onClick={onDelete}>Xóa</button></div>;
}
function StatusBadge({ value }: { value: string }) {
  const lower = value.toLowerCase();
  const tone = lower.includes('hoàn thành') || lower === 'completed' || lower === 'đã giao' || lower === 'active' || lower.includes('đang chứa') ? 'success' : lower.includes('pending') || lower.includes('chờ') || lower.includes('short') || lower.includes('reserve') || lower.includes('thiếu') ? 'warning' : lower.includes('cancel') ? 'danger' : lower.includes('trống') ? 'neutral' : 'info';
  return <span className={`status-badge ${tone}`}><i />{value.replaceAll('_', ' ')}</span>;
}
function EmptyState() {
  return <div className="empty-state"><span>⌕</span><strong>Không tìm thấy dữ liệu</strong><p>Thử thay đổi từ khóa hoặc bộ lọc của bạn.</p></div>;
}
function getInitials(name: string) {
  return name.trim().split(/\s+/).slice(-2).map((part) => part[0]?.toLocaleUpperCase('vi-VN') ?? '').join('');
}
function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('vi-VN');
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
        <div className="login-hint"><span>i</span> Tài khoản phải được tạo trong hệ thống WMS trước khi đăng nhập.</div>
      </section>
    </main>
  );
}

export default function App() {
  return <BrowserRouter><AdminApp /></BrowserRouter>;
}
