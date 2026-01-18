const prisma = require('../config/prisma');
const { createError } = require('../utils/responseHandler');
const { requireFields, toNumber } = require('../utils/validator');
const {
  buildHandle,
  toFrontendCloth,
  toFrontendFunding,
  toFrontendComment,
  toFrontendInvestment,
} = require('../utils/transformers');
const notificationService = require('./notificationService');

exports.listFundingFeed = async (userId) => {
  const funds = await prisma.fund.findMany({
    where: { status: 'FUNDING', deleted_at: null },
    include: {
      cloth: {
        select: {
          clothing_id: true,
          clothing_name: true,
          thumbnail_url: true,
          final_result_front_url: true,
          category: true,
          style: true,
          gender: true,
          price: true,
          size_specs: true,
          likedUserIds: true,
          likeCount: true,
          is_public: true,
          brand: {
            select: { brand_id: true, brand_name: true, owner: true },
          },
        },
      },
    },
    orderBy: { created_at: 'desc' },
  });

  return funds.map((fund) => {
    const likedUserIds = fund.cloth?.likedUserIds || [];
    const liked = userId ? likedUserIds.includes(userId) : false;
    const likes = fund.cloth?.likeCount || 0;
    const designerHandle = buildHandle(fund.cloth?.brand?.owner?.userName);

    return {
      ...toFrontendFunding(fund, {
        liked,
        likes,
        designerHandle,
      }),
      participantCount: fund.participantCount,
      progress: fund.goal_amount > 0 ? fund.current_amount / fund.goal_amount : 0,
      deadline: fund.deadline,
      cloth: fund.cloth ? toFrontendCloth(fund.cloth) : null,
    };
  });
};

