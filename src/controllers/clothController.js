const clothService = require('../services/clothService');
const { created, success } = require('../utils/responseHandler');

exports.listCloths = async (req, res, next) => {
  try {
    const cloths = await clothService.listCloths(req.query);
    return success(res, cloths);
  } catch (error) {
    next(error);
  }
};

exports.getClothDetail = async (req, res, next) => {
  try {
    const cloth = await clothService.getClothDetail(Number(req.params.clothId));
    return success(res, cloth);
  } catch (error) {
    next(error);
  }
};

exports.createCloth = async (req, res, next) => {
  try {
    const cloth = await clothService.createCloth(req.user.userId, req.body);
    return created(res, cloth, '의류가 등록되었습니다.');
  } catch (error) {
    next(error);
  }
};

exports.updateClothPhysics = async (req, res, next) => {
  try {
    const cloth = await clothService.updateClothPhysics(
      req.user.userId,
      Number(req.params.clothId),
      req.body
    );
    return success(res, cloth, '물성 값이 업데이트되었습니다.');
  } catch (error) {
    next(error);
  }
};

exports.createDesignAttempt = async (req, res, next) => {
  try {
    const attempt = await clothService.createDesignAttempt(
      req.user.userId,
      Number(req.params.clothId),
      req.body
    );
    return created(res, attempt, '디자인 시도가 저장되었습니다.');
  } catch (error) {
    next(error);
  }
};

exports.listDesignAttempts = async (req, res, next) => {
  try {
    const attempts = await clothService.listDesignAttempts(Number(req.params.clothId));
    return success(res, attempts);
  } catch (error) {
    next(error);
  }
};

exports.listDesignHistory = async (req, res, next) => {
  try {
    const history = await clothService.listDesignHistory(req.user.userId);
    return success(res, history);
  } catch (error) {
    next(error);
  }
};
