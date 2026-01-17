require('dotenv').config();
const app = require('./src/app');

// root 권한이 필요한 80번 포트 설정
const PORT = process.env.PORT || 80;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  🚀 MODIF API Server가 가동되었습니다.
  📍 포트: ${PORT}
  🔗 주소: http://172.10.5.178.nip.io
  `);
});