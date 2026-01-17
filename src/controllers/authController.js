/*
(요청/응답 처리)
*/

const authService = require('../services/authService');

exports.signup = async (req, res, next) => {
  try {
    // 1. 주문표 확인: 프론트엔드에서 보낸 상자(body)를 엽니다.
    const { email, password, userName, height, weight } = req.body;
    // 2. 주방에 전달: 요리사(Service)에게 이 재료들로 가입시켜달라고 시킵니다.
    const user = await authService.register(email, password, userName, height, weight);
    
    res.status(201).json({
      success: true,
      message: '회원가입이 완료되었습니다.',
      data: { userId: user.user_id, userName: user.userName }
    });
  } catch (error) {
    next(error); // errorMiddleware로 보냄
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await authService.login(email, password);
    
    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          user_id: user.user_id,
          userName: user.userName,
          coins: user.coins
        }
      }
    });
  } catch (error) {
    next(error);
  }
};