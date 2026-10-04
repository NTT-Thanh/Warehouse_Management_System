import { useEffect, useState } from 'react';
import axios from 'axios';
import { userService, type UserPayload } from '../API/api';
import './User.css';

type User = {
    id: number;
    username: string;
    full_name: string;
    role: UserPayload['role'];
    created_at: string;
};

const emptyForm: UserPayload = {
    username: '',
    password: '',
    full_name: '',
    role: 'staff',
};
const userRoles: UserPayload['role'][] = ['staff', 'manager', 'admin'];

function getErrorMessage(error: unknown) {
    if (axios.isAxiosError(error)) {
        const code = error.response?.data?.code;
        if (code === 'ER_ACCESS_DENIED_ERROR') {
            return 'Backend không đăng nhập được MySQL. Kiểm tra DB_USER và DB_PASSWORD trong w-backend/.env, sau đó khởi động lại backend.';
        }
        if (code === 'ER_DUP_ENTRY') {
            return 'Tên đăng nhập này đã tồn tại. Vui lòng chọn tên khác.';
        }
        if (error.code === 'ERR_NETWORK') {
            return 'Không gọi được backend. Hãy khởi động lại backend sau khi cập nhật, rồi mở admin bằng localhost:5173 hoặc 127.0.0.1:5173.';
        }
    }
    return 'Không thể hoàn thành thao tác tài khoản. Hãy kiểm tra backend và thử lại.';
}

export default function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState<number | null>(null);
    const [formData, setFormData] = useState<UserPayload>(emptyForm);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const fetchUsers = async () => {
        try {
            const data = await userService.getAllUsers();
            setUsers(data);
            setErrorMessage('');
        } catch (error) {
            console.error('Lỗi tải danh sách user:', error);
            setErrorMessage(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let mounted = true;
        userService.getAllUsers()
            .then((data) => {
                if (mounted) {
                    setUsers(data);
                    setErrorMessage('');
                }
            })
            .catch((error: unknown) => {
                console.error('Lỗi tải danh sách user:', error);
                if (mounted) setErrorMessage(getErrorMessage(error));
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });
        return () => {
            mounted = false;
        };
    }, []);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');
        try {
            if (isEditing && currentId !== null) {
                await userService.updateUser(currentId, {
                    ...formData,
                    password: formData.password || undefined,
                });
                setSuccessMessage('Cập nhật nhân viên thành công.');
            } else {
                await userService.createUser(formData);
                setSuccessMessage('Thêm nhân viên thành công.');
            }
            setFormData(emptyForm);
            setIsEditing(false);
            setCurrentId(null);
            setLoading(true);
            await fetchUsers();
        } catch (error) {
            console.error('Lỗi thao tác tài khoản:', error);
            setErrorMessage(getErrorMessage(error));
        }
    };

    const handleEdit = (user: User) => {
        setIsEditing(true);
        setCurrentId(user.id);
        setFormData({
            username: user.username,
            password: '',
            full_name: user.full_name || '',
            role: user.role,
        });
        setErrorMessage('');
        setSuccessMessage('');
    };

    const cancelEdit = () => {
        setIsEditing(false);
        setCurrentId(null);
        setFormData(emptyForm);
        setErrorMessage('');
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Bạn có chắc muốn xóa tài khoản này không?')) return;
        setErrorMessage('');
        setSuccessMessage('');
        try {
            await userService.deleteUser(id);
            setSuccessMessage('Đã xóa tài khoản.');
            setLoading(true);
            await fetchUsers();
        } catch (error) {
            console.error('Lỗi khi xóa tài khoản:', error);
            setErrorMessage(getErrorMessage(error));
        }
    };

    return (
        <div className="user-management-container">
            <div className="user-page-heading">
                <div>
                    <h2>Quản lý tài khoản & nhân viên</h2>
                    <p>Tạo tài khoản và phân quyền cho nhân viên kho.</p>
                </div>
                <button type="button" className="user-refresh" onClick={() => { setLoading(true); void fetchUsers(); }}>
                    Tải lại danh sách
                </button>
            </div>

            {errorMessage && <div className="user-feedback error" role="alert">{errorMessage}</div>}
            {successMessage && <div className="user-feedback success" role="status">{successMessage}</div>}

            <form onSubmit={handleSubmit} className="user-form">
                <h3>{isEditing ? 'Chỉnh sửa thông tin nhân viên' : 'Thêm nhân viên mới'}</h3>
                <div className="form-grid">
                    <label>
                        <span>Tên đăng nhập *</span>
                        <input
                            type="text"
                            autoComplete="username"
                            placeholder="Ví dụ: nhanvien01"
                            value={formData.username}
                            onChange={(event) => setFormData({ ...formData, username: event.target.value })}
                            required
                        />
                    </label>
                    <label>
                        <span>{isEditing ? 'Mật khẩu mới' : 'Mật khẩu *'}</span>
                        <input
                            type="password"
                            autoComplete={isEditing ? 'new-password' : 'new-password'}
                            placeholder={isEditing ? 'Để trống nếu không đổi mật khẩu' : 'Nhập mật khẩu'}
                            value={formData.password ?? ''}
                            onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                            required={!isEditing}
                        />
                    </label>
                    <label>
                        <span>Họ và tên</span>
                        <input
                            type="text"
                            autoComplete="name"
                            placeholder="Nhập họ và tên"
                            value={formData.full_name}
                            onChange={(event) => setFormData({ ...formData, full_name: event.target.value })}
                        />
                    </label>
                    <label>
                        <span>Phân quyền</span>
                        <select
                            value={formData.role}
                            onChange={(event) => {
                                const role = userRoles.find((item) => item === event.target.value);
                                if (role) setFormData({ ...formData, role });
                            }}
                        >
                            <option value="staff">Nhân viên (Staff)</option>
                            <option value="manager">Quản lý kho (Manager)</option>
                            <option value="admin">Quản trị viên (Admin)</option>
                        </select>
                    </label>
                </div>
                <div className="form-actions">
                    <button type="submit" className="btn-submit" disabled={loading}>
                        {loading ? 'Đang lưu...' : isEditing ? 'Lưu thay đổi' : 'Thêm tài khoản'}
                    </button>
                    {isEditing && (
                        <button type="button" className="btn-cancel" onClick={cancelEdit}>
                            Hủy
                        </button>
                    )}
                </div>
            </form>

            <section className="user-list-panel">
                <div className="user-list-heading">
                    <h3>Danh sách tài khoản</h3>
                    <span>{users.length} tài khoản</span>
                </div>
                <div className="table-responsive">
                    {loading ? (
                        <p className="user-empty">Đang tải dữ liệu...</p>
                    ) : (
                        <table className="user-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Tên đăng nhập</th>
                                    <th>Họ tên</th>
                                    <th>Phân quyền</th>
                                    <th>Ngày tạo</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id}>
                                        <td>{user.id}</td>
                                        <td>{user.username}</td>
                                        <td>{user.full_name}</td>
                                        <td><span className={`badge-role ${user.role}`}>{user.role.toUpperCase()}</span></td>
                                        <td>{user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : '—'}</td>
                                        <td>
                                            <button type="button" onClick={() => handleEdit(user)} className="btn-edit">Sửa</button>
                                            <button type="button" onClick={() => void handleDelete(user.id)} className="btn-delete">Xóa</button>
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && <tr><td colSpan={6} className="user-empty">Chưa có tài khoản nào.</td></tr>}
                            </tbody>
                        </table>
                    )}
                </div>
            </section>
        </div>
    );
}
