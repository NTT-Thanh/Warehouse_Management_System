const Model = require('../models/usersModel');
const { hashPassword, verifyPassword } = require('../common/password');

exports.getAll = (req, res) => Model.getAll((err, users) => err ? res.status(500).json(err) : res.json(users));
exports.getById = (req, res) => Model.getById(req.params.id, (err, users) => err ? res.status(500).json(err) : users.length ? res.json(users[0]) : res.status(404).json({ message: 'User not found' }));

exports.login = (req, res) => {
  const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (!username || !password) return res.status(400).json({ message: 'Username and password are required' });

  Model.getByUsername(username, (err, users) => {
    if (err) return res.status(500).json({ message: 'Unable to authenticate user' });
    const user = users[0];
    verifyPassword(password, user?.password).then(async (isValid) => {
      if (!user || !isValid) {
        return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng.' });
      }

      if (!user.password.startsWith('scrypt$')) {
        try {
          const hashedPassword = await hashPassword(password);
          Model.update(user.id, { password: hashedPassword }, (updateError) => {
            if (updateError) console.error('Unable to upgrade legacy password hash:', updateError);
          });
        } catch (hashError) {
          console.error('Unable to upgrade legacy password hash:', hashError);
        }
      }

      const { password: _password, ...safeUser } = user;
      return res.json({ user: safeUser });
    }).catch((error) => {
      console.error('Unable to verify login password:', error);
      return res.status(500).json({ message: 'Unable to authenticate user' });
    });
  });
};

exports.create = async (req, res) => {
  const { username, password, full_name, role } = req.body;
  if (typeof username !== 'string' || !username.trim() || typeof password !== 'string' || !password || !['admin', 'staff', 'manager'].includes(role)) {
    return res.status(400).json({ message: 'Username, password, and a valid role are required' });
  }

  try {
    const hashedPassword = await hashPassword(password);
    Model.create({ username: username.trim(), password: hashedPassword, full_name: full_name || null, role }, (err, result) => {
      if (err) return res.status(500).json(err);
      return res.status(201).json({ id: result.insertId });
    });
  } catch (error) {
    console.error('Unable to hash new user password:', error);
    return res.status(500).json({ message: 'Unable to create user' });
  }
};

exports.update = async (req, res) => {
  const { username, password, full_name, role } = req.body;
  if (username !== undefined && (typeof username !== 'string' || !username.trim())) {
    return res.status(400).json({ message: 'Username cannot be empty' });
  }
  if (role !== undefined && !['admin', 'staff', 'manager'].includes(role)) {
    return res.status(400).json({ message: 'Invalid user role' });
  }
  if (password !== undefined && (typeof password !== 'string' || !password)) {
    return res.status(400).json({ message: 'Password cannot be empty' });
  }

  try {
    const updates = {};
    if (username !== undefined) updates.username = username.trim();
    if (full_name !== undefined) updates.full_name = full_name || null;
    if (role !== undefined) updates.role = role;
    if (password !== undefined) updates.password = await hashPassword(password);
    Model.update(req.params.id, updates, (err) => err ? res.status(500).json(err) : res.json({ message: 'Updated' }));
  } catch (error) {
    console.error('Unable to update user:', error);
    return res.status(500).json({ message: 'Unable to update user' });
  }
};

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