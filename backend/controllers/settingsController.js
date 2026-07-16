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
  const setting = await Setting.findOne({ key: 'google_ads_refresh_token' });
  res.json({ success: true, data: { connected: !!(setting?.value) } });
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
