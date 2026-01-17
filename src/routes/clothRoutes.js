const express = require('express');
const router = express.Router();
const clothController = require('../controllers/clothController');
const { uploadInput } = require('../middlewares/uploadMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');

// 로그인한 사용자만 옷 등록 가능 (미들웨어 순서 중요)
router.post('/register', authMiddleware, uploadInput.array('images', 5), clothController.registerDesign);

module.exports = router; // ✅ 반드시 라우터 자체를 내보내야 함