const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const date = new Date();
    const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    const targetDir = path.join(uploadDir, yearMonth);
    
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    cb(null, targetDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

// 文件过滤
const fileFilter = (req, file, cb) => {
  // 只允许图片文件
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传图片文件（JPEG, PNG, GIF, WEBP）'), false);
  }
};

// 配置上传
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB 限制
  }
});

/**
 * 上传单张图片
 * POST /api/upload
 */
router.post('/', authenticateToken, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '没有上传文件' });
    }

    // 构建文件访问 URL
    const relativePath = req.file.path.replace(uploadDir, '');
    const fileUrl = `/uploads${relativePath}`;

    res.json({
      message: '上传成功',
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size
    });
  } catch (error) {
    console.error('上传失败:', error);
    res.status(500).json({ message: '上传失败', error: error.message });
  }
});

/**
 * 上传多张图片
 * POST /api/upload/multiple
 */
router.post('/multiple', authenticateToken, upload.array('files', 6), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: '没有上传文件' });
    }

    const urls = req.files.map(file => {
      const relativePath = file.path.replace(uploadDir, '');
      return `/uploads${relativePath}`;
    });

    res.json({
      message: '上传成功',
      urls: urls,
      count: req.files.length
    });
  } catch (error) {
    console.error('上传失败:', error);
    res.status(500).json({ message: '上传失败', error: error.message });
  }
});

/**
 * 上传用户头像
 * POST /api/upload/avatar
 */
router.post('/avatar', authenticateToken, upload.single('avatar'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '没有上传文件' });
    }

    const relativePath = req.file.path.replace(uploadDir, '');
    const fileUrl = `/uploads${relativePath}`;

    res.json({
      message: '头像上传成功',
      url: fileUrl
    });
  } catch (error) {
    console.error('头像上传失败:', error);
    res.status(500).json({ message: '上传失败', error: error.message });
  }
});

module.exports = router;
