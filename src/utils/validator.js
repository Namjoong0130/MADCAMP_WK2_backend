const { createError } = require('./responseHandler');

const requireFields = (body, fields) => {
  const missing = fields.filter((field) => body[field] === undefined || body[field] === null);
  if (missing.length > 0) {
    throw createError(400, `필수 값이 누락되었습니다: ${missing.join(', ')}`);
  }
};

const toNumber = (value, fieldName) => {
  if (value === undefined || value === null) return undefined;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw createError(400, `숫자 형식이 올바르지 않습니다: ${fieldName}`);
  }
  return parsed;
};

module.exports = {
  requireFields,
  toNumber,
};
