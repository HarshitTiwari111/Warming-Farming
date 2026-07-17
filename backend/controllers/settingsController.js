const Setting = require('../models/Setting');
const { asyncHandler } = require('../utils/helpers');
const { logActivity } = require('../middlewares/activityLogger');

exports.getSettings = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.category) filter.category = req.query.category;
  const settings = await Setting.find(filter).sort('category key');
  res.json({ success: true, data: settings });
});

exports.getSetting = asyncHandler(async (req, res) => {
  const setting = await Setting.findOne({ key: req.params.key });
  if (!setting) return res.status(404).json({ success: false, message: 'Setting not found' });
  res.json({ success: true, data: setting });
});

exports.upsertSetting = asyncHandler(async (req, res) => {
  const { key, value, category, description } = req.body;
  const setting = await Setting.findOneAndUpdate(
    { key },
    { value, category, description, updatedBy: req.user._id },
    { new: true, upsert: true, runValidators: true }
  );
  await logActivity(req.user._id, 'setting_updated', 'settings', setting._id, `Setting ${key} updated`, req.ip);
  res.json({ success: true, data: setting });
});

exports.deleteSetting = asyncHandler(async (req, res) => {
  const setting = await Setting.findOneAndDelete({ key: req.params.key });
  if (!setting) return res.status(404).json({ success: false, message: 'Setting not found' });
  res.json({ success: true, message: 'Setting deleted successfully' });
});

exports.getGoogleAdsStatus = asyncHandler(async (req, res) => {
  const refreshToken = await Setting.findOne({ key: 'google_ads_refresh_token' });
  const rawParams = await Setting.findOne({ key: 'google_ads_oauth_params' });
  const mccSetting = await Setting.findOne({ key: 'google_ads_mcc_ids' });
  res.json({
    success: true,
    data: {
      connected: !!(refreshToken?.value),
      refreshToken: refreshToken?.value ? `${String(refreshToken.value).substring(0, 15)}...` : null,
      rawParams: rawParams?.value || null,
      mccIds: Array.isArray(mccSetting?.value) ? mccSetting.value : mccSetting?.value ? [mccSetting.value] : []
    }
  });
});

exports.saveGoogleAdsMccIds = asyncHandler(async (req, res) => {
  const { mccIds } = req.body;
  if (!Array.isArray(mccIds)) return res.status(400).json({ success: false, message: 'mccIds must be an array' });

  const cleaned = mccIds.map(id => String(id).replace(/\D/g, '')).filter(id => id.length === 10);
  await Setting.findOneAndUpdate(
    { key: 'google_ads_mcc_ids' },
    { key: 'google_ads_mcc_ids', value: cleaned, category: 'google_ads', description: 'Google Ads MCC Account IDs', updatedBy: req.user._id },
    { upsert: true, new: true }
  );
  await logActivity(req.user._id, 'mcc_ids_updated', 'settings', null, `MCC IDs updated: ${cleaned.join(', ')}`, req.ip);
  res.json({ success: true, data: cleaned });
});

