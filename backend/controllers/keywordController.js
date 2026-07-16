const Keyword = require('../models/Keyword');
const APIFeatures = require('../utils/apiFeatures');
const { asyncHandler } = require('../utils/helpers');
const { logActivity } = require('../middlewares/activityLogger');

exports.getKeywords = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.params.campaignId) filter.campaign = req.params.campaignId;
  if (req.query.isNegative !== undefined) filter.isNegative = req.query.isNegative === 'true';

  const features = new APIFeatures(Keyword.find(filter), req.query)
    .search(['keyword'])
    .sort()
    .paginate();

  const keywords = await features.query.populate('campaign', 'campaignName');
  const total = await Keyword.countDocuments(filter);

  res.json({
    success: true,
    data: keywords,
    pagination: { ...features.pagination, total, pages: Math.ceil(total / (features.pagination?.limit || 10)) }
  });
});

exports.createKeyword = asyncHandler(async (req, res) => {
  req.body.createdBy = req.user._id;
  if (req.params.campaignId) req.body.campaign = req.params.campaignId;
  const keyword = await Keyword.create(req.body);
  await logActivity(req.user._id, 'keyword_created', 'keyword', keyword._id, `Keyword "${keyword.keyword}" added`, req.ip);
  res.status(201).json({ success: true, data: keyword });
});

exports.createBulkKeywords = asyncHandler(async (req, res) => {
  const { keywords } = req.body;
  const keywordDocs = keywords.map(k => ({
    ...k,
    campaign: req.params.campaignId,
    createdBy: req.user._id
  }));
  const created = await Keyword.insertMany(keywordDocs);
  await logActivity(req.user._id, 'keywords_bulk_created', 'keyword', null, `${created.length} keywords added`, req.ip);
  res.status(201).json({ success: true, data: created });
});

exports.updateKeyword = asyncHandler(async (req, res) => {
  const keyword = await Keyword.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!keyword) return res.status(404).json({ success: false, message: 'Keyword not found' });
  res.json({ success: true, data: keyword });
});

exports.deleteKeyword = asyncHandler(async (req, res) => {
  const keyword = await Keyword.findByIdAndDelete(req.params.id);
  if (!keyword) return res.status(404).json({ success: false, message: 'Keyword not found' });
  res.json({ success: true, message: 'Keyword deleted successfully' });
});
