const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const fittingController = require('../controllers/fittingController');

router.get('/', authMiddleware, fittingController.listFittings);
router.get('/:fittingId', authMiddleware, fittingController.getFittingDetail);
router.post('/', authMiddleware, fittingController.createFitting);
router.post('/:fittingId/results', authMiddleware, fittingController.createFittingResult);

module.exports = router;
