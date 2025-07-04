const db = require('../Configs/db.config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ✅ Admin Login
exports.adminLogin = async (req, res) => {
  const { username, password } = req.body;

  try {
    console.log("🔍 Incoming login:", { username, password });

    const [rows] = await db.execute('SELECT * FROM admin_auth WHERE username = ?', [username]);
    const admin = rows[0];

    if (!admin) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    // ✅ Set session
    req.session.adminId = admin.id;
    console.log("🟢 Session set:", req.session.adminId);

    // ✅ Also send JWT for frontend if needed
    const token = jwt.sign({ id: admin.id, username: admin.username }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    res.status(200).json({
      message: 'Login successful',
      token,
      username: admin.username,
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ✅ Admin Logout
exports.logout = (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ message: 'Logout failed', error: err });
      res.clearCookie('connect.sid'); // Optional: clear session cookie
      res.json({ message: 'Admin logged out successfully.' });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Change Password
exports.changePassword = async (req, res) => {
  const adminId = req.session.adminId || req.user?.id; // Support both session and JWT

  if (!adminId) return res.status(401).json({ message: 'Unauthorized' });

  const { oldPassword, newPassword } = req.body;

  try {
    const [rows] = await db.execute('SELECT * FROM admin_auth WHERE id = ?', [adminId]);
    const admin = rows[0];

    const isMatch = await bcrypt.compare(oldPassword, admin.password);
    if (!isMatch) return res.status(400).json({ message: 'Old password incorrect' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.execute('UPDATE admin_auth SET password = ? WHERE id = ?', [hashedPassword, adminId]);

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get Admin Profile
exports.getAdminProfile = async (req, res) => {
  const adminId = req.session.adminId || req.user?.id;

  if (!adminId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const [rows] = await db.execute('SELECT id, username, email, role FROM admin_auth WHERE id = ?', [adminId]);

    if (!rows.length) return res.status(404).json({ message: 'Admin not found' });

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateAdminProfile = async (req, res) => {
  const adminId = req.session.adminId || req.user?.id;
  const {
    full_name,
    email,
    phone,
    address,
    language,
    time_zone,
    nationality,
    merchant_id
  } = req.body;

  let profile_pic = null;

  if (req.file) {
    profile_pic = `/uploads/${req.file.filename}`;
  }

  if (!adminId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const [result] = await db.execute(
      `UPDATE admin_auth 
       SET full_name = ?, email = ?, phone = ?, address = ?, 
           language = ?, time_zone = ?, nationality = ?, 
           merchant_id = ?, profile_pic = ?
       WHERE id = ?`,
      [
        full_name,
        email,
        phone,
        address,
        language,
        time_zone,
        nationality,
        merchant_id,
        profile_pic,
        adminId
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Profile not found or no changes made' });
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
