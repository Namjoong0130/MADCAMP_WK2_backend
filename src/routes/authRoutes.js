const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/google
router.post('/google', authController.googleLogin);

module.exports = router;