const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const brandController = require('../controllers/brandController');

router.get('/public', brandController.listPublicBrands);
router.get('/profiles', brandController.listBrandProfiles);
router.get('/:brandId/profile', brandController.getBrandProfile);
router.get('/:brandId', brandController.getBrandDetail);
router.post('/', authMiddleware, brandController.createBrand);
router.post('/:brandId/follow', authMiddleware, brandController.toggleFollow);

module.exports = router;
