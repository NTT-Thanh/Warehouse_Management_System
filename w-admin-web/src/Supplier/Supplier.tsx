import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { supplierService, type Supplier, type SupplierPayload } from '../API/api';
import './Supplier.css';

const emptyForm: SupplierPayload = {
    name: '',
    phone: '',
    email: '',
    address: '',
};

export default function SupplierManagement() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [keyword, setKeyword] = useState('');
    const [submittedKeyword, setSubmittedKeyword] = useState('');
    const [form, setForm] = useState<SupplierPayload>(emptyForm);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const loadSuppliers = useCallback(async (searchTerm = '') => {
        setLoading(true);
        setErrorMessage('');
        try {
            const rows = searchTerm.trim()
                ? await supplierService.search(searchTerm.trim())
                : await supplierService.getAll();
            setSuppliers(rows);
        } catch (error) {
            console.error('Không thể tải danh sách nhà cung cấp:', error);
            setErrorMessage(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void (async () => {
            await loadSuppliers();
        })();
    }, [loadSuppliers]);

    const search = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const nextKeyword = keyword.trim();
        setSubmittedKeyword(nextKeyword);
        await loadSuppliers(nextKeyword);
    };

    const resetSearch = async () => {
        setKeyword('');
        setSubmittedKeyword('');
        await loadSuppliers();
    };

    const resetForm = () => {
        setForm(emptyForm);
        setEditingId(null);
    };

    const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');
        setSaving(true);
        const payload: SupplierPayload = {
            name: form.name.trim(),
            phone: form.phone?.trim() || null,
            email: form.email?.trim() || null,
            address: form.address?.trim() || null,
        };

        try {
            if (editingId === null) {
                await supplierService.create(payload);
                setSuccessMessage('Thêm nhà cung cấp thành công.');
            } else {
                await supplierService.update(editingId, payload);
                setSuccessMessage('Cập nhật nhà cung cấp thành công.');
            }
            resetForm();
            await loadSuppliers(submittedKeyword);
        } catch (error) {
            console.error('Không thể lưu nhà cung cấp:', error);
            setErrorMessage(getErrorMessage(error));
        } finally {
            setSaving(false);
        }
    };

    const editSupplier = (supplier: Supplier) => {
        setEditingId(supplier.id);
        setForm({
            name: supplier.name,
            phone: supplier.phone ?? '',
            email: supplier.email ?? '',
            address: supplier.address ?? '',
        });
        setErrorMessage('');
        setSuccessMessage('');
    };

    const deleteSupplier = async (supplier: Supplier) => {
        if (!window.confirm(`Bạn có chắc muốn xóa nhà cung cấp "${supplier.name}" không?`)) return;
        setErrorMessage('');
        setSuccessMessage('');
        try {
            await supplierService.delete(supplier.id);
            setSuccessMessage('Đã xóa nhà cung cấp.');
            if (editingId === supplier.id) resetForm();
            await loadSuppliers(submittedKeyword);
        } catch (error) {
            console.error('Không thể xóa nhà cung cấp:', error);
            setErrorMessage(getErrorMessage(error));
        }
    };

    return (
        <div className="supplier-management">
            <div className="supplier-heading">
                <div>
                    <h2>Quản lý nhà cung cấp</h2>
                    <p>Dữ liệu được lưu trực tiếp trong cơ sở dữ liệu MySQL.</p>
                </div>
                <button type="button" className="supplier-refresh" onClick={() => void loadSuppliers(submittedKeyword)} disabled={loading}>
                    {loading ? 'Đang tải...' : 'Tải lại danh sách'}
                </button>
            </div>

            {errorMessage && <div className="supplier-feedback error" role="alert">{errorMessage}</div>}
            {successMessage && <div className="supplier-feedback success" role="status">{successMessage}</div>}

            <form onSubmit={(event) => void search(event)} className="supplier-search">
                <input
                    type="search"
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder="Tìm theo tên, số điện thoại, email hoặc địa chỉ..."
                    aria-label="Tìm nhà cung cấp"
                />
                <button type="submit" disabled={loading}>Tìm kiếm</button>
                <button type="button" className="secondary" onClick={() => void resetSearch()} disabled={loading}>Xóa tìm kiếm</button>
            </form>

            <form onSubmit={(event) => void submitForm(event)} className="supplier-form">
                <h3>{editingId === null ? 'Thêm nhà cung cấp' : 'Chỉnh sửa nhà cung cấp'}</h3>
                <div className="supplier-form-grid">
                    <label>
                        <span>Tên nhà cung cấp *</span>
                        <input required maxLength={150} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Tên công ty / đối tác" />
                    </label>
                    <label>
                        <span>Số điện thoại</span>
                        <input maxLength={20} value={form.phone ?? ''} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="Số điện thoại liên hệ" />
                    </label>
                    <label>
                        <span>Email</span>
                        <input type="email" maxLength={100} value={form.email ?? ''} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="email@example.com" />
                    </label>
                    <label className="supplier-address">
                        <span>Địa chỉ</span>
                        <input maxLength={255} value={form.address ?? ''} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder="Địa chỉ nhà cung cấp" />
                    </label>
                </div>
                <div className="supplier-form-actions">
                    <button type="submit" disabled={saving}>{saving ? 'Đang lưu...' : editingId === null ? 'Thêm nhà cung cấp' : 'Lưu thay đổi'}</button>
                    {editingId !== null && <button type="button" className="secondary" onClick={resetForm}>Hủy chỉnh sửa</button>}
                </div>
            </form>

            <section className="supplier-list">
                <div className="supplier-list-heading">
                    <h3>Kết quả nhà cung cấp</h3>
                    <span>{suppliers.length} nhà cung cấp</span>
                </div>
                <div className="supplier-table-wrap">
                    <table>
                        <thead>
                            <tr><th>ID</th><th>Tên nhà cung cấp</th><th>Điện thoại</th><th>Email</th><th>Địa chỉ</th><th>Ngày tạo</th><th>Thao tác</th></tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} className="supplier-empty">Đang tải dữ liệu từ MySQL...</td></tr>
                            ) : suppliers.map((supplier) => (
                                <tr key={supplier.id}>
                                    <td>{supplier.id}</td>
                                    <td className="supplier-name">{supplier.name}</td>
                                    <td>{supplier.phone || '—'}</td>
                                    <td>{supplier.email || '—'}</td>
                                    <td>{supplier.address || '—'}</td>
                                    <td>{formatDate(supplier.created_at)}</td>
                                    <td>
                                        <div className="supplier-actions">
                                            <button type="button" onClick={() => editSupplier(supplier)}>Sửa</button>
                                            <button type="button" className="delete" onClick={() => void deleteSupplier(supplier)}>Xóa</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!loading && suppliers.length === 0 && (
                                <tr><td colSpan={7} className="supplier-empty">{submittedKeyword ? 'Không tìm thấy nhà cung cấp phù hợp.' : 'Chưa có nhà cung cấp nào.'}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

function formatDate(value: string) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('vi-VN');
}

function getErrorMessage(error: unknown) {
    if (axios.isAxiosError(error)) {
        if (error.code === 'ERR_NETWORK') return 'Không kết nối được backend. Hãy kiểm tra backend và kết nối MySQL.';
        if (error.response?.status === 409 || error.response?.data?.code === 'ER_ROW_IS_REFERENCED_2') {
            return 'Không thể xóa nhà cung cấp vì đang được sử dụng trong phiếu nhập.';
        }
        if (error.response?.data?.message) return String(error.response.data.message);
    }
    return 'Không thể hoàn thành thao tác nhà cung cấp. Hãy thử lại.';
}
