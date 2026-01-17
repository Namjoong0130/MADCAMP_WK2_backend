const prisma = require('../config/prisma');
const { createError } = require('../utils/responseHandler');
const { requireFields, toNumber } = require('../utils/validator');
const notificationService = require('./notificationService');

exports.listFundingFeed = async () => {
  const funds = await prisma.fund.findMany({
    where: { status: 'FUNDING', deleted_at: null },
    include: {
      cloth: {
        select: {
          clothing_id: true,
          clothing_name: true,
          thumbnail_url: true,
          category: true,
          style: true,
          gender: true,
          price: true,
          size_specs: true,
          brand: {
            select: { brand_id: true, brand_name: true },
          },
        },
      },
    },
    orderBy: { created_at: 'desc' },
  });

  return funds.map((fund) => ({
    funding_id: fund.funding_id,
    title: fund.title,
    goal_amount: fund.goal_amount,
    current_amount: fund.current_amount,
    participantCount: fund.participantCount,
    progress: fund.goal_amount > 0 ? fund.current_amount / fund.goal_amount : 0,
    deadline: fund.deadline,
    cloth: fund.cloth,
  }));
};

exports.getFundDetail = async (fundId) => {
  const fund = await prisma.fund.findUnique({
    where: { funding_id: fundId },
    include: {
      cloth: {
        include: { brand: true },
      },
      comments: {
        where: { deleted_at: null },
        include: {
          user: { select: { user_id: true, userName: true, profile_img_url: true } },
          replies: true,
        },
        orderBy: { created_at: 'desc' },
      },
    },
  });

  if (!fund || fund.deleted_at) throw createError(404, '펀딩을 찾을 수 없습니다.');
  return fund;
};

exports.createFund = async (userId, payload) => {
  requireFields(payload, ['clothing_id', 'title', 'goal_amount', 'deadline']);

  const cloth = await prisma.cloth.findUnique({
    where: { clothing_id: Number(payload.clothing_id) },
    include: { brand: true },
  });
  if (!cloth) throw createError(404, '의류를 찾을 수 없습니다.');
  if (cloth.brand.owner_id !== userId) {
    throw createError(403, '펀딩 생성 권한이 없습니다.');
  }

  return prisma.fund.create({
    data: {
      clothing_id: cloth.clothing_id,
      user_id: userId,
      title: payload.title,
      description: payload.description || null,
      goal_amount: toNumber(payload.goal_amount, 'goal_amount'),
      deadline: new Date(payload.deadline),
      delivery_date: payload.delivery_date ? new Date(payload.delivery_date) : null,
    },
  });
};

