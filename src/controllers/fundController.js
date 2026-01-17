const fundService = require('../services/fundService');
const { created, success } = require('../utils/responseHandler');

exports.listFundingFeed = async (req, res, next) => {
  try {
    const feed = await fundService.listFundingFeed();
    return success(res, feed);
  } catch (error) {
    next(error);
  }
};

exports.getFundDetail = async (req, res, next) => {
  try {
    const fund = await fundService.getFundDetail(Number(req.params.fundId));
    return success(res, fund);
  } catch (error) {
    next(error);
  }
};

exports.createFund = async (req, res, next) => {
  try {
    const fund = await fundService.createFund(req.user.userId, req.body);
    return created(res, fund, '펀딩이 생성되었습니다.');
  } catch (error) {
    next(error);
  }
};

exports.createInvestment = async (req, res, next) => {
  try {
    const invest = await fundService.createInvestment(
      req.user.userId,
      Number(req.params.fundId),
      req.body
    );
    return created(res, invest, '투자가 완료되었습니다.');
  } catch (error) {
    next(error);
  }
};

exports.createComment = async (req, res, next) => {
  try {
    const comment = await fundService.createComment(
      req.user.userId,
      Number(req.params.fundId),
      req.body
    );
    return created(res, comment, '댓글이 등록되었습니다.');
  } catch (error) {
    next(error);
  }
};

exports.listComments = async (req, res, next) => {
  try {
    const comments = await fundService.listComments(Number(req.params.fundId));
    return success(res, comments);
  } catch (error) {
    next(error);
  }
};

exports.updateProductionNote = async (req, res, next) => {
  try {
    const updated = await fundService.updateProductionNote(
      req.user.userId,
      Number(req.params.fundId),
      req.body
    );
    return success(res, updated, '제작 노트가 업데이트되었습니다.');
  } catch (error) {
    next(error);
  }
};

exports.updateFundingStatus = async (req, res, next) => {
  try {
    const updated = await fundService.updateFundingStatus(
      req.user.userId,
      Number(req.params.fundId),
      req.body
    );
    return success(res, updated, '펀딩 상태가 업데이트되었습니다.');
  } catch (error) {
    next(error);
  }
};

exports.processFundingReminders = async (req, res, next) => {
  try {
    const result = await fundService.processFundingReminders();
    return success(res, result, '펀딩 리마인드 알림이 발송되었습니다.');
  } catch (error) {
    next(error);
  }
};

exports.processFundingFailures = async (req, res, next) => {
  try {
    const result = await fundService.processFundingFailures();
    return success(res, result, '펀딩 실패 처리가 완료되었습니다.');
  } catch (error) {
    next(error);
  }
};
