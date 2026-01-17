const fittingService = require('../services/fittingService');
const { created, success } = require('../utils/responseHandler');

exports.createFitting = async (req, res, next) => {
  try {
    const fitting = await fittingService.createFitting(req.user.userId, req.body);
    return created(res, fitting, '피팅이 생성되었습니다.');
  } catch (error) {
    next(error);
  }
};

exports.listFittings = async (req, res, next) => {
  try {
    const fittings = await fittingService.listFittings(req.user.userId);
    return success(res, fittings);
  } catch (error) {
    next(error);
  }
};

exports.getFittingDetail = async (req, res, next) => {
  try {
    const fitting = await fittingService.getFittingDetail(
      req.user.userId,
      Number(req.params.fittingId)
    );
    return success(res, fitting);
  } catch (error) {
    next(error);
  }
};

exports.createFittingResult = async (req, res, next) => {
  try {
    const result = await fittingService.createFittingResult(
      req.user.userId,
      Number(req.params.fittingId),
      req.body
    );
    return created(res, result, '피팅 결과가 저장되었습니다.');
  } catch (error) {
    next(error);
  }
};