exports.createInvestment = async (userId, fundId, payload) => {
  requireFields(payload, ['amount']);
  const amount = toNumber(payload.amount, 'amount');
  if (amount <= 0) throw createError(400, '투자 금액은 0보다 커야 합니다.');

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { user_id: userId } });
    if (!user) throw createError(404, '사용자를 찾을 수 없습니다.');
    if (user.coins < amount) throw createError(400, '코인이 부족합니다.');

    const fund = await tx.fund.findUnique({
      where: { funding_id: fundId },
      include: {
        cloth: {
          include: { brand: true },
        },
      },
    });
    if (!fund) throw createError(404, '펀딩을 찾을 수 없습니다.');

    const invest = await tx.invest.create({
      data: {
        user_id: userId,
        funding_id: fundId,
        amount,
        prev_coins: user.coins,
        post_coins: user.coins - amount,
      },
    });

    await tx.user.update({
      where: { user_id: userId },
      data: { coins: { decrement: amount } },
    });

    await tx.fund.update({
      where: { funding_id: fundId },
      data: {
        current_amount: { increment: amount },
        participantCount: { increment: 1 },
        status:
          fund.status === 'FUNDING' && fund.current_amount + amount >= fund.goal_amount
            ? 'SUCCESS'
            : fund.status,
      },
    });

    return {
      invest,
      fund,
      reachedGoal:
        fund.status === 'FUNDING' && fund.current_amount + amount >= fund.goal_amount,
    };
  });

  const { invest, fund, reachedGoal } = result;
  const brandOwnerId = fund.cloth?.brand?.owner_id;
  if (brandOwnerId && brandOwnerId !== userId) {
    await notificationService.createNotification({
      userId: brandOwnerId,
      title: '새 투자',
      message: `${fund.title}에 새로운 투자가 등록되었습니다.`,
      type: 'GENERAL',
      url: `/funds/${fund.funding_id}`,
      data: { funding_id: fund.funding_id, amount: invest.amount },
    });
  }

  if (reachedGoal) {
    const investors = await prisma.invest.findMany({
      where: { funding_id: fund.funding_id },
      select: { user_id: true },
    });
    const recipientIds = investors.map((item) => item.user_id);
    if (brandOwnerId) recipientIds.push(brandOwnerId);

    await notificationService.createNotificationsForUsers(recipientIds, () => ({
      title: '펀딩 성공',
      message: `${fund.title} 펀딩이 목표를 달성했습니다.`,
      type: 'FUNDING_SUCCESS',
      url: `/funds/${fund.funding_id}`,
      data: { funding_id: fund.funding_id },
    }));
  }

  return invest;
};

exports.createComment = async (userId, fundId, payload) => {
  requireFields(payload, ['content']);

  const fund = await prisma.fund.findUnique({
    where: { funding_id: fundId },
    include: {
      cloth: {
        include: { brand: true },
      },
    },
  });
  if (!fund) throw createError(404, '펀딩을 찾을 수 없습니다.');

  const isBrandOwner = fund.user_id === userId;

  const comment = await prisma.comment.create({
    data: {
      funding_id: fundId,
      user_id: userId,
      content: payload.content,
      parent_id: payload.parent_id || null,
      rating: payload.rating || null,
      is_brand_owner: isBrandOwner,
    },
  });

  const recipients = new Set();
  if (fund.user_id) recipients.add(fund.user_id);
  if (fund.cloth?.brand?.owner_id) recipients.add(fund.cloth.brand.owner_id);

  if (payload.parent_id) {
    const parent = await prisma.comment.findUnique({
      where: { comment_id: Number(payload.parent_id) },
    });
    if (parent?.user_id) recipients.add(parent.user_id);
  }

  recipients.delete(userId);

  await notificationService.createNotificationsForUsers(Array.from(recipients), () => ({
    title: '새 댓글',
    message: `${fund.title}에 새 댓글이 등록되었습니다.`,
    type: 'NEW_COMMENT',
    url: `/funds/${fund.funding_id}`,
    data: { funding_id: fund.funding_id, comment_id: comment.comment_id },
  }));

  return comment;
};

exports.listComments = async (fundId) => {
  const comments = await prisma.comment.findMany({
    where: { funding_id: fundId, deleted_at: null },
    include: {
      user: { select: { user_id: true, userName: true, profile_img_url: true } },
      replies: true,
    },
    orderBy: { created_at: 'desc' },
  });

  return comments;
};

exports.updateProductionNote = async (userId, fundId, payload) => {
  requireFields(payload, ['production_note']);

  const fund = await prisma.fund.findUnique({
    where: { funding_id: fundId },
    include: {
      cloth: {
        include: { brand: true },
      },
    },
  });
  if (!fund) throw createError(404, '펀딩을 찾을 수 없습니다.');
  if (fund.user_id !== userId) throw createError(403, '수정 권한이 없습니다.');

  const updated = await prisma.fund.update({
    where: { funding_id: fundId },
    data: { production_note: payload.production_note },
  });

  const investors = await prisma.invest.findMany({
    where: { funding_id: fundId },
    select: { user_id: true },
  });
  const recipientIds = investors.map((item) => item.user_id);

  await notificationService.createNotificationsForUsers(recipientIds, () => ({
    title: '제작 업데이트',
    message: `${fund.title} 제작 공정이 업데이트되었습니다.`,
    type: 'PRODUCTION_UPDATE',
    url: `/funds/${fund.funding_id}`,
    data: { funding_id: fund.funding_id },
  }));

  return updated;
};

