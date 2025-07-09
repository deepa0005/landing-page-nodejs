const db = require('../Configs/db.config');
const fs = require('fs');
const path = require('path');

// Upload file with title & description
exports.uploadFile = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const { filename, mimetype, path: filePath } = req.file;
  const { title, description } = req.body;

  try {
    await db.execute(
      'INSERT INTO uploads (file_name, file_path, file_type, title, description) VALUES (?, ?, ?, ?, ?)',
      [filename, filePath, mimetype.startsWith('image') ? 'image' : 'video', title, description]
    );
    console.log(req.body.title, req.body.description);
    res.status(201).json({ message: 'File uploaded successfully', file: filename });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all uploaded files
exports.getUploads = async (req, res) => {
  try {
    const [files] = await db.execute('SELECT * FROM uploads ORDER BY uploaded_at DESC');
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete file by ID
exports.deleteUpload = async (req, res) => {
  const id = req.params.id;

  try {
    const [rows] = await db.execute('SELECT * FROM uploads WHERE id = ?', [id]);
    const file = rows[0];

    if (!file) return res.status(404).json({ message: 'File not found' });

    const filePath = path.join(__dirname, '..', file.file_path);
    fs.unlink(filePath, async (err) => {
      if (err) {
        return res.status(500).json({ message: 'File not found on server', error: err.message });
      }

      await db.execute('DELETE FROM uploads WHERE id = ?', [id]);
      res.json({ message: 'File deleted from DB and server' });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update file_name, file_type, title, and description
exports.updateUpload = async (req, res) => {
  const id = req.params.id;
  const { file_name, file_type, title, description } = req.body;

  try {
    const [result] = await db.execute(
      'UPDATE uploads SET file_name = ?, file_type = ?, title = ?, description = ? WHERE id = ?',
      [file_name, file_type, title, description, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Upload not found' });
    }

    res.json({ message: 'Upload updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
