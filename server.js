/* 
실제로 특정 포트(80번)에서 서버를 리스닝(대기)하게 만듭니다. 
*/

const app = require('./src/app');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PORT = process.env.PORT || 80;

async function main() {
  // DB 연결 확인
  try {
    await prisma.$connect();
    console.log('✅ 데이터베이스 연결 성공');
    
    app.listen(PORT, () => {
      console.log(`🚀 서버가 포트 ${PORT}에서 작동 중입니다.`);
    });
  } catch (error) {
    console.error('❌ 서버 시작 실패:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();