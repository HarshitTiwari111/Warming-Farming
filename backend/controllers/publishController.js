const Campaign = require('../models/Campaign');
const PublishHistory = require('../models/PublishHistory');
const googleAdsService = require('../services/googleAdsService');
const { asyncHandler } = require('../utils/helpers');
const { logActivity } = require('../middlewares/activityLogger');
const notificationService = require('../services/notificationService');

exports.publishCampaign = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findById(req.params.campaignId).populate('account');
  if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
  if (campaign.status === 'published') return res.status(400).json({ success: false, message: 'Campaign is already published' });

  const previousStatus = campaign.status;

  await PublishHistory.create({
    campaign: campaign._id,
    account: campaign.account._id,
    status: 'publishing',
    previousStatus,
    publishedBy: req.user._id
  });

  try {
    await googleAdsService.publishCampaign(campaign.account.customerId, campaign._id);
    campaign.status = 'published';
    campaign.publishedAt = new Date();
    await campaign.save();

    await PublishHistory.create({
      campaign: campaign._id,
      account: campaign.account._id,
      status: 'published',
      previousStatus: 'publishing',
      publishedBy: req.user._id
    });

    await logActivity(req.user._id, 'campaign_published', 'publish', campaign._id, `Campaign ${campaign.campaignName} published`, req.ip);
    await notificationService.create(req.user._id, 'Campaign Published', `${campaign.campaignName} has been published successfully`, 'success');

    res.json({ success: true, data: campaign, message: 'Campaign published successfully' });
  } catch (error) {
    campaign.status = 'failed';
    campaign.failedReason = error.message;
    await campaign.save();

    await PublishHistory.create({
      campaign: campaign._id,
      account: campaign.account._id,
      status: 'failed',
      previousStatus: 'publishing',
      publishedBy: req.user._id,
      errorMessage: error.message
    });

    await notificationService.create(req.user._id, 'Publish Failed', `Failed to publish ${campaign.campaignName}: ${error.message}`, 'error');

    res.status(500).json({ success: false, message: 'Failed to publish campaign', error: error.message });
  }
});

exports.getPublishHistory = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.params.campaignId) filter.campaign = req.params.campaignId;

  const history = await PublishHistory.find(filter)
    .populate('campaign', 'campaignName')
    .populate('account', 'accountName')
    .populate('publishedBy', 'name')
    .sort('-createdAt');

  res.json({ success: true, data: history });
});
