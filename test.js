const { PrismaClient } = require('@prisma/client');
const http = require('http');

const prisma = new PrismaClient();

const app = http.createServer(async (request, response) => {
  // 1. 사용자가 접속한 URL 경로 확인
  const url = request.url;

  if (url === '/fittings') {
    // 2. DB에서 fitting 기록들을 가져옵니다.
    try {
      const allFittings = await prisma.fitting.findMany();
      
      // 응답 헤더 설정 (JSON 형태임을 알려줌)
      response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      // DB 데이터를 문자열로 변환하여 응답
      response.end(JSON.stringify(allFittings));
    } catch (error) {
      console.error(error);
      response.writeHead(500);
      response.end('DB Error');
    }

  } else {
    // 3. 그 외의 주소(루트 페이지 등)로 접속했을 때
    response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Hello! /fittings 주소로 접속하면 DB 데이터를 볼 수 있습니다.');
  }
});

// 4. 서버 실행 (포트 80)
// 리눅스 환경에서 80포트는 sudo 권한이 필요할 수 있습니다.
app.listen(80, () => {
  console.log('Server is running on http://localhost:80');
});