const prisma = require('../config/prisma');
const { createError } = require('../utils/responseHandler');

exports.listNotifications = async (userId) => {
  return prisma.notification.findMany({
    where: { user_id: userId, deleted_at: null },
    orderBy: { created_at: 'desc' },
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
