import { useCallback, useEffect, useMemo, useState } from 'react';
import { dataService, type ApiRecord } from '../API/api';
import { getApiErrorMessage } from '../API/errors';
import { ManagementFeedback, ManagementForm, ManagementList, ManagementPage, ManagementRowActions, ManagementSearch, type ManagementField } from '../components/ManagementUI';
import './Locations.css';

type Location = { id: number; bin_id: number | null; code: string; description: string | null };
type Bin = { id: number; name: string; shelf_id: number };
type LocationForm = { bin_id: string; code: string; description: string };
const emptyForm: LocationForm = { bin_id: '', code: '', description: '' };

export default function LocationsManagement() {
    const [locations, setLocations] = useState<Location[]>([]);
    const [bins, setBins] = useState<Bin[]>([]);
    const [form, setForm] = useState<LocationForm>(emptyForm);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [keyword, setKeyword] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [locationRows, binRows] = await Promise.all([
                dataService.getAll<Location>('locations'),
                dataService.getAll<Bin>('bins'),
            ]);
            setLocations(locationRows);
            setBins(binRows);
        } catch (loadError) {
            console.error('Không thể tải vị trí kho:', loadError);
            setError(getApiErrorMessage(loadError));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void (async () => { await load(); })();
    }, [load]);

    const fields: ManagementField[] = [
        { name: 'code', label: 'Mã vị trí', required: true, maxLength: 100 },
        { name: 'bin_id', label: 'Ô chứa (Bin)', options: bins.map((bin) => ({ value: String(bin.id), label: `${bin.name} (#${bin.id})` })) },
        { name: 'description', label: 'Mô tả' },
    ];
    const filteredLocations = useMemo(() => locations.filter((row) =>
        `${row.code} ${row.description ?? ''} ${bins.find((bin) => bin.id === row.bin_id)?.name ?? ''}`.toLocaleLowerCase().includes(keyword.toLocaleLowerCase())),
    [locations, bins, keyword]);

    const resetForm = () => {
        setForm(emptyForm);
        setEditingId(null);
    };

    const save = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');
        const payload: ApiRecord = {
            code: form.code.trim().toUpperCase(),
            bin_id: form.bin_id ? Number(form.bin_id) : null,
            description: form.description.trim() || null,
        };
        try {
            if (editingId === null) {
                await dataService.create('locations', payload);
                setSuccess('Đã thêm vị trí vào MySQL.');
            } else {
                await dataService.update('locations', editingId, payload);
                setSuccess('Đã cập nhật vị trí trong MySQL.');
            }
            resetForm();
            await load();
        } catch (saveError) {
            console.error('Không thể lưu vị trí:', saveError);
            setError(getApiErrorMessage(saveError));
        } finally {
            setSaving(false);
        }
    };

    const edit = (row: Location) => {
        setEditingId(row.id);
        setForm({ code: row.code, bin_id: row.bin_id === null ? '' : String(row.bin_id), description: row.description ?? '' });
        setError('');
        setSuccess('');
    };

    const remove = async (row: Location) => {
        if (!window.confirm(`Bạn có chắc muốn xóa vị trí "${row.code}" không?`)) return;
        setError('');
        setSuccess('');
        try {
            await dataService.delete('locations', row.id);
            if (editingId === row.id) resetForm();
            setSuccess('Đã xóa vị trí khỏi MySQL.');
            await load();
        } catch (deleteError) {
            console.error('Không thể xóa vị trí:', deleteError);
            setError(getApiErrorMessage(deleteError));
        }
    };

    return <ManagementPage title="Cấu hình vị trí kho" description="Quản lý mã vị trí, liên kết ô chứa và mô tả trong MySQL." onRefresh={() => void load()} loading={loading}>
        <ManagementFeedback error={error} success={success} />
        <ManagementSearch value={keyword} onChange={setKeyword} onSubmit={(event) => event.preventDefault()} onReset={() => setKeyword('')} placeholder="Tìm mã vị trí, mô tả hoặc ô chứa..." loading={loading} />
        <ManagementForm title={editingId === null ? 'Thêm vị trí kho' : 'Chỉnh sửa vị trí kho'} fields={fields} values={form} onChange={(name, value) => setForm({ ...form, [name]: value })} onSubmit={(event) => void save(event)} onCancel={resetForm} editing={editingId !== null} saving={saving} error="" submitLabel={editingId === null ? 'Thêm vị trí' : 'Lưu thay đổi'} />
        <ManagementList title="Danh sách vị trí" count={filteredLocations.length} loading={loading} headers={['ID', 'Mã vị trí', 'Ô chứa', 'Mô tả', 'Thao tác']} emptyMessage="Chưa có vị trí phù hợp.">
            {filteredLocations.map((row) => <tr key={row.id}>
                <td>{row.id}</td><td className="management-primary">{row.code}</td><td>{bins.find((bin) => bin.id === row.bin_id)?.name ?? '—'}</td>
                <td>{row.description || '—'}</td><td><ManagementRowActions onEdit={() => edit(row)} onDelete={() => void remove(row)} /></td>
            </tr>)}
        </ManagementList>
    </ManagementPage>;
}
