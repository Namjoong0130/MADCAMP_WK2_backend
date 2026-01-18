const prisma = require('../config/prisma');
const { createError } = require('../utils/responseHandler');

exports.listNotifications = async (userId) => {
  const notifications = await prisma.notification.findMany({
    where: { user_id: userId, deleted_at: null },
    orderBy: { created_at: 'desc' },
  });

  const fundingIds = Array.from(
    new Set(
      notifications
        .map((noti) => {
          const value = noti.data?.funding_id;
          if (typeof value === 'number') return value;
          if (typeof value === 'string' && value.trim() !== '') return Number(value);
          return null;
        })
        .filter((fundingId) => Number.isFinite(fundingId))
    )
  );

  const funds = fundingIds.length
    ? await prisma.fund.findMany({
        where: { funding_id: { in: fundingIds } },
        select: { funding_id: true, clothing_id: true },
      })
    : [];

  const fundMap = funds.reduce((map, fund) => {
    map[fund.funding_id] = fund;
    return map;
  }, {});

  return notifications.map((noti) => {
    const data = noti.data || {};
    const fund = data.funding_id ? fundMap[data.funding_id] : null;
    const clothingId = data.clothing_id || fund?.clothing_id || null;
    const target = clothingId
      ? {
          type: data.comment_id ? 'feedback' : 'detail',
          clothingId,
        }
      : null;

    return {
      id: noti.noti_id,
      title: noti.title,
      message: noti.message,
      target,
      is_read: noti.is_read,
      created_at: noti.created_at,
      type: noti.type,
      url: noti.url,
      data: noti.data,
    };
  });
};

exports.markAsRead = async (userId, notiId) => {
  const notification = await prisma.notification.findUnique({
    where: { noti_id: notiId },
  });
  if (!notification || notification.user_id !== userId) {
    throw createError(404, '알림을 찾을 수 없습니다.');
  }

  const updated = await prisma.notification.update({
    where: { noti_id: notiId },
    data: { is_read: true },
  });

  if (!notification.is_read) {
    await prisma.user.update({
      where: { user_id: userId },
      data: { unread_noti_count: { decrement: 1 } },
    });
  }

  return updated;
};

exports.createNotification = async ({ userId, title, message, type, url, data }) => {
  const notification = await prisma.notification.create({
    data: {
      user_id: userId,
      title,
      message,
      type,
      url: url || null,
      data: data || null,
    },
  });

  await prisma.user.update({
    where: { user_id: userId },
    data: { unread_noti_count: { increment: 1 } },
  });

  return notification;
};

exports.createNotificationsForUsers = async (userIds, payloadBuilder) => {
  const uniqueUserIds = Array.from(new Set(userIds)).filter(Boolean);
  const notifications = [];

  for (const userId of uniqueUserIds) {
    const payload = payloadBuilder(userId);
    if (!payload) continue;
    notifications.push(
      await exports.createNotification({
        userId,
        ...payload,
      })
    );
  }

  return notifications;
};
