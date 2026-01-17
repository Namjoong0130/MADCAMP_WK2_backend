const prisma = require('../config/prisma');
const jwt = require('jsonwebtoken');

// 회원가입 (스키마의 모든 수치 데이터 반영)
exports.register = async (userData) => {
  const { email, password, userName, height, weight } = userData;

  // 1. 중복 확인
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new Error('이미 사용 중인 이메일입니다.');

  // 2. 사용자 생성 (기본값 설정 포함)
  return await prisma.user.create({
    data: {
      email,
      password, // 요청대로 평문 저장
      userName,
      height: parseFloat(height),
      weight: parseFloat(weight),
      coins: 1000,    // 가입 축하금
      tokens: 5,      // 초기 디자인 토큰 예시
      styleTags: [],  // 빈 배열 초기화
    }
  });
};

// 로그인
exports.login = async (email, password) => {
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user || user.password !== password) {
    throw new Error('이메일 또는 비밀번호가 잘못되었습니다.');
  }

  // JWT 발급 (기존 authMiddleware와 100% 호환)
  const token = jwt.sign(
    { userId: user.user_id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { user, token };
};