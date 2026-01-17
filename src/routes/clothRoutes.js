const express = require('express');
const router = express.Router();
const clothController = require('../controllers/clothController');
const authMiddleware = require('../middlewares/authMiddleware');

// ✅ 중괄호를 사용하여 uploadMiddleware에서 정확한 객체를 꺼내옵니다.
const { uploadInput } = require('../middlewares/uploadMiddleware');

// POST /api/clothes/register
// 1. 로그인 확인(authMiddleware) 
// 2. 최대 5장의 사진 업로드(uploadInput.array)
// 3. 컨트롤러 실행
router.post(
  '/register', 
  authMiddleware, 
  uploadInput.array('images', 5), 
  clothController.registerDesign
);

module.exports = router;