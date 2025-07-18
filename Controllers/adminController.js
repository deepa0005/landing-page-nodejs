const db = require('../Configs/db.config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

exports.adminLogin = async (req, res) => {
  const { username, password } = req.body;


  const resetTokens = {}; // Format: { token: { email, expires } }

  
  try {
    const [rows] = await db.execute('SELECT * FROM admin_auth WHERE username = ?', [username]);
    const admin = rows[0];

    if (!admin) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    req.session.adminId = admin.id;
    req.session.role = admin.role;
    req.session.permissions = admin.permissions;

    const token = jwt.sign(
      {
        id: admin.id,
        username: admin.username,
        role: admin.role,
        permissions: admin.permissions
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      username: admin.username,
      role: admin.role,
      permissions: admin.permissions ? JSON.parse(admin.permissions) : {}
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.adminLogout = (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ message: 'Logout failed' });
    res.clearCookie('connect.sid');
    res.status(200).json({ message: 'Logout successful' });
  });
};

exports.changePassword = async (req, res) => {
  const adminId = req.session.adminId;
  const { currentPassword, newPassword } = req.body;

  if (!adminId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const [rows] = await db.execute('SELECT password FROM admin_auth WHERE id = ?', [adminId]);
    const admin = rows[0];

    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) return res.status(401).json({ message: 'Current password is incorrect' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.execute('UPDATE admin_auth SET password = ? WHERE id = ?', [hashedPassword, adminId]);

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const [rows] = await db.execute('SELECT id FROM admin_auth WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Email not found' });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    resetTokens[token] = {
      email,
      expires: Date.now() + 15 * 60 * 1000, // token valid for 15 minutes
    };

    // In real apps, send via email (like nodemailer)
    res.status(200).json({
      message: 'Reset token generated successfully',
      token, // send only for testing; remove in production
    });
  } catch (error) {
    console.error('❌ Forgot Password Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 👉 Reset Password using Token
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const record = resetTokens[token];
    if (!record) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    if (Date.now() > record.expires) {
      delete resetTokens[token];
      return res.status(400).json({ message: 'Token expired' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.execute('UPDATE admin_auth SET password = ? WHERE email = ?', [
      hashedPassword,
      record.email,
    ]);

    delete resetTokens[token]; // Remove used token
    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('❌ Reset Password Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// controllers/adminController.js

exports.getAdminProfile = async (req, res) => {
  const adminId = req.user?.id;

  if (!adminId) {
    return res.status(400).json({ message: 'Admin ID is missing from token.' });
  }

  try {
    const [rows] = await db.execute(
      'SELECT id, username, email, full_name, role FROM admin_auth WHERE id = ?',
      [adminId]
    );

    const admin = rows[0];

    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    res.status(200).json(admin); // ✅ permissions removed
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};



exports.updateAdminProfile = async (req, res) => {
const adminId = req.user?.id;
  const { full_name, email } = req.body;
  let profileImage = null;

  if (req.file) {
    profileImage = req.file.filename;

    const [rows] = await db.execute('SELECT profile_image FROM admin_auth WHERE id = ?', [adminId]);
    const oldImage = rows[0]?.profile_image;

    if (oldImage) {
      const oldImagePath = path.join(__dirname, '../uploads/admin_profiles', oldImage);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }
  }

  try {
    const updateQuery = profileImage
      ? 'UPDATE admin_auth SET full_name = ?, email = ?, profile_image = ? WHERE id = ?'
      : 'UPDATE admin_auth SET full_name = ?, email = ? WHERE id = ?';

    const values = profileImage
      ? [full_name, email, profileImage, adminId]
      : [full_name, email, adminId];

    await db.execute(updateQuery, values);
    res.status(200).json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ✅ Create subadmin with permissions
exports.createSubadmin = async (req, res) => {
  try {
    const {
      full_name,
      email,
      phone,
      address,
      role = 'subadmin',
      permissions
    } = req.body;

    let profile_pic = null;
    if (req.file) {
      profile_pic = req.file.filename;
    }

    const [existing] = await db.execute('SELECT id FROM subadmins WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const permissionsJSON = JSON.stringify(permissions || {});

    await db.execute(
      'INSERT INTO subadmins (full_name, email, phone, address, role, permissions, profile_pic) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [full_name, email, phone, address, role, permissionsJSON, profile_pic]
    );

    res.status(201).json({ message: 'Subadmin created successfully' });
  } catch (err) {
    console.error("Error creating subadmin:", err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


// ✅ Get all subadmins
exports.getAllSubadmins = async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, full_name, email, phone, address, role, permissions, profile_pic, created_at FROM subadmins'
    );

    const parsed = rows.map(row => ({
      ...row,
      permissions: row.permissions ? JSON.parse(row.permissions) : {}
    }));

    res.status(200).json(parsed);
  } catch (err) {
    console.error("Error fetching subadmins:", err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


exports.updateSubadmin = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      full_name,
      email,
      phone,
      address,
      role,
      permissions
    } = req.body;

    let profile_pic = null;
    if (req.file) {
      profile_pic = req.file.filename;
    }

    // Check if subadmin exists
    const [existing] = await db.execute('SELECT * FROM subadmins WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Subadmin not found' });
    }

    const updatedFields = [];
    const values = [];

    if (full_name) {
      updatedFields.push('full_name = ?');
      values.push(full_name);
    }
    if (email) {
      updatedFields.push('email = ?');
      values.push(email);
    }
    if (phone) {
      updatedFields.push('phone = ?');
      values.push(phone);
    }
    if (address) {
      updatedFields.push('address = ?');
      values.push(address);
    }
    if (role) {
      updatedFields.push('role = ?');
      values.push(role);
    }
    if (permissions) {
      updatedFields.push('permissions = ?');
      values.push(JSON.stringify(permissions));
    }
    if (profile_pic) {
      updatedFields.push('profile_pic = ?');
      values.push(profile_pic);
    }

    if (updatedFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    const sql = `UPDATE subadmins SET ${updatedFields.join(', ')} WHERE id = ?`;
    values.push(id);

    await db.execute(sql, values);

    res.status(200).json({ message: 'Subadmin updated successfully' });
  } catch (err) {
    console.error("Error updating subadmin:", err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteSubadmin = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db.execute('SELECT * FROM subadmins WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Subadmin not found' });
    }

    await db.execute('DELETE FROM subadmins WHERE id = ?', [id]);

    res.status(200).json({ message: 'Subadmin deleted successfully' });
  } catch (err) {
    console.error("Error deleting subadmin:", err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

