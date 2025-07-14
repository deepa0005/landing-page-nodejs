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

// ✅ Get Full Admin Profile
exports.getAdminProfile = async (req, res) => {
  const adminId = 1; // 🔥 Hardcoded for testing (make sure this admin exists in DB)

  try {
    const [rows] = await db.execute(`
      SELECT 
        id, username, full_name, email, phone, address, 
        language, time_zone, nationality, merchant_id, 
        profile_pic, role 
      FROM admin_auth 
      WHERE id = ?
    `, [adminId]);

    if (!rows.length) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const admin = rows[0];

    // Prepend full URL to image if it exists
    if (admin.profile_pic) {
      admin.profile_pic = `${req.protocol}://${req.get('host')}${admin.profile_pic}`;
    }

    res.json(admin);
  } catch (err) {
    console.error("❌ DB Error:", err.message);
    res.status(500).json({ error: err.message });
  }
};


exports.updateAdminProfile = async (req, res) => {
  // const adminId = req.session.adminId || req.user?.id; // Support both session and JWT
    const adminId = 1; // ✅ hardcoded for dev
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



// ✅ Forgot Password and mail

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const [rows] = await db.execute("SELECT * FROM admin_auth WHERE email = ?", [email]);
    const admin = rows[0];

    if (!admin) {
      return res.status(404).json({ message: "Admin not found with that email" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = Date.now() + 3600000; // 1 hour

    await db.execute(
      "UPDATE admin_auth SET reset_token = ?, reset_token_expiry = ? WHERE id = ?",
      [token, expiry, admin.id]
    );

    const resetLink = `http://${req.headers.host}/reset-password/${token}`;

    // ✅ Mail transport
    const transporter = nodemailer.createTransport({
      service: "Gmail", // or "Mailtrap"/"SendGrid" etc
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Admin Panel" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Reset Your Password",
      html: `
        <p>Hello ${admin.full_name || admin.username},</p>
        <p>You requested a password reset. Click below to proceed:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link is valid for 1 hour.</p>
      `,
    });

    res.json({ message: "Reset link sent to your email" });
  } catch (err) {
    console.error("❌ Forgot Password Error:", err);
    res.status(500).json({ message: "Failed to send reset link", error: err.message });
  }
};


exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const [rows] = await db.execute(
      "SELECT * FROM admin_auth WHERE reset_token = ? AND reset_token_expiry > ?",
      [token, Date.now()]
    );

    const admin = rows[0];
    if (!admin) return res.status(400).json({ message: "Invalid or expired token" });

    const hashed = await bcrypt.hash(password, 10);

    await db.execute(
      "UPDATE admin_auth SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?",
      [hashed, admin.id]
    );

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("❌ Reset Password Error:", err);
    res.status(500).json({ message: "Reset failed", error: err.message });
  }
};
