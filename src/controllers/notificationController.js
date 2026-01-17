const notificationService = require('../services/notificationService');
const { success } = require('../utils/responseHandler');

exports.listNotifications = async (req, res, next) => {
  try {
    const notifications = await notificationService.listNotifications(req.user.userId);
    return success(res, notifications);
  } catch (error) {
    next(error);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const updated = await notificationService.markAsRead(
      req.user.userId,
      Number(req.params.notiId)
    );
    return success(res, updated, '알림이 읽음 처리되었습니다.');
  } catch (error) {
    next(error);
  }
};
