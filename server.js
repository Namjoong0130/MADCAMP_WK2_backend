// server.js
require('dotenv').config();
const app = require('./src/app'); // src/app.js를 불러옵니다.

const PORT = process.env.PORT || 80;

app.listen(PORT, () => {
  console.log(`🚀 MODIF 서버가 포트 ${PORT}에서 작동 중입니다.`);
});