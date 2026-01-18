const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const userController = require('../controllers/userController');

router.get('/me', authMiddleware, userController.getMe);
router.patch('/me/body', authMiddleware, userController.updateBodyMetrics);
router.get('/me/profile', authMiddleware, userController.getProfile);
router.patch('/me/profile', authMiddleware, userController.updateProfile);

module.exports = router;
