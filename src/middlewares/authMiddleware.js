const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // 1. 헤더에서 토큰 추출 (Authorization: Bearer <token>)
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: '인증 토큰이 없습니다. 로그인이 필요합니다.' 
    });
  }

  // 2. 토큰 검증
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: '유효하지 않거나 만료된 토큰입니다.' 
      });
    }

    // 3. 검증된 사용자 정보를 req에 담아서 다음 단계(Controller)로 넘김
    req.user = user;
    next();
  });
};