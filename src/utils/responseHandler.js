const success = (res, data, message = 'OK', status = 200) => {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
};

const created = (res, data, message = 'Created') => {
  return success(res, data, message, 201);
};

const error = (res, message = 'Error', status = 500) => {
  return res.status(status).json({
    success: false,
    message,
  });
};

const createError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

module.exports = {
  success,
  created,
  error,
  createError,
};
