import type { ReactNode } from 'react';
import './ManagementUI.css';

export type SelectOption = { value: string; label: string };
export type ManagementField = {
    name: string;
    label: string;
    type?: string;
    required?: boolean;
    min?: number;
    maxLength?: number;
    options?: SelectOption[];
};

export function ManagementPage({ title, description, onRefresh, loading, children }: {
    title: string;
    description: string;
    onRefresh: () => void;
    loading: boolean;
    children: ReactNode;
}) {
    return (
        <div className="management-page">
            <header className="management-heading">
                <div><h2>{title}</h2><p>{description}</p></div>
                <button type="button" onClick={onRefresh} disabled={loading}>{loading ? 'Đang tải...' : 'Tải lại danh sách'}</button>
            </header>
            {children}
        </div>
    );
}

export function ManagementFeedback({ error, success }: { error: string; success: string }) {
    return <>
        {error && <div className="management-feedback error" role="alert">{error}</div>}
        {success && <div className="management-feedback success" role="status">{success}</div>}
    </>;
}

export function ManagementSearch({ value, onChange, onSubmit, onReset, placeholder, loading, filter, onFilterChange, filterOptions, filterLabel }: {
    value: string;
    onChange: (value: string) => void;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
    onReset: () => void;
    placeholder: string;
    loading: boolean;
    filter?: string;
    onFilterChange?: (value: string) => void;
    filterOptions?: SelectOption[];
    filterLabel?: string;
}) {
    return <form onSubmit={onSubmit} className="management-search">
        <input type="search" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-label="Tìm kiếm" />
        {filterOptions && onFilterChange && <select value={filter ?? ''} onChange={(event) => onFilterChange(event.target.value)}>
            <option value="">{filterLabel ?? 'Tất cả'}</option>
            {filterOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>}
        <button type="submit" disabled={loading}>Tìm kiếm</button>
        <button type="button" className="secondary" onClick={onReset} disabled={loading}>Đặt lại</button>
    </form>;
}

export function ManagementForm({ title, fields, values, onChange, onSubmit, onCancel, editing, saving, error, submitLabel }: {
    title: string;
    fields: ManagementField[];
    values: Record<string, string>;
    onChange: (name: string, value: string) => void;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
    onCancel: () => void;
    editing: boolean;
    saving: boolean;
    error: string;
    submitLabel?: string;
}) {
    return <form onSubmit={onSubmit} className="management-form">
        <h3>{title}</h3>
        <div className="management-form-grid">
            {fields.map((field) => <label key={field.name}>
                <span>{field.label}{field.required && ' *'}</span>
                {field.options ? <select required={field.required} value={values[field.name] ?? ''} onChange={(event) => onChange(field.name, event.target.value)}>
                    <option value="">-- Chọn --</option>
                    {field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select> : <input
                    type={field.type ?? 'text'}
                    required={field.required}
                    min={field.min}
                    maxLength={field.maxLength}
                    value={values[field.name] ?? ''}
                    onChange={(event) => onChange(field.name, event.target.value)}
                />}
            </label>)}
        </div>
        {error && <div className="management-feedback error" role="alert">{error}</div>}
        <div className="management-actions">
            <button type="submit" disabled={saving}>{saving ? 'Đang lưu...' : submitLabel ?? (editing ? 'Lưu thay đổi' : 'Thêm mới')}</button>
            {editing && <button type="button" className="secondary" onClick={onCancel}>Hủy chỉnh sửa</button>}
        </div>
    </form>;
}

export function ManagementList({ title, count, loading, headers, children, emptyMessage }: {
    title: string;
    count: number;
    loading: boolean;
    headers: string[];
    children: ReactNode;
    emptyMessage: string;
}) {
    return <section className="management-list">
        <div className="management-list-heading"><h3>{title}</h3><span>{count}</span></div>
        <div className="management-table-wrap">
            <table>
                <thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead>
                <tbody>{loading ? <tr><td colSpan={headers.length} className="management-empty">Đang tải dữ liệu từ MySQL...</td></tr> : children}</tbody>
            </table>
            {!loading && count === 0 && <div className="management-empty">{emptyMessage}</div>}
        </div>
    </section>;
}

export function ManagementRowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
    return <div className="management-row-actions">
        <button type="button" onClick={onEdit}>Sửa</button>
        <button type="button" className="delete" onClick={onDelete}>Xóa</button>
    </div>;
}

export function ManagementStatus({ value, labels }: { value: string; labels?: Record<string, string> }) {
    const status = value.toLowerCase();
    const tone = status === 'completed' || status === 'dispatched' ? 'success'
        : status === 'pending' || status === 'short_picked' ? 'warning'
            : status === 'cancelled' ? 'danger' : 'info';
    return <span className={`management-status ${tone}`}>{labels?.[value] ?? value.replaceAll('_', ' ')}</span>;
}
