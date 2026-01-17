const prisma = require('../config/prisma');
const { createError } = require('../utils/responseHandler');
const { requireFields } = require('../utils/validator');
const notificationService = require('./notificationService');

exports.createFitting = async (userId, payload) => {
  requireFields(payload, ['base_photo_url']);

  return prisma.fitting.create({
    data: {
      user_id: userId,
      base_photo_url: payload.base_photo_url,
      internal_cloth_ids: payload.internal_cloth_ids || [],
      external_cloth_urls: payload.external_cloth_urls || [],
      note: payload.note || null,
      tags: payload.tags || [],
      status: payload.status || 'PENDING',
      is_shared: payload.is_shared ?? false,
    },
  });
};

exports.listFittings = async (userId) => {
  return prisma.fitting.findMany({
    where: { user_id: userId, deleted_at: null },
    include: { results: true },
    orderBy: { created_at: 'desc' },
  });
};

exports.getFittingDetail = async (userId, fittingId) => {
  const fitting = await prisma.fitting.findUnique({
    where: { fitting_id: fittingId },
    include: { results: true },
  });
  if (!fitting || fitting.user_id !== userId) {
    throw createError(404, '피팅을 찾을 수 없습니다.');
  }
  return fitting;
};

exports.createFittingResult = async (userId, fittingId, payload) => {
  requireFields(payload, ['result_img_url', 'generation_prompt']);

  const fitting = await prisma.fitting.findUnique({
    where: { fitting_id: fittingId },
  });
  if (!fitting || fitting.user_id !== userId) {
    throw createError(404, '피팅을 찾을 수 없습니다.');
  }

  const result = await prisma.fittingResult.create({
    data: {
      fitting_id: fittingId,
      user_id: userId,
      result_img_url: payload.result_img_url,
      generation_prompt: payload.generation_prompt,
      fit_score: payload.fit_score || null,
      error_msg: payload.error_msg || null,
    },
  });

  if (payload.status) {
    await prisma.fitting.update({
      where: { fitting_id: fittingId },
      data: { status: payload.status },
    });

    if (payload.status === 'COMPLETED' || payload.status === 'FAILED') {
      const message =
        payload.status === 'COMPLETED'
          ? 'AI 피팅 결과가 생성되었습니다.'
          : 'AI 피팅에 실패했습니다. 토큰 반환 안내를 확인해주세요.';

      await notificationService.createNotification({
        userId,
        title: 'AI 피팅 결과',
        message,
        type: 'GENERAL',
        url: `/fittings/${fittingId}`,
        data: { fitting_id: fittingId, status: payload.status },
      });
    }
  }

  return result;
};
