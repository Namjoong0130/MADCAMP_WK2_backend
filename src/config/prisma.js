const { PrismaClient } = require('@prisma/client');

// 서버 전체에서 하나의 Prisma 인스턴스만 사용하도록 설정 (싱글톤)
const prisma = new PrismaClient();

module.exports = prisma;