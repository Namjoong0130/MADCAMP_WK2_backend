const prisma = require('../config/prisma');

exports.createCloth = async (brandId, clothData, attemptData, inputFiles, resultFileName) => {
  // 1. 입력 이미지 URL 리스트 생성 (inputs 폴더)
  const inputUrls = inputFiles.map(file => 
    `${process.env.SERVER_URL}/uploads/clothes/inputs/${file.filename}`
  );

  // 2. 출력 이미지 URL 생성 (results 폴더 - 단 하나)
  const resultUrl = `${process.env.SERVER_URL}/uploads/clothes/results/${resultFileName}`;

  return await prisma.$transaction(async (tx) => {
    // 옷 기본 정보 저장
    const cloth = await tx.cloth.create({
      data: {
        ...clothData,
        brand_id: brandId,
        final_result_front_url: resultUrl // 이 시도의 결과물을 대표 전면 사진으로 등록
      }
    });

    // AI 디자인 시도 이력 저장 (1:1 대응)
    await tx.designAttempt.create({
      data: {
        clothing_id: cloth.clothing_id,
        input_images: inputUrls,          // 입력은 여러 장일 수 있음
        design_prompt: attemptData.design_prompt,
        ai_result_url: resultUrl          // 결과는 무조건 하나 (String)
      }
    });

    // 브랜드 디자인 카운트 증가
    await tx.brand.update({
      where: { brand_id: brandId },
      data: { design_count: { increment: 1 } }
    });

    return cloth;
  });
};