const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // 1. 헤더에서 토큰 추출 (보통 'Authorization: Bearer 토큰값' 형태로 옵니다)
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // 2. 토큰이 없는 경우
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: '접근 권한이 없습니다. 로그인이 필요합니다.' 
    });
  }

  try {
    // 3. 토큰 검증 (비밀키로 암호를 풀고 유저 정보를 꺼냄)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 4. 요청 객체(req)에 유저 정보를 담아 다음 단계로 넘김
    // 이렇게 담아두면 다음 컨트롤러에서 req.user.userId로 누가 보낸 요청인지 알 수 있습니다.
    req.user = decoded;
    
    next(); // 다음 단계(컨트롤러)로 진행
  } catch (error) {
    // 5. 토큰이 가짜이거나 만료된 경우
    return res.status(403).json({ 
      success: false, 
      message: '유효하지 않은 토큰입니다.' 
    });
  }
};