const prisma = require('../config/prisma');
const { createError } = require('../utils/responseHandler');
const { toNumber } = require('../utils/validator');

exports.getUserHeader = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { user_id: userId },
    select: {
      user_id: true,
      userName: true,
      coins: true,
      email: true,
      is_creator: true,
    },
  });

  if (!user) throw createError(404, '사용자를 찾을 수 없습니다.');
  return user;
};

exports.updateBodyMetrics = async (userId, payload) => {
  const data = {
    height: toNumber(payload.height, 'height'),
    weight: toNumber(payload.weight, 'weight'),
    shoulderWidth: toNumber(payload.shoulderWidth, 'shoulderWidth'),
    chestCircum: toNumber(payload.chestCircum, 'chestCircum'),
    waistCircum: toNumber(payload.waistCircum, 'waistCircum'),
    hipCircum: toNumber(payload.hipCircum, 'hipCircum'),
    armLength: toNumber(payload.armLength, 'armLength'),
    legLength: toNumber(payload.legLength, 'legLength'),
    neckCircum: toNumber(payload.neckCircum, 'neckCircum'),
    footSize: payload.footSize !== undefined ? Number(payload.footSize) : undefined,
    basePhotoUrl: payload.basePhotoUrl,
    pixelRatio: toNumber(payload.pixelRatio, 'pixelRatio'),
  };

  Object.keys(data).forEach((key) => data[key] === undefined && delete data[key]);

  const user = await prisma.user.update({
    where: { user_id: userId },
    data,
  });

  return {
    user_id: user.user_id,
    userName: user.userName,
    coins: user.coins,
    updatedAt: user.updatedAt,
  };
};
