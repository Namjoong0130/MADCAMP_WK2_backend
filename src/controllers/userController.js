const userService = require('../services/userService');
const { success } = require('../utils/responseHandler');

exports.getMe = async (req, res, next) => {
  try {
    const user = await userService.getUserHeader(req.user.userId);
    return success(res, user);
  } catch (error) {
    next(error);
  }
};

exports.updateBodyMetrics = async (req, res, next) => {
  try {
    const updated = await userService.updateBodyMetrics(req.user.userId, req.body);
    return success(res, updated, '신체 정보가 업데이트되었습니다.');
  } catch (error) {
    next(error);
  }
};
