/* 
모든 미들웨어(보안, 데이터 해석 등)와 라우터를 통합하는 역할을 합니다.
*/

const express = require('express'); //express = 도구 
const cors = require('cors'); //프런트엔드 통신
const dotenv = require('dotenv'); //.env 접근
const routes = require('./routes'); // index.js를 자동으로 찾음 (./routes -> 그 안의 index.js)
const { errorMiddleware } = require('./middlewares/errorMiddleware');

dotenv.config(); //.env 접근

const app = express();

// --- 미들웨어 설정 ---
app.use(cors()); // 프론트엔드와의 통신 허용 (SOP, Same-Origin Policy 문제 우회)
app.use(express.json()); // JSON 형태의 요청 본문 해석
app.use(express.urlencoded({ extended: true })); //주소창 데이터 번역

// --- 라우터 연결 ---
app.use('/api', routes); //주소창에 /api로 시작하는 모든 요청은 routes/index.js 설계도에 따라 처리해라

// --- 에러 처리 미들웨어 (가장 마지막에 위치) ---
app.use(errorMiddleware); //앞선 단계들(로그인, 옷 등록 등)에서 에러가 발생하면, 이 미들웨어가 그 에러를 잡아내서 사용자에게 "로그인에 실패했습니다" 같은 깔끔한 응답을 보내줍니다.

module.exports = app; //app 설계도를 외부로 내보냅니다. 아까 작성하신 server.js에서 require('./src/app')를 통해 이 설계도를 가져가서 서버를 실제로 가동