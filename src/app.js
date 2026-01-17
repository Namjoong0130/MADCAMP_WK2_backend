const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const clothRoutes = require('./routes/clothRoutes');
// 여기에 다른 라우터들을 추가로 가져올 예정입니다.

dotenv.config();

const app = express();

// --- 미들웨어 설정 ---
app.use(cors()); // 다른 도메인(프론트엔드)에서의 요청 허용
app.use(express.json()); // JSON 형식의 데이터 해석
app.use(express.urlencoded({ extended: true })); // URL 인코딩된 데이터 해석
app.use('/uploads', express.static('uploads'));

// --- 라우터 연결 ---
// 모든 의류 관련 API는 /api/clothes 경로로 시작합니다.
app.use('/api/clothes', clothRoutes);

// --- 에러 핸들링 미들웨어 ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: '서버 내부 에러가 발생했습니다.',
    error: err.message 
  });
});

module.exports = app;