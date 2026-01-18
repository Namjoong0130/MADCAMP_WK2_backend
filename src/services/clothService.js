const prisma = require('../config/prisma');

exports.createCloth = async (userId, clothData, attemptData, inputFiles, resultFileName) => {
  // 1. 브랜드 및 유저 상태 확인
  const user = await prisma.user.findUnique({
    where: { user_id: userId },
    include: { brand: true }
  });

  if (!user.brand) throw new Error('브랜드가 존재하지 않습니다.');
  if (!user.is_creator) throw new Error('크리에이터 권한이 없습니다.'); //
  if (user.tokens <= 0) throw new Error('보유한 디자인 토큰이 부족합니다.'); //
  if (user.brand.design_count >= 10) throw new Error('브랜드당 최대 10개까지만 디자인 가능합니다.'); //

  // 2. 이미지 URL 생성
  const inputUrls = inputFiles.map(file => 
    `${process.env.SERVER_URL}/uploads/clothes/inputs/${file.filename}`
  );
  const resultUrl = `${process.env.SERVER_URL}/uploads/clothes/results/${resultFileName}`;

  // 3. 트랜잭션 처리 (하나라도 실패하면 모두 취소)
  return await prisma.$transaction(async (tx) => {
    // A. 옷 정보 생성
    const cloth = await tx.cloth.create({
      data: {
        ...clothData,
        brand_id: user.brand.brand_id,
        final_result_front_url: resultUrl
      }
    });

    // B. AI 디자인 시도 이력 저장
    await tx.designAttempt.create({
      data: {
        clothing_id: cloth.clothing_id,
        input_images: inputUrls,
        design_prompt: attemptData.design_prompt,
        ai_result_url: resultUrl
      }
    });

    // C. 사용자 토큰 차감
    await tx.user.update({
      where: { user_id: userId },
      data: { tokens: { decrement: 1 } }
    });

    // D. 브랜드 디자인 카운트 증가
    await tx.brand.update({
      where: { brand_id: user.brand.brand_id },
      data: { design_count: { increment: 1 } }
    });

    return cloth;
  });
};