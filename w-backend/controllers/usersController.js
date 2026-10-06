const Model = require('../models/usersModel');
exports.getAll = (req, res) => Model.getAll((err, r) => err ? res.status(500).json(err) : res.json(r));
exports.getById = (req, res) => Model.getById(req.params.id, (err, r) => err ? res.status(500).json(err) : res.json(r[0]));
exports.create = (req, res) => Model.create(req.body, (err, r) => err ? res.status(500).json(err) : res.json({ id: r.insertId }));
exports.update = (req, res) => Model.update(req.params.id, req.body, (err) => err ? res.status(500).json(err) : res.json({ message: 'Updated' }));
exports.delete = (req, res) => Model.delete(req.params.id, (err) => err ? res.status(500).json(err) : res.json({ message: 'Deleted' }));
exports.login = (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập tài khoản và mật khẩu!' });
    }

    Model.getByUsername(username, (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err });
        
        if (results.length === 0) {
            return res.status(401).json({ success: false, message: 'Tài khoản không tồn tại!' });
        }

        const user = results[0];

        // Lưu ý: Nếu bạn dùng bcrypt mã hóa mật khẩu, hãy dùng bcrypt.compareSync(password, user.password)
        // Nếu bạn lưu mật khẩu dạng chuỗi thuần để test nhanh, dùng so sánh trực tiếp:
        if (password !== user.password) {
            return res.status(401).json({ success: false, message: 'Mật khẩu không chính xác!' });
        }

        // Đăng nhập thành công, trả về thông tin user (ẩn password đi)
        const { password: _, ...userData } = user;
        return res.json({
            success: true,
            message: 'Đăng nhập thành công!',
            data: userData
        });
    });
};