const sanitizeHtml = require('sanitize-html');

const cleanValue = (value) => {
  if (typeof value === 'string') {
    return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });
  }
  if (Array.isArray(value)) return value.map(cleanValue);
  if (value && typeof value === 'object') {
    const cleaned = {};
    for (const key of Object.keys(value)) {
      cleaned[key] = cleanValue(value[key]);
    }
    return cleaned;
  }
  return value;
};

const xssSanitize = (req, res, next) => {
  if (req.body) req.body = cleanValue(req.body);
  if (req.query) req.query = cleanValue(req.query);
  if (req.params) req.params = cleanValue(req.params);
  next();
};

module.exports = { xssSanitize };
