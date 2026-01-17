const { OAuth2Client } = require('google-auth-library');
const prisma = require('../config/prisma');
const jwt = require('jsonwebtoken');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.verifyGoogleToken = async (idToken) => {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload(); // 구글 사용자 정보(email, name, sub 등) 반환
};

exports.loginOrSignup = async (googleUser) => {
  const { sub: google_id, email, name } = googleUser;

  // 1. 기존 사용자인지 확인
  let user = await prisma.user.findUnique({ where: { email } });

  // 2. 신규 사용자라면 생성 (회원가입)
  if (!user) {
    user = await prisma.user.create({
      data: {
        google_id,
        email,
        userName: name,
        // 스키마 필수값 대응 (가입 후 설문으로 유도 권장)
        height: 0, 
        weight: 0,
        coins: 1000, // 가입 축하금 예시
      }
    });
  }

  // 3. 애플리케이션 전용 JWT 발급
  const token = jwt.sign(
    { userId: user.user_id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' } // 7일간 유지
  );

  return { user, token };
};