# Chạy backend WMS

1. Đảm bảo MySQL đang chạy và database `warehouse` đã được tạo.
2. Sao chép `.env.example` thành `.env`, sau đó nhập thông tin MySQL của máy:

   ```powershell
   Copy-Item .env.example .env
   ```

   Mở `.env` và cập nhật `DB_USER`, `DB_PASSWORD` nếu tài khoản MySQL không dùng giá trị mặc định.
3. Khởi động backend:

   ```powershell
   npm start
   ```

   Nếu dự án chưa có script `start`, dùng `node app.js`.
4. Ở cửa sổ terminal khác, chạy admin web bằng `npm run dev` trong `w-admin-web`.

Nếu thay đổi `.env`, hãy khởi động lại backend để nạp cấu hình mới. Không đưa file `.env` lên Git.

Sau khi nạp dữ liệu mẫu trong `database`, có thể đăng nhập thử bằng `admin_kho` hoặc `staff_kho1`; mật khẩu mẫu là `123`. Hãy đổi mật khẩu mẫu trước khi dùng hệ thống thật.