exports.getFundDetail = async (fundId, userId) => {
  const fund = await prisma.fund.findUnique({
    where: { funding_id: fundId },
    include: {
      cloth: {
        include: { brand: { include: { owner: true } } },
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
  const likedUserIds = fund.cloth?.likedUserIds || [];
  const liked = userId ? likedUserIds.includes(userId) : false;
  const likes = fund.cloth?.likeCount || 0;
  const designerHandle = buildHandle(fund.cloth?.brand?.owner?.userName);

  return {
    ...fund,
    frontend: {
      ...toFrontendFunding(fund, { liked, likes, designerHandle }),
      cloth: fund.cloth ? toFrontendCloth(fund.cloth) : null,
      comments: fund.comments?.map((comment) =>
        toFrontendComment(comment, fund.clothing_id)
      ),
    },
  };
};

exports.createFund = async (userId, payload) => {
  requireFields(payload, ['clothing_id', 'title', 'goal_amount', 'deadline']);

  const cloth = await prisma.cloth.findUnique({
    where: { clothing_id: Number(payload.clothing_id) },
    include: { brand: true, fund: true },
  });
  if (!cloth) throw createError(404, '의류를 찾을 수 없습니다.');
  if (cloth.brand.owner_id !== userId) {
    throw createError(403, '펀딩 생성 권한이 없습니다.');
  }
  if (cloth.fund) {
    throw createError(400, '이미 해당 의류에 대한 펀딩이 존재합니다.');
  }

  const deadline = new Date(payload.deadline);
  if (Number.isNaN(deadline.getTime())) {
    throw createError(400, '마감일 형식이 올바르지 않습니다.');
  }
  if (deadline <= new Date()) {
    throw createError(400, '마감일은 미래 날짜여야 합니다.');
  }

  return prisma.fund.create({
    data: {
      clothing_id: cloth.clothing_id,
      user_id: userId,
      title: payload.title,
      description: payload.description || null,
      goal_amount: toNumber(payload.goal_amount, 'goal_amount'),
      deadline,
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
    if (fund.status !== 'FUNDING') {
      throw createError(400, '펀딩이 진행 중인 상태가 아닙니다.');
    }
    if (fund.deadline && fund.deadline < new Date()) {
      throw createError(400, '펀딩 마감일이 지났습니다.');
    }

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
    include: {
      user: { select: { user_id: true, userName: true, profile_img_url: true } },
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

  return toFrontendComment(comment, fund.cloth?.clothing_id);
};

exports.listComments = async (fundId) => {
  const fund = await prisma.fund.findUnique({
    where: { funding_id: fundId },
    select: { clothing_id: true },
  });
  if (!fund) throw createError(404, '펀딩을 찾을 수 없습니다.');

  const comments = await prisma.comment.findMany({
    where: { funding_id: fundId, deleted_at: null },
    include: {
      user: { select: { user_id: true, userName: true, profile_img_url: true } },
      replies: true,
    },
    orderBy: { created_at: 'desc' },
  });

  return comments.map((comment) => toFrontendComment(comment, fund.clothing_id));
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

exports.toggleFundingLike = async (userId, fundId) => {
  return prisma.$transaction(async (tx) => {
    const fund = await tx.fund.findUnique({
      where: { funding_id: fundId },
      include: { cloth: true },
    });
    if (!fund || fund.deleted_at) throw createError(404, '펀딩을 찾을 수 없습니다.');

    const likedUserIds = fund.cloth?.likedUserIds || [];
    const hasLiked = likedUserIds.includes(userId);
    const nextLikedUserIds = hasLiked
      ? likedUserIds.filter((id) => id !== userId)
      : [...likedUserIds, userId];

    const nextLikeCount = Math.max(
      0,
      (fund.cloth?.likeCount || 0) + (hasLiked ? -1 : 1)
    );

    const updated = await tx.cloth.update({
      where: { clothing_id: fund.cloth.clothing_id },
      data: {
        likedUserIds: { set: nextLikedUserIds },
        likeCount: nextLikeCount,
      },
    });

    return { liked: !hasLiked, likes: updated.likeCount };
  });
};

exports.listOwnerFunds = async (userId) => {
  const brand = await prisma.brand.findUnique({ where: { owner_id: userId } });
  if (!brand) return [];

  const funds = await prisma.fund.findMany({
    where: { cloth: { brand_id: brand.brand_id }, deleted_at: null },
    include: {
      cloth: true,
    },
    orderBy: { created_at: 'desc' },
  });

  return funds.map((fund) => ({
    id: fund.funding_id,
    brand: brand.brand_name,
    participantCount: fund.participantCount,
    currentCoin: fund.current_amount,
    production_note: fund.production_note || '',
    progress: fund.goal_amount > 0 ? fund.current_amount / fund.goal_amount : 0,
  }));
};

exports.listUserInvestments = async (userId) => {
  const investments = await prisma.invest.findMany({
    where: { user_id: userId, is_cancelled: false },
    include: {
      fund: {
        include: {
          cloth: {
            include: { brand: true },
          },
        },
      },
    },
    orderBy: { created_at: 'desc' },
  });

  return investments.map((invest) =>
    toFrontendInvestment(invest, invest.fund?.cloth, invest.fund?.cloth?.brand)
  );
};

exports.cancelInvestment = async (userId, investId) => {
  return prisma.$transaction(async (tx) => {
    const invest = await tx.invest.findUnique({
      where: { invest_id: investId },
      include: { fund: true },
    });
    if (!invest || invest.user_id !== userId) {
      throw createError(404, '투자 내역을 찾을 수 없습니다.');
    }
    if (invest.is_cancelled) {
      throw createError(400, '이미 취소된 투자입니다.');
    }

    await tx.invest.update({
      where: { invest_id: investId },
      data: { is_cancelled: true },
    });

    await tx.user.update({
      where: { user_id: userId },
      data: { coins: { increment: invest.amount } },
    });

    if (invest.fund) {
      const nextAmount = Math.max(0, invest.fund.current_amount - invest.amount);
      const nextParticipants = Math.max(0, invest.fund.participantCount - 1);
      await tx.fund.update({
        where: { funding_id: invest.funding_id },
        data: {
          current_amount: nextAmount,
          participantCount: nextParticipants,
          status: 'FUNDING',
        },
      });
    }

    return { cancelled: true };
  });
};
