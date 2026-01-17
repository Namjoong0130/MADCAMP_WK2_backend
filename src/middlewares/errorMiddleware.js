/*
서버가 죽지 않게 하고 일관된 에러 응답을 프론트에 줍니다.
*/

exports.errorMiddleware = (err, req, res, next) => {
  console.error(err.stack);
  
  const status = err.status || 500;
  const message = err.message || '서버 내부 오류가 발생했습니다.';
  
  res.status(status).json({
    success: false,
    message: message
  });
};