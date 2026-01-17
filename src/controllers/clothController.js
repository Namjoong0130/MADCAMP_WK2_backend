// 예시용 clothController.js
exports.registerDesign = async (req, res, next) => {
  try {
    // req.files에 업로드된 파일 정보가 들어옵니다.
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: '이미지 파일이 없습니다.' });
    }

    res.status(201).json({
      success: true,
      message: '디자인이 임시 등록되었습니다.',
      files: req.files.map(f => f.filename)
    });
  } catch (error) {
    next(error);
  }
};