const prisma = require('../config/prisma');
const { createError } = require('../utils/responseHandler');
const { requireFields } = require('../utils/validator');
const { buildHandle } = require('../utils/transformers');
const notificationService = require('./notificationService');

exports.createBrand = async (userId, payload) => {
  requireFields(payload, ['brand_name']);

  const existing = await prisma.brand.findUnique({ where: { owner_id: userId } });
  if (existing) {
    throw createError(400, '이미 브랜드를 보유하고 있습니다.');
  }

  return prisma.brand.create({
    data: {
      owner_id: userId,
      brand_name: payload.brand_name,
      brand_logo: payload.brand_logo || null,
      brand_story: payload.brand_story || null,
      is_public: payload.is_public ?? false,
    },
  });
};

exports.listPublicBrands = async () => {
  const brands = await prisma.brand.findMany({
    where: { is_public: true, deleted_at: null },
    include: {
      clothes: {
        include: { fund: true },
      },
    },
    orderBy: { brand_id: 'desc' },
  });

  return brands.map((brand) => {
    const funds = brand.clothes
      .map((cloth) => cloth.fund)
      .filter((fund) => fund && fund.status === 'FUNDING');

    const goalSum = funds.reduce((sum, fund) => sum + fund.goal_amount, 0);
    const currentSum = funds.reduce((sum, fund) => sum + fund.current_amount, 0);
    const participantSum = funds.reduce((sum, fund) => sum + fund.participantCount, 0);
    const progress = goalSum > 0 ? currentSum / goalSum : 0;

    return {
      brand_id: brand.brand_id,
      brand_name: brand.brand_name,
      brand_logo: brand.brand_logo,
      is_public: brand.is_public,
      progress,
      participantCount: participantSum,
      current_amount: currentSum,
    };
  });
};

exports.getBrandDetail = async (brandId) => {
  const brand = await prisma.brand.findUnique({
    where: { brand_id: brandId },
    include: {
      clothes: true,
    },
  });
  if (!brand || brand.deleted_at) throw createError(404, '브랜드를 찾을 수 없습니다.');
  return brand;
};

exports.listBrandProfiles = async () => {
  const brands = await prisma.brand.findMany({
    where: { deleted_at: null },
    include: { owner: true },
    orderBy: { brand_id: 'desc' },
  });

  return Promise.all(
    brands.map(async (brand) => {
      const followingCount = await prisma.follow.count({
        where: { follower_id: brand.owner_id },
      });

      return {
        id: brand.brand_id,
        brand: brand.brand_name,
        handle: buildHandle(brand.owner?.userName),
        followerCount: brand.totalFollowers,
        followingCount,
        bio: brand.brand_story || '',
        location: null,
      };
    })
  );
};

exports.getBrandProfile = async (brandId) => {
  const brand = await prisma.brand.findUnique({
    where: { brand_id: brandId },
    include: { owner: true },
  });
  if (!brand || brand.deleted_at) throw createError(404, '브랜드를 찾을 수 없습니다.');

  const followingCount = await prisma.follow.count({
    where: { follower_id: brand.owner_id },
  });

  return {
    id: brand.brand_id,
    brand: brand.brand_name,
    handle: buildHandle(brand.owner?.userName),
    followerCount: brand.totalFollowers,
    followingCount,
    bio: brand.brand_story || '',
    location: null,
  };
};

exports.toggleFollow = async (userId, brandId) => {
  const brand = await prisma.brand.findUnique({ where: { brand_id: brandId } });
  if (!brand) throw createError(404, '브랜드를 찾을 수 없습니다.');

  const existing = await prisma.follow.findFirst({
    where: { follower_id: userId, target_brand: brandId },
  });

  if (existing) {
    await prisma.follow.delete({ where: { follow_id: existing.follow_id } });
    await prisma.brand.update({
      where: { brand_id: brandId },
      data: { totalFollowers: { decrement: 1 } },
    });
    return { followed: false };
  }

  await prisma.follow.create({
    data: { follower_id: userId, target_brand: brandId },
  });
  await prisma.brand.update({
    where: { brand_id: brandId },
    data: { totalFollowers: { increment: 1 } },
  });

  if (brand.owner_id && brand.owner_id !== userId) {
    await notificationService.createNotification({
      userId: brand.owner_id,
      title: '새 팔로워',
      message: `${brand.brand_name}에 새로운 팔로워가 생겼습니다.`,
      type: 'GENERAL',
      url: `/brands/${brand.brand_id}`,
      data: { brand_id: brand.brand_id },
    });
  }

  return { followed: true };
};
