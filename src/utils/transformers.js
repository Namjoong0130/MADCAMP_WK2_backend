const { normalizeUrl } = require('./imageHandler');

const CATEGORY_MAP = {
  knit: 'TOP',
  jacket: 'OUTER',
  coat: 'OUTER',
  outerwear: 'OUTER',
  dress: 'TOP',
  top: 'TOP',
  bottom: 'BOTTOM',
  shoes: 'SHOES',
  hat: 'HAT',
  acc: 'ACC',
  accessories: 'ACC',
};

const CATEGORY_LABELS = {
  TOP: 'Top',
  BOTTOM: 'Bottom',
  OUTER: 'Outerwear',
  SHOES: 'Shoes',
  HAT: 'Hat',
  ACC: 'Acc',
};

const GENDER_MAP = {
  mens: 'MALE',
  male: 'MALE',
  womens: 'FEMALE',
  female: 'FEMALE',
  unisex: 'UNISEX',
};

const GENDER_LABELS = {
  MALE: 'Mens',
  FEMALE: 'Womens',
  UNISEX: 'Unisex',
};

const toDbCategory = (value) => {
  if (!value) return undefined;
  const raw = String(value).trim();
  const upper = raw.toUpperCase();
  if (CATEGORY_LABELS[upper]) return upper;
  return CATEGORY_MAP[raw.toLowerCase()];
};

const toDbGender = (value) => {
  if (!value) return undefined;
  const raw = String(value).trim();
  const upper = raw.toUpperCase();
  if (GENDER_LABELS[upper]) return upper;
  return GENDER_MAP[raw.toLowerCase()];
};

const fromDbCategory = (value) => CATEGORY_LABELS[value] || value;
const fromDbGender = (value) => GENDER_LABELS[value] || value;

const ensureArray = (value, fallback = []) => {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return fallback;
};

const parseJson = (value, fallback = null) => {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const buildHandle = (name) => {
  if (!name) return null;
  const compact = String(name).replace(/\s+/g, '');
  return `@${compact.toLowerCase()}`;
};

const toFrontendCloth = (cloth) => ({
  id: cloth.clothing_id,
  name: cloth.clothing_name,
  category: fromDbCategory(cloth.category),
  gender: fromDbGender(cloth.gender),
  style: cloth.style,
  price: cloth.price,
  design_img_url: normalizeUrl(cloth.final_result_front_url || cloth.thumbnail_url),
  size_specs: cloth.size_specs || {},
  brand_id: cloth.brand_id,
  brand_name: cloth.brand?.brand_name,
  created_at: cloth.created_at,
  is_public: cloth.is_public,
});

const toFrontendFunding = (fund, options = {}) => ({
  id: fund.funding_id,
  funding_id: fund.funding_id,
  clothing_id: fund.clothing_id,
  brand: fund.cloth?.brand?.brand_name,
  designer_handle: options.designerHandle || null,
  participant_count: fund.participantCount,
  likes: options.likes ?? 0,
  liked: options.liked ?? false,
  status: fund.status,
  goal_amount: fund.goal_amount,
  current_amount: fund.current_amount,
  created_at: fund.created_at,
  title: fund.title,
  deadline: fund.deadline,
});

const toFrontendComment = (comment, clothingId) => ({
  id: comment.comment_id,
  clothing_id: clothingId,
  user: comment.user?.userName || 'unknown',
  rating: comment.rating ?? null,
  text: comment.content,
  created_at: comment.created_at,
  parent_id: comment.parent_id,
  is_creator: comment.is_brand_owner,
});

const toFrontendInvestment = (invest, cloth, brand) => ({
  id: invest.invest_id,
  brand: brand?.brand_name || null,
  itemName: cloth?.clothing_name || null,
  image: normalizeUrl(cloth?.thumbnail_url || cloth?.final_result_front_url),
  amount: invest.amount,
  status: invest.is_cancelled ? 'CANCELLED' : invest.fund?.status,
  eta: invest.fund?.delivery_date || null,
});

const toFrontendFittingHistory = (fitting) => {
  const latestResult = fitting.results?.[0];
  return {
    id: fitting.fitting_id,
    title: fitting.note || `Fitting #${fitting.fitting_id}`,
    image: normalizeUrl(latestResult?.result_img_url || fitting.base_photo_url),
    date: fitting.created_at,
  };
};

module.exports = {
  toDbCategory,
  toDbGender,
  fromDbCategory,
  fromDbGender,
  ensureArray,
  parseJson,
  buildHandle,
  toFrontendCloth,
  toFrontendFunding,
  toFrontendComment,
  toFrontendInvestment,
  toFrontendFittingHistory,
};
