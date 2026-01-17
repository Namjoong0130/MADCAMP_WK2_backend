const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const clothRoutes = require('./routes/clothRoutes');

dotenv.config();

const app = express();

// --- 미들웨어 설정 ---
app.use(cors()); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 서빙 (브라우저에서 이미지 접근 가능하게 함)
app.use('/uploads', express.static('uploads'));

// --- 라우터 연결 ---
// 에러 발생 지점(19라인 근처)을 해결하기 위해 라우터 객체 자체를 연결합니다.
app.use('/api/auth', authRoutes);
app.use('/api/clothes', clothRoutes);

// --- 에러 핸들링 미들웨어 ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ 
    success: false, 
    message: err.message || '서버 내부 에러 발생' 
  });
});

module.exports = app; // server.js에서 사용하기 위해 내보냄