const User = require('../models/User');
const Account = require('../models/Account');
const Campaign = require('../models/Campaign');
const googleAds = require('../services/googleAdsService');
const { asyncHandler } = require('../utils/helpers');
const { logActivity } = require('../middlewares/activityLogger');

exports.getMyGoogleStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+googleAdsRefreshToken');
  res.json({
    success: true,
    data: {
      connected: user.googleAdsConnected,
      mccIds: user.googleAdsMccIds || [],
      lastSync: user.googleAdsLastSync,
      hasToken: !!user.googleAdsRefreshToken,
    }
  });
});

exports.saveMyToken = asyncHandler(async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) return res.status(400).json({ success: false, message: 'refresh_token is required' });

  await User.findByIdAndUpdate(req.user._id, {
    googleAdsRefreshToken: refresh_token,
    googleAdsConnected: true,
  });

  await logActivity(req.user._id, 'google_ads_connected', 'user', req.user._id, 'Google Ads connected', req.ip);
  res.json({ success: true, message: 'Google Ads connected successfully' });
});

exports.disconnectMyGoogle = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    googleAdsRefreshToken: null,
    googleAdsConnected: false,
  });

  await logActivity(req.user._id, 'google_ads_disconnected', 'user', req.user._id, 'Google Ads disconnected', req.ip);
  res.json({ success: true, message: 'Google Ads disconnected' });
});

exports.saveMyMccIds = asyncHandler(async (req, res) => {
  const { mccIds } = req.body;
  if (!Array.isArray(mccIds)) return res.status(400).json({ success: false, message: 'mccIds must be an array' });

  const cleaned = mccIds.map(id => String(id).replace(/\D/g, '')).filter(id => id.length === 10);
  await User.findByIdAndUpdate(req.user._id, { googleAdsMccIds: cleaned });

  res.json({ success: true, data: cleaned });
});

exports.syncMyAccounts = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+googleAdsRefreshToken');
  if (!user.googleAdsRefreshToken) return res.status(400).json({ success: false, message: 'Google Ads not connected. Click Connect with Google first.' });
  if (!user.googleAdsMccIds.length) return res.status(400).json({ success: false, message: 'No MCC ID configured. Add your MCC ID first.' });

  const refreshToken = user.googleAdsRefreshToken;
  let synced = 0;
  let campaignsSynced = 0;
  const failedMccs = [];

  for (const mccId of user.googleAdsMccIds) {
    let clientAccounts;
    try {
      clientAccounts = await googleAds.fetchClientAccounts(mccId, refreshToken);
    } catch (err) {
      console.error(`MCC ${mccId} failed for user ${user.email}:`, err.message);
      failedMccs.push(mccId);
      continue;
    }

    for (const acct of clientAccounts) {
      let localAccount = await Account.findOne({ googleAdsCustomerId: acct.customerId, owner: user._id });
      if (!localAccount) {
        localAccount = await Account.create({
          name: acct.name || `Account ${acct.customerId}`,
          googleAdsCustomerId: acct.customerId,
          sourceMccId: mccId,
          owner: user._id,
          inviteEmail: acct.email || user.email,
          currency: acct.currency || 'USD',
          timezone: acct.timezone || 'Asia/Kolkata',
          status: acct.status === 'ENABLED' ? 'active' : acct.status === 'REMOVED' ? 'ended' : 'paused',
          createdBy: user._id,
        });
      } else {
        localAccount.name = acct.name || localAccount.name;
        localAccount.status = acct.status === 'ENABLED' ? 'active' : acct.status === 'REMOVED' ? 'ended' : 'paused';
        localAccount.sourceMccId = mccId;
        if (acct.email) localAccount.inviteEmail = acct.email;
        if (acct.currency) localAccount.currency = acct.currency;
        if (acct.timezone) localAccount.timezone = acct.timezone;
        await localAccount.save();
      }
      synced++;

      try {
        const campaigns = await googleAds.fetchCampaigns(acct.customerId, refreshToken, mccId);
        for (const camp of campaigns) {
          const existing = await Campaign.findOne({ googleAdsCampaignId: camp.campaignId, account: localAccount._id });
          if (!existing) {
            await Campaign.create({
              campaignName: camp.campaignName,
              googleAdsCampaignId: camp.campaignId,
              sourceMccId: mccId,
              owner: user._id,
              account: localAccount._id,
              status: camp.status === 'ENABLED' ? 'active' : camp.status === 'REMOVED' ? 'ended' : 'paused',
              clicks: camp.clicks,
              impressions: camp.impressions,
              spend: camp.spend,
              conversions: camp.conversions,
              createdBy: user._id,
            });
          } else {
            existing.campaignName = camp.campaignName;
            existing.status = camp.status === 'ENABLED' ? 'active' : camp.status === 'REMOVED' ? 'ended' : 'paused';
            existing.clicks = camp.clicks;
            existing.impressions = camp.impressions;
            existing.spend = camp.spend;
            existing.conversions = camp.conversions;
            existing.sourceMccId = mccId;
            await existing.save();
          }
          campaignsSynced++;
        }
      } catch (err) {
        console.error(`Failed to sync campaigns for ${acct.customerId}:`, err.message);
      }
    }
  }

  await User.findByIdAndUpdate(user._id, { googleAdsLastSync: new Date() });

  let msg = `Synced ${synced} accounts and ${campaignsSynced} campaigns from ${user.googleAdsMccIds.length - failedMccs.length}/${user.googleAdsMccIds.length} MCC(s)`;
  if (failedMccs.length > 0) msg += `. Failed MCCs (no permission): ${failedMccs.join(', ')}`;

  await logActivity(user._id, 'google_ads_synced', 'user', user._id, msg, req.ip);
  res.json({ success: true, message: msg });
});

exports.adminGetAllUsersGoogleStatus = asyncHandler(async (req, res) => {
  const users = await User.find({}, 'name email role googleAdsConnected googleAdsMccIds googleAdsLastSync isActive');
  res.json({ success: true, data: users });
});
