import { useCallback, useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { dataService, type ApiRecord } from '../API/api';
import { getApiErrorMessage } from '../API/errors';
import {
    ManagementFeedback,
    ManagementForm,
    ManagementList,
    ManagementPage,
    ManagementRowActions,
    ManagementSearch,
    type ManagementField,
} from '../components/ManagementUI';
import './Products.css';

type Product = { id: number; sku: string; name: string; category_id: number | null; unit: string; min_stock_level: number };
type Category = { id: number; name: string };
type ProductForm = { sku: string; name: string; category_id: string; unit: string; min_stock_level: string };

const emptyForm: ProductForm = { sku: '', name: '', category_id: '', unit: 'pcs', min_stock_level: '5' };

export default function ProductsManagement() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [form, setForm] = useState<ProductForm>(emptyForm);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [keyword, setKeyword] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [productRows, categoryRows] = await Promise.all([
                dataService.getAll<Product>('products'),
                dataService.getAll<Category>('categories'),
            ]);
            setProducts(productRows);
            setCategories(categoryRows);
        } catch (loadError) {
            console.error('Không thể tải sản phẩm:', loadError);
            setError(getApiErrorMessage(loadError));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void (async () => { await load(); })();
    }, [load]);

    const fields: ManagementField[] = [
        { name: 'sku', label: 'Mã SKU', required: true, maxLength: 50 },
        { name: 'name', label: 'Tên sản phẩm', required: true, maxLength: 150 },
        { name: 'category_id', label: 'Danh mục', options: categories.map((row) => ({ value: String(row.id), label: row.name })) },
        { name: 'unit', label: 'Đơn vị tính', required: true, maxLength: 20 },
        { name: 'min_stock_level', label: 'Tồn tối thiểu', type: 'number', required: true, min: 0 },
    ];

    const filteredProducts = useMemo(() => products.filter((product) =>
        `${product.sku} ${product.name}`.toLocaleLowerCase().includes(keyword.toLocaleLowerCase())
        && (!categoryFilter || String(product.category_id ?? '') === categoryFilter)), [products, keyword, categoryFilter]);

    const resetForm = () => {
        setForm(emptyForm);
        setEditingId(null);
    };

    const downloadQrCode = (containerId: string, sku: string) => {
        const svg = document.getElementById(containerId)?.querySelector('svg');
        if (!svg) {
            setError('Không tìm thấy mã QR để tải xuống.');
            return;
        }

        try {
            const svgData = new XMLSerializer().serializeToString(svg);
            const downloadUrl = URL.createObjectURL(new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' }));
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `${sku}-qr.svg`;
            document.body.append(link);
            link.click();
            link.remove();
            window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
        } catch (downloadError) {
            console.error('Không thể tải mã QR:', downloadError);
            setError('Không thể tải mã QR. Vui lòng thử lại.');
        }
    };

    const save = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');
        const payload: ApiRecord = {
            sku: form.sku.trim().toUpperCase(),
            name: form.name.trim(),
            category_id: form.category_id ? Number(form.category_id) : null,
            unit: form.unit.trim(),
            min_stock_level: Number(form.min_stock_level),
        };
        try {
            if (editingId === null) {
                await dataService.create('products', payload);
                setSuccess('Đã thêm sản phẩm vào MySQL.');
            } else {
                await dataService.update('products', editingId, payload);
                setSuccess('Đã cập nhật sản phẩm trong MySQL.');
            }
            resetForm();
            await load();
        } catch (saveError) {
            console.error('Không thể lưu sản phẩm:', saveError);
            setError(getApiErrorMessage(saveError));
        } finally {
            setSaving(false);
        }
    };

    const edit = (product: Product) => {
        setEditingId(product.id);
        setForm({
            sku: product.sku,
            name: product.name,
            category_id: product.category_id === null ? '' : String(product.category_id),
            unit: product.unit ?? '',
            min_stock_level: String(product.min_stock_level ?? 0),
        });
        setError('');
        setSuccess('');
    };

    const remove = async (product: Product) => {
        if (!window.confirm(`Bạn có chắc muốn xóa sản phẩm "${product.sku}" không?`)) return;
        setError('');
        setSuccess('');
        try {
            await dataService.delete('products', product.id);
            if (editingId === product.id) resetForm();
            setSuccess('Đã xóa sản phẩm khỏi MySQL.');
            await load();
        } catch (deleteError) {
            console.error('Không thể xóa sản phẩm:', deleteError);
            setError(getApiErrorMessage(deleteError));
        }
    };

    return <ManagementPage title="Quản lý sản phẩm / SKU" description="Thêm, sửa, xóa và lọc sản phẩm trong MySQL." onRefresh={() => void load()} loading={loading}>
        <ManagementFeedback error={error} success={success} />
        <ManagementSearch
            value={keyword}
            onChange={setKeyword}
            onSubmit={(event) => event.preventDefault()}
            onReset={() => { setKeyword(''); setCategoryFilter(''); }}
            placeholder="Tìm theo SKU hoặc tên sản phẩm..."
            loading={loading}
            filter={categoryFilter}
            onFilterChange={setCategoryFilter}
            filterOptions={categories.map((row) => ({ value: String(row.id), label: row.name }))}
            filterLabel="Tất cả danh mục"
        />
        <ManagementForm
            title={editingId === null ? 'Thêm sản phẩm' : 'Chỉnh sửa sản phẩm'}
            fields={fields}
            values={form}
            onChange={(name, value) => setForm({ ...form, [name]: value })}
            onSubmit={(event) => void save(event)}
            onCancel={resetForm}
            editing={editingId !== null}
            saving={saving}
            error=""
            submitLabel={editingId === null ? 'Thêm sản phẩm' : 'Lưu thay đổi'}
        />
        {form.sku.trim() && <section className="product-qr-preview" aria-label="Xem trước mã QR SKU">
            <div id="product-qr-preview" className="product-qr-code">
                <QRCodeSVG value={form.sku.trim().toUpperCase()} size={128} level="M" title={`Mã QR SKU ${form.sku.trim().toUpperCase()}`} />
                <strong>{form.sku.trim().toUpperCase()}</strong>
            </div>
            <div className="product-qr-copy">
                <h3>Mã QR cho SKU</h3>
                <p>Mã QR chứa đúng chuỗi SKU để mobile Picking quét trực tiếp.</p>
                <button type="button" onClick={() => downloadQrCode('product-qr-preview', form.sku.trim().toUpperCase())}>Tải mã QR (SVG)</button>
            </div>
        </section>}
        <ManagementList title="Danh sách sản phẩm" count={filteredProducts.length} loading={loading} headers={['ID', 'SKU', 'Tên sản phẩm', 'Danh mục', 'Đơn vị', 'Tồn tối thiểu', 'Mã QR', 'Thao tác']} emptyMessage="Chưa có sản phẩm phù hợp.">
            {filteredProducts.map((product) => <tr key={product.id}>
                <td>{product.id}</td><td className="management-primary">{product.sku}</td><td>{product.name}</td>
                <td>{categories.find((category) => category.id === product.category_id)?.name ?? '—'}</td>
                <td>{product.unit}</td><td>{product.min_stock_level}</td>
                <td>
                    <div className="product-qr-code product-qr-cell" id={`product-qr-${product.id}`}>
                        <QRCodeSVG value={product.sku} size={72} level="M" title={`Mã QR SKU ${product.sku}`} />
                        <button type="button" onClick={() => downloadQrCode(`product-qr-${product.id}`, product.sku)}>Tải SVG</button>
                    </div>
                </td>
                <td><ManagementRowActions onEdit={() => edit(product)} onDelete={() => void remove(product)} /></td>
            </tr>)}
        </ManagementList>
    </ManagementPage>;
}
