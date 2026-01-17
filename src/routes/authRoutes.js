/*
외부에서 들어오는 주소를 컨트롤러와 연결합니다.
*/
const express = require('express');
// Node.js는 아주 기본적인 기능만 가지고 있습니다. 
// 복잡한 서버를 편하게 만들기 위해 전 세계 개발자들이 미리 만들어둔 
// **'Express'라는 프레임워크(도구 상자)**를 불러오는 과정입니다.

const router = express.Router();
// express 안에는 많은 기능이 있는데, 
// 그중 주소를 나누고 관리하는 **Router**라는 전용 도구를 선택해 router라는 이름의 변수에 담았습니다. 
// 이제 이 변수를 사용해 /login, /signup 같은 상세 주소들을 만들 수 있습니다.

const authController = require('../controllers/authController');
//authRoutes.js는 길 안내만 할 뿐, 실제 로그인이 맞는지 확인하는 복잡한 일은 하지 않습니다. 
// 그 복잡한 일을 담당하는 파일이 바로 **authController.js**입니다. 
// ../를 통해 상위 폴더의 controllers 폴더 안에 있는 파일을 불러와 
// authController라는 이름으로 연결한 것입니다.

router.post('/signup', authController.signup);
router.post('/login', authController.login);

module.exports = router;