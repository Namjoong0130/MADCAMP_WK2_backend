const clothService = require('../services/clothService');

exports.registerDesign = async (req, res, next) => {
  try {
    const { brand_id, clothing_name, design_prompt, ...physicalData } = req.body;
    const inputFiles = req.files; // multer.array('images')로 받은 입력 파일들

    // [로직] 여기서 AI API를 호출하고 결과물을 'results' 폴더에 저장했다고 가정합니다.
    // 임시로 첫 번째 입력 파일의 이름을 결과 파일명으로 시뮬레이션합니다.
    const tempResultFileName = `ai_output_${inputFiles[0].filename}`;

    const clothData = {
      clothing_name,
      ...physicalData,
      category: req.body.category || 'TOP'
    };

    const attemptData = { design_prompt };

    const result = await clothService.createCloth(
      Number(brand_id), 
      clothData, 
      attemptData, 
      inputFiles, 
      tempResultFileName
    );

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};