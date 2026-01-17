const prisma = require('../config/prisma');
const { createError } = require('../utils/responseHandler');
const { requireFields, toNumber } = require('../utils/validator');
const notificationService = require('./notificationService');

exports.listCloths = async (query) => {
  const filters = {
    is_public: true,
    deleted_at: null,
  };

  if (query.category) filters.category = query.category;
  if (query.gender) filters.gender = query.gender;
  if (query.style) filters.style = query.style;

  const cloths = await prisma.cloth.findMany({
    where: filters,
    select: {
      clothing_id: true,
      clothing_name: true,
      category: true,
      style: true,
      gender: true,
      price: true,
      thumbnail_url: true,
      size_specs: true,
      brand: {
        select: { brand_id: true, brand_name: true },
      },
    },
    orderBy: { created_at: 'desc' },
  });

  return cloths;
};

exports.getClothDetail = async (clothId) => {
  const cloth = await prisma.cloth.findUnique({
    where: { clothing_id: clothId },
    include: {
      brand: {
        select: {
          brand_id: true,
          brand_name: true,
          brand_logo: true,
        },
      },
      fund: true,
    },
  });

  if (!cloth || cloth.deleted_at) throw createError(404, '의류를 찾을 수 없습니다.');
  return cloth;
};

exports.createCloth = async (userId, payload) => {
  requireFields(payload, ['brand_id', 'clothing_name', 'category']);

  const brand = await prisma.brand.findUnique({
    where: { brand_id: Number(payload.brand_id) },
  });
  if (!brand || brand.owner_id !== userId) {
    throw createError(403, '브랜드 권한이 없습니다.');
  }
  if (brand.design_count >= 10) {
    throw createError(400, '브랜드 디자인은 최대 10개까지 등록할 수 있습니다.');
  }

  const cloth = await prisma.cloth.create({
    data: {
      brand_id: Number(payload.brand_id),
      clothing_name: payload.clothing_name,
      category: payload.category,
      description: payload.description || null,
      note: payload.note || null,
      material: payload.material || null,
      origin: payload.origin || null,
      sizes: payload.sizes || [],
      color: payload.color || null,
      gender: payload.gender || 'UNISEX',
      style: payload.style || null,
      price: toNumber(payload.price, 'price') || 0,
      stretch: toNumber(payload.stretch, 'stretch') || 5,
      weight: toNumber(payload.weight, 'weight') || 5,
      stiffness: toNumber(payload.stiffness, 'stiffness') || 5,
      thickness: toNumber(payload.thickness, 'thickness') || 5,
      layer_order: toNumber(payload.layer_order, 'layer_order') || 0,
      size_specs: payload.size_specs || {},
      thumbnail_url: payload.thumbnail_url || null,
      final_result_front_url: payload.final_result_front_url || null,
      final_result_back_url: payload.final_result_back_url || null,
      is_public: payload.is_public ?? false,
    },
  });

  await prisma.brand.update({
    where: { brand_id: brand.brand_id },
    data: { design_count: { increment: 1 } },
  });

  const followers = await prisma.follow.findMany({
    where: { target_brand: brand.brand_id },
    select: { follower_id: true },
  });
  const followerIds = followers.map((item) => item.follower_id);

  await notificationService.createNotificationsForUsers(followerIds, () => ({
    title: '신상 등록',
    message: `${brand.brand_name}에 새로운 의류가 등록되었습니다.`,
    type: 'GENERAL',
    url: `/cloths/${cloth.clothing_id}`,
    data: { clothing_id: cloth.clothing_id, brand_id: brand.brand_id },
  }));

  return cloth;
};

exports.updateClothPhysics = async (userId, clothId, payload) => {
  const cloth = await prisma.cloth.findUnique({
    where: { clothing_id: clothId },
    include: { brand: true },
  });
  if (!cloth) throw createError(404, '의류를 찾을 수 없습니다.');
  if (cloth.brand.owner_id !== userId) {
    throw createError(403, '수정 권한이 없습니다.');
  }

  const data = {
    stretch: toNumber(payload.stretch, 'stretch'),
    weight: toNumber(payload.weight, 'weight'),
    stiffness: toNumber(payload.stiffness, 'stiffness'),
    thickness: toNumber(payload.thickness, 'thickness'),
    layer_order: toNumber(payload.layer_order, 'layer_order'),
    size_specs: payload.size_specs,
  };

  Object.keys(data).forEach((key) => data[key] === undefined && delete data[key]);

  return prisma.cloth.update({
    where: { clothing_id: clothId },
    data,
  });
};

exports.createDesignAttempt = async (userId, clothId, payload) => {
  requireFields(payload, ['design_prompt', 'ai_result_url']);

  const cloth = await prisma.cloth.findUnique({
    where: { clothing_id: clothId },
    include: { brand: true },
  });
  if (!cloth) throw createError(404, '의류를 찾을 수 없습니다.');
  if (cloth.brand.owner_id !== userId) {
    throw createError(403, '디자인 시도 권한이 없습니다.');
  }

  return prisma.designAttempt.create({
    data: {
      clothing_id: clothId,
      input_images: payload.input_images || [],
      design_prompt: payload.design_prompt,
      ai_result_url: payload.ai_result_url,
    },
  });
};

exports.listDesignAttempts = async (clothId) => {
  return prisma.designAttempt.findMany({
    where: { clothing_id: clothId },
    orderBy: { created_at: 'desc' },
  });
};

exports.listDesignHistory = async (userId) => {
  const brand = await prisma.brand.findUnique({ where: { owner_id: userId } });
  if (!brand) return [];

  const attempts = await prisma.designAttempt.findMany({
    where: {
      cloth: {
        brand_id: brand.brand_id,
      },
    },
    include: {
      cloth: {
        select: { clothing_name: true },
      },
    },
    orderBy: { created_at: 'desc' },
  });

  return attempts.map((attempt) => ({
    attempt_id: attempt.attempt_id,
    design_title: attempt.cloth.clothing_name,
    result_url: attempt.ai_result_url,
    created_at: attempt.created_at,
  }));
};
