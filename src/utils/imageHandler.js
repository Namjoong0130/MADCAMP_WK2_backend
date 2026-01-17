const normalizeUrl = (url) => {
  if (!url) return null;
  return url.trim();
};

const buildPublicUrl = (baseUrl, key) => {
  if (!baseUrl || !key) return null;
  return `${baseUrl.replace(/\/$/, '')}/${key}`;
};

module.exports = {
  normalizeUrl,
  buildPublicUrl,
};
