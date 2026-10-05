import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { shippingService, type Shipping, type ShippingPayload } from '../API/api';
import './Shipping.css';

const emptyForm: ShippingPayload = {
    name: '',
    phone: '',
    contact_person: '',
};

export default function ShippingManagement() {
    const [shippings, setShippings] = useState<Shipping[]>([]);
    const [keyword, setKeyword] = useState('');
    const [submittedKeyword, setSubmittedKeyword] = useState('');
    const [form, setForm] = useState<ShippingPayload>(emptyForm);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const loadShippings = useCallback(async (searchTerm = '') => {
        setLoading(true);
        setErrorMessage('');
        try {
            const rows = searchTerm.trim()
                ? await shippingService.search(searchTerm.trim())
                : await shippingService.getAll();
            setShippings(rows);
        } catch (error) {
            console.error('Không thể tải danh sách đơn vị vận chuyển:', error);
            setErrorMessage(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void (async () => {
            await loadShippings();
        })();
    }, [loadShippings]);

    const search = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const nextKeyword = keyword.trim();
        setSubmittedKeyword(nextKeyword);
        await loadShippings(nextKeyword);
    };

    const resetSearch = async () => {
        setKeyword('');
        setSubmittedKeyword('');
        await loadShippings();
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
        const payload: ShippingPayload = {
            name: form.name.trim(),
            phone: form.phone?.trim() || null,
            contact_person: form.contact_person?.trim() || null,
        };

        try {
            if (editingId === null) {
                await shippingService.create(payload);
                setSuccessMessage('Thêm đơn vị vận chuyển thành công.');
            } else {
                await shippingService.update(editingId, payload);
                setSuccessMessage('Cập nhật đơn vị vận chuyển thành công.');
            }
            resetForm();
            await loadShippings(submittedKeyword);
        } catch (error) {
            console.error('Không thể lưu đơn vị vận chuyển:', error);
            setErrorMessage(getErrorMessage(error));
        } finally {
            setSaving(false);
        }
    };

    const editShipping = (shipping: Shipping) => {
        setEditingId(shipping.id);
        setForm({
            name: shipping.name,
            phone: shipping.phone ?? '',
            contact_person: shipping.contact_person ?? '',
        });
        setErrorMessage('');
        setSuccessMessage('');
    };

    const deleteShipping = async (shipping: Shipping) => {
        if (!window.confirm(`Bạn có chắc muốn xóa đơn vị vận chuyển "${shipping.name}" không?`)) return;
        setErrorMessage('');
        setSuccessMessage('');
        try {
            await shippingService.delete(shipping.id);
            setSuccessMessage('Đã xóa đơn vị vận chuyển.');
            if (editingId === shipping.id) resetForm();
            await loadShippings(submittedKeyword);
        } catch (error) {
            console.error('Không thể xóa đơn vị vận chuyển:', error);
            setErrorMessage(getErrorMessage(error));
        }
    };

    return (
        <div className="shipping-management">
            <div className="shipping-heading">
                <div>
                    <h2>Quản lý đơn vị vận chuyển</h2>
                    <p>Dữ liệu được lưu trực tiếp trong cơ sở dữ liệu MySQL.</p>
                </div>
                <button type="button" className="shipping-refresh" onClick={() => void loadShippings(submittedKeyword)} disabled={loading}>
                    {loading ? 'Đang tải...' : 'Tải lại danh sách'}
                </button>
            </div>

            {errorMessage && <div className="shipping-feedback error" role="alert">{errorMessage}</div>}
            {successMessage && <div className="shipping-feedback success" role="status">{successMessage}</div>}

            <form onSubmit={search} className="shipping-search">
                <input
                    type="search"
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder="Tìm theo tên, số điện thoại hoặc người liên hệ..."
                    aria-label="Tìm đơn vị vận chuyển"
                />
                <button type="submit" disabled={loading}>Tìm kiếm</button>
                <button type="button" className="secondary" onClick={() => void resetSearch()} disabled={loading}>Xóa tìm kiếm</button>
            </form>

            <form onSubmit={(event) => void submitForm(event)} className="shipping-form">
                <h3>{editingId === null ? 'Thêm đơn vị vận chuyển' : 'Chỉnh sửa đơn vị vận chuyển'}</h3>
                <div className="shipping-form-grid">
                    <label>
                        <span>Tên đơn vị vận chuyển *</span>
                        <input required maxLength={100} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Ví dụ: Viettel Post" />
                    </label>
                    <label>
                        <span>Số điện thoại</span>
                        <input maxLength={20} value={form.phone ?? ''} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="Số hotline" />
                    </label>
                    <label>
                        <span>Người liên hệ</span>
                        <input maxLength={100} value={form.contact_person ?? ''} onChange={(event) => setForm({ ...form, contact_person: event.target.value })} placeholder="Tên người liên hệ" />
                    </label>
                </div>
                <div className="shipping-form-actions">
                    <button type="submit" disabled={saving}>{saving ? 'Đang lưu...' : editingId === null ? 'Thêm đơn vị' : 'Lưu thay đổi'}</button>
                    {editingId !== null && <button type="button" className="secondary" onClick={resetForm}>Hủy chỉnh sửa</button>}
                </div>
            </form>

            <section className="shipping-list">
                <div className="shipping-list-heading">
                    <h3>Kết quả đơn vị vận chuyển</h3>
                    <span>{shippings.length} đơn vị</span>
                </div>
                <div className="shipping-table-wrap">
                    <table>
                        <thead>
                            <tr><th>ID</th><th>Tên đơn vị</th><th>Số điện thoại</th><th>Người liên hệ</th><th>Ngày tạo</th><th>Thao tác</th></tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="shipping-empty">Đang tải dữ liệu từ MySQL...</td></tr>
                            ) : shippings.map((shipping) => (
                                <tr key={shipping.id}>
                                    <td>{shipping.id}</td>
                                    <td className="shipping-name">{shipping.name}</td>
                                    <td>{shipping.phone || '—'}</td>
                                    <td>{shipping.contact_person || '—'}</td>
                                    <td>{formatDate(shipping.created_at)}</td>
                                    <td>
                                        <div className="shipping-actions">
                                            <button type="button" onClick={() => editShipping(shipping)}>Sửa</button>
                                            <button type="button" className="delete" onClick={() => void deleteShipping(shipping)}>Xóa</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!loading && shippings.length === 0 && (
                                <tr><td colSpan={6} className="shipping-empty">{submittedKeyword ? 'Không tìm thấy đơn vị vận chuyển phù hợp.' : 'Chưa có đơn vị vận chuyển nào.'}</td></tr>
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
            return 'Không thể xóa đơn vị vận chuyển vì đang được sử dụng trong đơn xuất.';
        }
        if (error.response?.data?.message) return String(error.response.data.message);
    }
    return 'Không thể hoàn thành thao tác đơn vị vận chuyển. Hãy thử lại.';
}
