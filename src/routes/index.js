/*
(통합 관리)
*/

const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');

// /api/auth 로 들어오는 모든 요청은 authRoutes에서 처리
router.use('/auth', authRoutes);

module.exports = router;