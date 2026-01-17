const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// 저장 폴더를 동적으로 생성하는 헬퍼 함수
const getStorage = (subDir) => multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join('uploads', 'clothes', subDir);
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // 중복 방지를 위해 UUID 사용
    cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
  }
});

// 입력/출력 분리 설정
const uploadInput = multer({ 
  storage: getStorage('inputs'),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB 제한
});

const uploadResult = multer({ 
  storage: getStorage('results'),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// ✅ 여러 개를 내보낼 때는 반드시 객체 형태로 묶어서 내보내야 합니다.
module.exports = { 
  uploadInput, 
  uploadResult 
};