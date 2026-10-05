import axios from 'axios';

export function getApiErrorMessage(error: unknown) {
    if (axios.isAxiosError(error)) {
        const code = error.response?.data?.code;
        if (code === 'ER_ACCESS_DENIED_ERROR') return 'Backend không đăng nhập được MySQL. Kiểm tra cấu hình kết nối và khởi động lại backend.';
        if (code === 'ER_DUP_ENTRY') return 'Mã hoặc tên đã tồn tại trong MySQL. Hãy nhập giá trị khác.';
        if (code === 'ER_ROW_IS_REFERENCED_2') return 'Không thể xóa vì bản ghi đang được dữ liệu khác sử dụng.';
        if (error.code === 'ERR_NETWORK') return 'Không kết nối được backend. Hãy kiểm tra backend và kết nối MySQL.';
        if (error.response?.data?.message) return String(error.response.data.message);
    }
    return error instanceof Error ? error.message : 'Không thể hoàn thành thao tác. Hãy kiểm tra backend và kết nối MySQL.';
}
