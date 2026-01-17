const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const userController = require('../controllers/userController');

router.get('/me', authMiddleware, userController.getMe);
router.patch('/me/body', authMiddleware, userController.updateBodyMetrics);

module.exports = router;
