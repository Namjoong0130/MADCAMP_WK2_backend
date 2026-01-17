/*
DB에 접근하여 사용자를 생성하고 비밀번호를 확인합니다.
*/

const prisma = require('../config/prisma');
// 우리가 정한 DB 설계도(Schema)를 바탕으로 실제 데이터베이스와 대화하는 도구입니다.
const bcrypt = require('bcrypt');
// 비밀번호를 그대로 저장하지 않고, 아무도 알아볼 수 없는 암호로 바꿔주는 보안 도구입니다.
const jwt = require('jsonwebtoken');
// 사용자가 로그인했다는 증표인 '디지털 신분증'을 발급해주는 도구입니다.

exports.register = async (email, password, userName, height, weight) => {
  // 1. 이미 가입된 이메일인지 확인
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new Error('이미 존재하는 이메일입니다.');

  // 2. 비밀번호 암호화 (보안 필수)
  const hashedPassword = await bcrypt.hash(password, 10);

  // 3. 사용자 생성 (스키마의 필수값들을 채워줍니다)
  return await prisma.user.create({
    data: {
      email: email,
      password: hashedPassword,
      userName: userName,
      height: parseFloat(height), // 문자열로 올 수 있으므로 숫자로 변환
      weight: parseFloat(weight),
      
      // 스키마에 @default가 있다면 아래는 생략 가능하지만, 
      // 초기 가입 이벤트를 하고 싶다면 명시적으로 적어줄 수 있습니다.
      coins: 100000,   // 가입 축하금 1000코인 지급!
      tokens: 10,     // 무료 디자인 시도권 5회 지급!
      
      // 리스트(Array) 타입은 빈 배열로 초기화해주는 것이 안전합니다.
      styleTags: [], 
    }
});
};
// 스키마에서 타입 뒤에 ?가 없고 @default 설정도 없는 필드들은 반드시 입력
// email: 유저 식별을 위한 필수 정보입니다.
// userName: 앱 내에서 부를 이름입니다.
// height, weight: 스키마에 Float로 정의되어 있고 ?가 없으므로 가입 시 꼭 받아야 합니다.

exports.login = async (email, password) => {
  // 1. 사용자 존재 확인
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('이메일 또는 비밀번호가 일치하지 않습니다.');

  // 2. 비밀번호 일치 확인
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error('이메일 또는 비밀번호가 일치하지 않습니다.');

  // 3. JWT 토큰 생성 (사용자 식별용)
  const token = jwt.sign(
    { userId: user.user_id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' } // 7일간 유지
  );

  return { user, token };
};