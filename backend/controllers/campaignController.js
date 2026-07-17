const Campaign = require('../models/Campaign');
const APIFeatures = require('../utils/apiFeatures');
const { asyncHandler } = require('../utils/helpers');
const { logActivity } = require('../middlewares/activityLogger');

exports.getCampaigns = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const ownerFilter = isAdmin ? { owner: { $ne: null } } : { owner: req.user._id };

  const features = new APIFeatures(Campaign.find(ownerFilter), req.query)
    .search(['campaignName'])
    .filter()
    .sort()
    .paginate();

  const campaigns = await features.query.populate('account', 'name inviteEmail').populate('createdBy', 'name').populate('owner', 'name email');
  const combinedFilter = { ...ownerFilter, ...(features.filterObj || {}) };
  const total = await Campaign.countDocuments(combinedFilter);

  res.json({
    success: true,
    data: campaigns,
    pagination: { ...features.pagination, total, pages: Math.ceil(total / (features.pagination?.limit || 10)) }
  });
});

exports.getCampaign = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findById(req.params.id)
    .populate('account', 'name inviteEmail')
    .populate('createdBy', 'name email');
  if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
  if (req.user.role !== 'admin' && campaign.owner?.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  res.json({ success: true, data: campaign });
});

exports.updateCampaign = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);
  if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
  if (req.user.role !== 'admin' && campaign.owner?.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  Object.assign(campaign, req.body);
  await campaign.save({ runValidators: true });
  await logActivity(req.user._id, 'campaign_updated', 'campaign', campaign._id, `Campaign ${campaign.campaignName} updated`, req.ip);
  res.json({ success: true, data: campaign });
});

exports.deleteCampaign = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);
  if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
  if (req.user.role !== 'admin' && campaign.owner?.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  await Campaign.findByIdAndDelete(req.params.id);
  await logActivity(req.user._id, 'campaign_deleted', 'campaign', campaign._id, `Campaign ${campaign.campaignName} deleted`, req.ip);
  res.json({ success: true, message: 'Campaign deleted successfully' });
});

exports.updateCampaignStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const campaign = await Campaign.findById(req.params.id);
  if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
  if (req.user.role !== 'admin' && campaign.owner?.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  campaign.status = status;
  await campaign.save({ runValidators: true });
  await logActivity(req.user._id, 'campaign_status_changed', 'campaign', campaign._id, `Status changed to ${status}`, req.ip);
  res.json({ success: true, data: campaign });
});
