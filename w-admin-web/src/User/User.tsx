import { useState, useEffect } from 'react';
import { userService } from '../API/api';
import './User.css';

type User = {
    id: number;
    username: string;
    full_name: string;
    role: 'admin' | 'staff' | 'manager';
    created_at: string;
};

export default function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    
    // State cho Form Thêm/Sửa
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        full_name: '',
        role: 'staff'
    });

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await userService.getAllUsers();
            setUsers(data);
        } catch (error) {
            console.error('Lỗi tải danh sách user:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing && currentId) {
                // Cập nhật (nếu để trống password thì có thể loại bỏ hoặc xử lý tùy backend)
                await userService.updateUser(currentId, formData);
                alert('Cập nhật nhân viên thành công!');
            } else {
                // Thêm mới
                await userService.createUser(formData);
                alert('Thêm nhân viên thành công!');
            }
            // Reset form và tải lại danh sách
            setFormData({ username: '', password: '', full_name: '', role: 'staff' });
            setIsEditing(false);
            setCurrentId(null);
            fetchUsers();
        } catch (error) {
            console.error('Lỗi thao tác:', error);
            alert('Có lỗi xảy ra!');
        }
    };

    const handleEdit = (user: User) => {
        setIsEditing(true);
        setCurrentId(user.id);
        setFormData({
            username: user.username,
            password: '', // Không hiện mật khẩu cũ vì lý do bảo mật
            full_name: user.full_name || '',
            role: user.role
        });
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Bạn có chắc muốn xóa tài khoản này không?')) {
            try {
                await userService.deleteUser(id);
                fetchUsers();
            } catch (error) {
                console.error('Lỗi khi xóa:', error);
            }
        }
    };

    return (
        <div className="user-management-container">
            <h2>Quản lý Tài khoản & Nhân viên</h2>

            {/* Form Thêm / Sửa */}
            <form onSubmit={handleSubmit} className="user-form">
                <h3>{isEditing ? 'Chỉnh sửa thông tin nhân viên' : 'Thêm nhân viên mới'}</h3>
                <div className="form-grid">
                    <input
                        type="text"
                        placeholder="Tên đăng nhập (Username)"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        required
                    />
                    <input
                        type="password"
                        placeholder={isEditing ? "Mật khẩu mới (bỏ trống nếu không đổi)" : "Mật khẩu"}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        {...(!isEditing ? { required: true } : {})}
                    />
                    <input
                        type="text"
                        placeholder="Họ và tên đầy đủ"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    />
                    <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    >
                        <option value="staff">Nhân viên (Staff)</option>
                        <option value="manager">Quản lý kho (Manager)</option>
                        <option value="admin">Quản trị viên (Admin)</option>
                    </select>
                </div>
                <div className="form-actions">
                    <button type="submit" className="btn-submit">
                        {isEditing ? 'Lưu thay đổi' : 'Thêm tài khoản'}
                    </button>
                    {isEditing && (
                        <button 
                            type="button" 
                            className="btn-cancel"
                            onClick={() => {
                                setIsEditing(false);
                                setFormData({ username: '', password: '', full_name: '', role: 'staff' });
                            }}
                        >
                            Hủy
                        </button>
                    )}
                </div>
            </form>

            {/* Bảng danh sách */}
            <div className="table-responsive">
                {loading ? (
                    <p>Đang tải dữ liệu...</p>
                ) : (
                    <table className="user-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Tên đăng nhập</th>
                                <th>Họ tên</th>
                                <th>Phân quyền (Role)</th>
                                <th>Ngày tạo</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u.id}>
                                    <td>{u.id}</td>
                                    <td>{u.username}</td>
                                    <td>{u.full_name}</td>
                                    <td>
                                        <span className={`badge-role ${u.role}`}>
                                            {u.role.toUpperCase()}
                                        </span>
                                    </td>
                                    <td>{new Date(u.created_at).toLocaleDateString('vi-VN')}</td>
                                    <td>
                                        <button onClick={() => handleEdit(u)} className="btn-edit">Sửa</button>
                                        <button onClick={() => handleDelete(u.id)} className="btn-delete">Xóa</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}