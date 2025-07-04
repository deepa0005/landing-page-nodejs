const db = require('../Configs/db.config');

// Save uploaded file info
exports.saveUpload = (filename, path, fileType) => {
  return db.execute(
    'INSERT INTO uploads (file_name, file_path, file_type) VALUES (?, ?, ?)',
    [filename, path, fileType]
  );
};

// Get all uploaded files
exports.getUploads = () => {
  return db.execute('SELECT * FROM uploads ORDER BY uploaded_at DESC');
};


// Update file_name and file_type in DB
exports.updateUpload = (id, file_name, file_type) => {
  return db.execute(
    'UPDATE uploads SET file_name = ?, file_type = ? WHERE id = ?',
    [file_name, file_type, id]
  );
};

// Delete upload record by ID
exports.deleteUpload = (id) => {
  return db.execute('DELETE FROM uploads WHERE id = ?', [id]);
};

// Get upload by ID (used before delete)
exports.getUploadById = (id) => {
  return db.execute('SELECT * FROM uploads WHERE id = ?', [id]);
};