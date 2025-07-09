const db = require('../Configs/db.config');

// Save uploaded file info (with title & description)
exports.saveUpload = (filename, path, fileType, title, description) => {
  return db.execute(
    'INSERT INTO uploads (file_name, file_path, file_type, title, description) VALUES (?, ?, ?, ?, ?)',
    [filename, path, fileType, title, description]
  );
};

// Get all uploaded files
exports.getUploads = () => {
  return db.execute('SELECT * FROM uploads ORDER BY uploaded_at DESC');
};

// Update file_name, file_type, title, and description
exports.updateUpload = (id, file_name, file_type, title, description) => {
  return db.execute(
    'UPDATE uploads SET file_name = ?, file_type = ?, title = ?, description = ? WHERE id = ?',
    [file_name, file_type, title, description, id]
  );
};

// Delete upload record by ID
exports.deleteUpload = (id) => {
  return db.execute('DELETE FROM uploads WHERE id = ?', [id]);
};

// Get upload by ID (used before delete or view)
exports.getUploadById = (id) => {
  return db.execute('SELECT * FROM uploads WHERE id = ?', [id]);
};