exports.getGoogleAdsAuthUrl = asyncHandler(async (req, res) => {
  const clientId = await Setting.findOne({ key: 'google_ads_client_id' });
  const redirectUri = await Setting.findOne({ key: 'google_ads_redirect_uri' });

  if (!clientId?.value || !redirectUri?.value) {
    return res.status(400).json({ success: false, message: 'Google Ads client ID and redirect URI must be configured in settings first.' });
  }

  const scopes = ['https://www.googleapis.com/auth/adwords'].join(' ');
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId.value)}&redirect_uri=${encodeURIComponent(redirectUri.value)}&response_type=code&scope=${encodeURIComponent(scopes)}&access_type=offline&prompt=consent`;

  res.json({ success: true, data: { url } });
});

exports.googleAdsDisconnect = asyncHandler(async (req, res) => {
  await Setting.findOneAndDelete({ key: 'google_ads_refresh_token' });
  await Setting.findOneAndDelete({ key: 'google_ads_access_token' });
  res.json({ success: true, message: 'Google Ads disconnected' });
});

exports.googleAdsSaveToken = asyncHandler(async (req, res) => {
  const { refresh_token, access_token, raw_params } = req.body;

  if (refresh_token) {
    await Setting.findOneAndUpdate(
      { key: 'google_ads_refresh_token' },
      { key: 'google_ads_refresh_token', value: refresh_token, category: 'google_ads', description: 'Google Ads refresh token', updatedBy: req.user._id },
      { upsert: true, new: true }
    );
  }

  if (access_token) {
    await Setting.findOneAndUpdate(
      { key: 'google_ads_access_token' },
      { key: 'google_ads_access_token', value: access_token, category: 'google_ads', description: 'Google Ads access token', updatedBy: req.user._id },
      { upsert: true, new: true }
    );
  }

  if (raw_params && Object.keys(raw_params).length > 0) {
    await Setting.findOneAndUpdate(
      { key: 'google_ads_oauth_params' },
      { key: 'google_ads_oauth_params', value: raw_params, category: 'google_ads', description: 'Raw OAuth callback params', updatedBy: req.user._id },
      { upsert: true, new: true }
    );
  }

  await logActivity(req.user._id, 'google_ads_connected', 'settings', null, 'Google Ads account connected', req.ip);
  res.json({ success: true, message: 'Google Ads tokens saved successfully' });
});

exports.getGoogleAdsAccounts = asyncHandler(async (req, res) => {
  const googleAds = require('../services/googleAdsService');
  const refreshToken = await googleAds.getRefreshToken();
  if (!refreshToken) return res.status(400).json({ success: false, message: 'Google Ads not connected' });

  const mccId = await googleAds.getMccId();
  if (!mccId) return res.status(400).json({ success: false, message: 'No MCC ID configured. Add MCC ID in Settings first.' });
  const accounts = await googleAds.fetchClientAccounts(mccId, refreshToken);
  res.json({ success: true, data: accounts });
});

exports.getGoogleAdsCampaigns = asyncHandler(async (req, res) => {
  const googleAds = require('../services/googleAdsService');
  const refreshToken = await googleAds.getRefreshToken();
  if (!refreshToken) return res.status(400).json({ success: false, message: 'Google Ads not connected' });

  const mccId = await googleAds.getMccId();
  if (!mccId) return res.status(400).json({ success: false, message: 'No MCC ID configured. Add MCC ID in Settings first.' });
  const { customerId } = req.params;
  const campaigns = await googleAds.fetchCampaigns(customerId, refreshToken, mccId);
  res.json({ success: true, data: campaigns });
});

exports.syncGoogleAdsAccounts = asyncHandler(async (req, res) => {
  const googleAds = require('../services/googleAdsService');
  const Account = require('../models/Account');
  const Campaign = require('../models/Campaign');
  const refreshToken = await googleAds.getRefreshToken();
  if (!refreshToken) return res.status(400).json({ success: false, message: 'Google Ads not connected' });

  const mccIds = await googleAds.getMccIds();
  if (!mccIds.length) return res.status(400).json({ success: false, message: 'No MCC ID configured. Add MCC ID in Settings first.' });
  let synced = 0;
  let campaignsSynced = 0;
  const failedMccs = [];

  for (const mccId of mccIds) {
    let clientAccounts;
    try {
      clientAccounts = await googleAds.fetchClientAccounts(mccId, refreshToken);
    } catch (err) {
      console.error(`MCC ${mccId} failed:`, err.message);
      failedMccs.push(mccId);
      continue;
    }

    for (const acct of clientAccounts) {
      let localAccount = await Account.findOne({ googleAdsCustomerId: acct.customerId });
      if (!localAccount) {
        localAccount = await Account.create({
          name: acct.name || `Account ${acct.customerId}`,
          googleAdsCustomerId: acct.customerId,
          sourceMccId: mccId,
          inviteEmail: 'synced@googleads.com',
          status: acct.status === 'ENABLED' ? 'active' : acct.status === 'REMOVED' ? 'ended' : 'paused',
          createdBy: req.user._id,
        });
      } else {
        localAccount.name = acct.name || localAccount.name;
        localAccount.status = acct.status === 'ENABLED' ? 'active' : 'paused';
        localAccount.sourceMccId = mccId;
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
              account: localAccount._id,
              status: camp.status === 'ENABLED' ? 'active' : camp.status === 'REMOVED' ? 'ended' : 'paused',
              clicks: camp.clicks,
              impressions: camp.impressions,
              spend: camp.spend,
              conversions: camp.conversions,
              createdBy: req.user._id,
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

  let msg = `Synced ${synced} accounts and ${campaignsSynced} campaigns from ${mccIds.length - failedMccs.length}/${mccIds.length} MCC(s)`;
  if (failedMccs.length > 0) msg += `. Failed MCCs (no permission): ${failedMccs.join(', ')}`;

  await logActivity(req.user._id, 'google_ads_synced', 'settings', null, msg, req.ip);
  res.json({ success: true, message: msg });
});

exports.seedDefaults = asyncHandler(async (req, res) => {
  const defaults = [
    { key: 'countries', value: ['India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France'], category: 'countries', description: 'Available countries' },
    { key: 'bid_strategies', value: ['manual_cpc', 'maximize_clicks', 'maximize_conversions', 'target_cpa', 'target_roas', 'target_impression_share'], category: 'bid_strategies', description: 'Available bid strategies' },
    { key: 'campaign_types', value: ['search', 'display', 'video', 'shopping', 'app', 'smart', 'performance_max'], category: 'campaign_types', description: 'Available campaign types' },
    { key: 'default_budget', value: 500, category: 'budgets', description: 'Default daily budget' },
    { key: 'warming_schedule', value: [
      { day: 1, budget: 500 }, { day: 2, budget: 700 }, { day: 3, budget: 1000 },
      { day: 4, budget: 1200 }, { day: 5, budget: 1500 }, { day: 6, budget: 1800 },
      { day: 7, budget: 2000 }, { day: 8, budget: 2500 }, { day: 9, budget: 3000 }, { day: 10, budget: 3500 }
    ], category: 'warming', description: 'Default warming schedule' }
  ];

  for (const d of defaults) {
    await Setting.findOneAndUpdate({ key: d.key }, d, { upsert: true });
  }

  res.json({ success: true, message: 'Default settings seeded successfully' });
});
