const authService = require('../services/authService');

exports.googleLogin = async (req, res, next) => {
  try {
    const { idToken } = req.body; // 프론트엔드에서 보낸 구글 ID 토큰

    // 1. 구글 토큰 검증
    const googleUser = await authService.verifyGoogleToken(idToken);

    // 2. 로그인 또는 회원가입 처리
    const { user, token } = await authService.loginOrSignup(googleUser);

    res.status(200).json({
      success: true,
      data: { user, token }
    });
  } catch (error) {
    res.status(401).json({ success: false, message: '유효하지 않은 구글 토큰입니다.' });
  }
};