const express = require('express');
const router = express.Router();
const multer = require('multer');
const db = require('../Configs/db.config'); 
const fs = require('fs');                   
const path = require('path'); 
const uploadController = require('../Controllers/uploadController');
// const verifyToken = require('../middlewares/isAuthenticated');


// Set up Multer for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Admin upload (protected)
router.post('/',
  //  verifyToken, 
  upload.single('file'), uploadController.uploadFile);

// Get uploaded files (optional: public or protected)
router.get('/', uploadController.getUploads);

// Replace/Update file by ID
router.put('/replace/:id', upload.single('file'), async (req, res) => {
  const uploadId = req.params.id;

  try {
    // Get old file details from DB
    const [rows] = await db.execute('SELECT * FROM uploads WHERE id = ?', [uploadId]);
    const oldFile = rows[0];
    if (!oldFile) return res.status(404).json({ message: 'Upload not found' });

    // Delete old file from disk
    const oldFilePath = path.join(__dirname, '../', oldFile.file_path);
    fs.unlink(oldFilePath, (err) => {
      if (err) console.warn('⚠️ Old file not found, skipping delete.');
    });

    // New file from multer
    const { filename, mimetype, path: newFilePath } = req.file;

    // Update DB record
    await db.execute(
      'UPDATE uploads SET file_name = ?, file_path = ?, file_type = ? WHERE id = ?',
      [filename, newFilePath, mimetype.startsWith('image') ? 'image' : 'video', uploadId]
    );

    res.json({ message: 'File replaced successfully', file: filename });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// Delete uploaded file (protected)
router.delete('/:id',  async (req, res) => {
  const uploadId = req.params.id;

  try {
    // Get file details from DB
    const [rows] = await db.execute('SELECT * FROM uploads WHERE id = ?', [uploadId]);
    const file = rows[0];

    if (!file) {
      return res.status(404).json({ message: 'File not found in database' });
    }

    const filePath = path.join(__dirname, '../', file.file_path);

    // Delete file from filesystem
    fs.unlink(filePath, async (err) => {
      if (err) {
        return res.status(500).json({ message: 'File deletion failed from folder', error: err.message });
      }

      // Delete DB record
      await db.execute('DELETE FROM uploads WHERE id = ?', [uploadId]);

      res.json({ message: 'File deleted from server and database' });
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
