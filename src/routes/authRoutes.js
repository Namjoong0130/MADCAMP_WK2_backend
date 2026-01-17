const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// 구글 로그인 엔드포인트
router.post('/google', authController.googleLogin);

module.exports = router; // ✅ 반드시 라우터 자체를 내보내야 함