const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const clothController = require('../controllers/clothController');

router.get('/', clothController.listCloths);
router.get('/design/history', authMiddleware, clothController.listDesignHistory);
router.get('/:clothId', clothController.getClothDetail);
router.post('/', authMiddleware, clothController.createCloth);
router.patch('/:clothId/physics', authMiddleware, clothController.updateClothPhysics);
router.get('/:clothId/attempts', authMiddleware, clothController.listDesignAttempts);
router.post('/:clothId/attempts', authMiddleware, clothController.createDesignAttempt);

module.exports = router;
