const brandService = require('../services/brandService');
const { created, success } = require('../utils/responseHandler');

exports.createBrand = async (req, res, next) => {
  try {
    const brand = await brandService.createBrand(req.user.userId, req.body);
    return created(res, brand, '브랜드가 생성되었습니다.');
  } catch (error) {
    next(error);
  }
};

exports.listPublicBrands = async (req, res, next) => {
  try {
    const brands = await brandService.listPublicBrands();
    return success(res, brands);
  } catch (error) {
    next(error);
  }
};

exports.getBrandDetail = async (req, res, next) => {
  try {
    const brand = await brandService.getBrandDetail(Number(req.params.brandId));
    return success(res, brand);
  } catch (error) {
    next(error);
  }
};

exports.toggleFollow = async (req, res, next) => {
  try {
    const result = await brandService.toggleFollow(req.user.userId, Number(req.params.brandId));
    return success(res, result);
  } catch (error) {
    next(error);
  }
};

exports.listBrandProfiles = async (req, res, next) => {
  try {
    const profiles = await brandService.listBrandProfiles();
    return success(res, profiles);
  } catch (error) {
    next(error);
  }
};

exports.getBrandProfile = async (req, res, next) => {
  try {
    const profile = await brandService.getBrandProfile(Number(req.params.brandId));
    return success(res, profile);
  } catch (error) {
    next(error);
  }
};
