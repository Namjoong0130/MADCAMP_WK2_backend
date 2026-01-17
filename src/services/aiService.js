const { createError } = require('../utils/responseHandler');

exports.generateDesignImage = async () => {
  throw createError(501, 'AI 디자인 생성은 현재 구현되지 않았습니다.');
};

exports.generateFittingResult = async () => {
  throw createError(501, 'AI 피팅 생성은 현재 구현되지 않았습니다.');
};