exports.updateFundingStatus = async (userId, fundId, payload) => {
  requireFields(payload, ['status']);

  const fund = await prisma.fund.findUnique({
    where: { funding_id: fundId },
  });
  if (!fund) throw createError(404, '펀딩을 찾을 수 없습니다.');
  if (fund.user_id !== userId) throw createError(403, '수정 권한이 없습니다.');

  const updated = await prisma.fund.update({
    where: { funding_id: fundId },
    data: { status: payload.status },
  });

  if (payload.status === 'MAKING' || payload.status === 'DELIVERY') {
    const investors = await prisma.invest.findMany({
      where: { funding_id: fundId },
      select: { user_id: true },
    });
    const recipientIds = investors.map((item) => item.user_id);
    const message =
      payload.status === 'MAKING'
        ? `${fund.title} 제작이 시작되었습니다.`
        : `${fund.title} 배송이 시작되었습니다.`;

    await notificationService.createNotificationsForUsers(recipientIds, () => ({
      title: '제작/배송 업데이트',
      message,
      type: 'PRODUCTION_UPDATE',
      url: `/funds/${fund.funding_id}`,
      data: { funding_id: fund.funding_id, status: payload.status },
    }));
  }

  return updated;
};

exports.processFundingReminders = async () => {
  const now = new Date();
  const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const funds = await prisma.fund.findMany({
    where: {
      status: 'FUNDING',
      deleted_at: null,
      deadline: { gte: now, lte: next24h },
    },
    include: {
      cloth: { select: { likedUserIds: true } },
    },
  });

  const results = [];
  for (const fund of funds) {
    const investors = await prisma.invest.findMany({
      where: { funding_id: fund.funding_id },
      select: { user_id: true },
    });
    const recipientIds = [
      ...investors.map((item) => item.user_id),
      ...(fund.cloth?.likedUserIds || []),
    ];

    await notificationService.createNotificationsForUsers(recipientIds, () => ({
      title: '펀딩 마감 임박',
      message: `${fund.title} 펀딩이 24시간 이내 마감됩니다.`,
      type: 'GENERAL',
      url: `/funds/${fund.funding_id}`,
      data: { funding_id: fund.funding_id },
    }));

    results.push(fund.funding_id);
  }

  return { notified_funding_ids: results };
};

exports.processFundingFailures = async () => {
  const now = new Date();
  const funds = await prisma.fund.findMany({
    where: {
      status: 'FUNDING',
      deleted_at: null,
      deadline: { lt: now },
    },
    include: {
      cloth: { include: { brand: true } },
    },
  });

  const results = [];
  for (const fund of funds) {
    if (fund.current_amount >= fund.goal_amount) continue;

    await prisma.fund.update({
      where: { funding_id: fund.funding_id },
      data: { status: 'FAIL' },
    });

    const investors = await prisma.invest.findMany({
      where: { funding_id: fund.funding_id },
      select: { user_id: true },
    });
    const recipientIds = investors.map((item) => item.user_id);
    if (fund.cloth?.brand?.owner_id) recipientIds.push(fund.cloth.brand.owner_id);

    await notificationService.createNotificationsForUsers(recipientIds, () => ({
      title: '펀딩 실패',
      message: `${fund.title} 펀딩이 기간 만료로 실패했습니다.`,
      type: 'GENERAL',
      url: `/funds/${fund.funding_id}`,
      data: { funding_id: fund.funding_id },
    }));

    results.push(fund.funding_id);
  }

  return { failed_funding_ids: results };
};
