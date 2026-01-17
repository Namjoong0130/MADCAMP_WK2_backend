const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const fundController = require('../controllers/fundController');

router.get('/feed', fundController.listFundingFeed);
router.post('/reminders', authMiddleware, fundController.processFundingReminders);
router.post('/failures', authMiddleware, fundController.processFundingFailures);
router.get('/:fundId', fundController.getFundDetail);
router.get('/:fundId/comments', fundController.listComments);
router.post('/', authMiddleware, fundController.createFund);
router.post('/:fundId/invest', authMiddleware, fundController.createInvestment);
router.post('/:fundId/comments', authMiddleware, fundController.createComment);
router.patch('/:fundId/production-note', authMiddleware, fundController.updateProductionNote);
router.patch('/:fundId/status', authMiddleware, fundController.updateFundingStatus);

module.exports = router;
