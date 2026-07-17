const Campaign = require('../models/Campaign');
const APIFeatures = require('../utils/apiFeatures');
const { asyncHandler } = require('../utils/helpers');
const { logActivity } = require('../middlewares/activityLogger');

exports.getCampaigns = asyncHandler(async (req, res) => {
  const features = new APIFeatures(Campaign.find(), req.query)
    .search(['campaignName'])
    .filter()
    .sort()
    .paginate();

  const campaigns = await features.query.populate('account', 'name inviteEmail').populate('createdBy', 'name');
  const total = await Campaign.countDocuments(features.filterObj || {});

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
  res.json({ success: true, data: campaign });
});

exports.updateCampaign = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
  await logActivity(req.user._id, 'campaign_updated', 'campaign', campaign._id, `Campaign ${campaign.campaignName} updated`, req.ip);
  res.json({ success: true, data: campaign });
});

exports.deleteCampaign = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findByIdAndDelete(req.params.id);
  if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
  await logActivity(req.user._id, 'campaign_deleted', 'campaign', campaign._id, `Campaign ${campaign.campaignName} deleted`, req.ip);
  res.json({ success: true, message: 'Campaign deleted successfully' });
});

exports.updateCampaignStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const campaign = await Campaign.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  );
  if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
  await logActivity(req.user._id, 'campaign_status_changed', 'campaign', campaign._id, `Status changed to ${status}`, req.ip);
  res.json({ success: true, data: campaign });
});
