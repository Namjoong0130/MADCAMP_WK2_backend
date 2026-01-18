const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const optionalAuthMiddleware = require('../middlewares/optionalAuthMiddleware');
const fundController = require('../controllers/fundController');

router.get('/feed', optionalAuthMiddleware, fundController.listFundingFeed);
router.post('/reminders', authMiddleware, fundController.processFundingReminders);
router.post('/failures', authMiddleware, fundController.processFundingFailures);
router.get('/owner', authMiddleware, fundController.listOwnerFunds);
router.get('/investments/me', authMiddleware, fundController.listUserInvestments);
router.delete('/investments/:investId', authMiddleware, fundController.cancelInvestment);
router.get('/:fundId', optionalAuthMiddleware, fundController.getFundDetail);
router.get('/:fundId/comments', fundController.listComments);
router.post('/', authMiddleware, fundController.createFund);
router.post('/:fundId/invest', authMiddleware, fundController.createInvestment);
router.post('/:fundId/comments', authMiddleware, fundController.createComment);
router.post('/:fundId/like', authMiddleware, fundController.toggleFundingLike);
router.patch('/:fundId/production-note', authMiddleware, fundController.updateProductionNote);
router.patch('/:fundId/status', authMiddleware, fundController.updateFundingStatus);

module.exports = router;
