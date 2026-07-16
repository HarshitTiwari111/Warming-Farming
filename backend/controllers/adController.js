const Ad = require('../models/Ad');
const APIFeatures = require('../utils/apiFeatures');
const { asyncHandler } = require('../utils/helpers');
const { logActivity } = require('../middlewares/activityLogger');

exports.getAds = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.params.campaignId) filter.campaign = req.params.campaignId;

  const features = new APIFeatures(Ad.find(filter), req.query)
    .search(['headline1', 'headline2', 'headline3'])
    .sort()
    .paginate();

  const ads = await features.query.populate('campaign', 'campaignName');
  const total = await Ad.countDocuments(filter);

  res.json({
    success: true,
    data: ads,
    pagination: { ...features.pagination, total, pages: Math.ceil(total / (features.pagination?.limit || 10)) }
  });
});

exports.createAd = asyncHandler(async (req, res) => {
  req.body.createdBy = req.user._id;
  if (req.params.campaignId) req.body.campaign = req.params.campaignId;
  const ad = await Ad.create(req.body);
  await logActivity(req.user._id, 'ad_created', 'ad', ad._id, `Ad copy created`, req.ip);
  res.status(201).json({ success: true, data: ad });
});

exports.getAd = asyncHandler(async (req, res) => {
  const ad = await Ad.findById(req.params.id).populate('campaign', 'campaignName');
  if (!ad) return res.status(404).json({ success: false, message: 'Ad not found' });
  res.json({ success: true, data: ad });
});

exports.updateAd = asyncHandler(async (req, res) => {
  const ad = await Ad.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!ad) return res.status(404).json({ success: false, message: 'Ad not found' });
  await logActivity(req.user._id, 'ad_updated', 'ad', ad._id, `Ad copy updated`, req.ip);
  res.json({ success: true, data: ad });
});

exports.deleteAd = asyncHandler(async (req, res) => {
  const ad = await Ad.findByIdAndDelete(req.params.id);
  if (!ad) return res.status(404).json({ success: false, message: 'Ad not found' });
  res.json({ success: true, message: 'Ad deleted successfully' });
});
