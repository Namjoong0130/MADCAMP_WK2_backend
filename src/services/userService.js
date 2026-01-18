const prisma = require('../config/prisma');
const { createError } = require('../utils/responseHandler');
const { toNumber } = require('../utils/validator');
const { buildHandle } = require('../utils/transformers');

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

exports.getUserProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { user_id: userId },
    include: { brand: true, follows: true },
  });

  if (!user) throw createError(404, '사용자를 찾을 수 없습니다.');

  return {
    name: user.userName,
    handle: buildHandle(user.userName),
    followerCount: user.brand?.totalFollowers || 0,
    followingCount: user.follows?.length || 0,
    base_photo_url: user.basePhotoUrl || user.profile_img_url || null,
    measurements: {
      height: user.height,
      weight: user.weight,
      neckCircum: user.neckCircum,
      shoulderWidth: user.shoulderWidth,
      chestCircum: user.chestCircum,
      waistCircum: user.waistCircum,
      hipCircum: user.hipCircum,
      armLength: user.armLength,
      legLength: user.legLength,
      wristCircum: null,
      shoeSize: user.footSize,
    },
    bodyTypeLabel: user.bodyTypeLabel,
    styleTags: user.styleTags,
    updatedAt: user.updatedAt,
    coins: user.coins,
    tokens: user.tokens,
  };
};

exports.updateUserProfile = async (userId, payload) => {
  const data = {
    userName: payload.name,
    profile_img_url: payload.profile_img_url,
    styleTags: Array.isArray(payload.styleTags) ? payload.styleTags : undefined,
    bodyTypeLabel: payload.bodyTypeLabel,
    basePhotoUrl: payload.base_photo_url,
    shippingAddress: payload.shippingAddress,
  };

  Object.keys(data).forEach((key) => data[key] === undefined && delete data[key]);

  const user = await prisma.user.update({
    where: { user_id: userId },
    data,
  });

  return {
    user_id: user.user_id,
    userName: user.userName,
    profile_img_url: user.profile_img_url,
    styleTags: user.styleTags,
    bodyTypeLabel: user.bodyTypeLabel,
    basePhotoUrl: user.basePhotoUrl,
    updatedAt: user.updatedAt,
  };
};
