const express = require('express');
const router = express.Router();
const { getSettings, getSetting, upsertSetting, deleteSetting, seedDefaults, getGoogleAdsStatus, getGoogleAdsAuthUrl, googleAdsDisconnect, googleAdsSaveToken, getGoogleAdsAccounts, getGoogleAdsCampaigns, syncGoogleAdsAccounts, saveGoogleAdsMccIds } = require('../controllers/settingsController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);
router.get('/google-ads-status', getGoogleAdsStatus);
router.get('/google-ads-auth-url', authorize('admin'), getGoogleAdsAuthUrl);
router.post('/google-ads-disconnect', authorize('admin'), googleAdsDisconnect);
router.post('/google-ads-save-token', authorize('admin'), googleAdsSaveToken);
router.post('/google-ads-mcc-ids', authorize('admin'), saveGoogleAdsMccIds);
router.get('/google-ads-accounts', getGoogleAdsAccounts);
router.get('/google-ads-campaigns/:customerId', getGoogleAdsCampaigns);
router.post('/google-ads-sync', authorize('admin'), syncGoogleAdsAccounts);
router.route('/').get(getSettings).post(authorize('admin'), upsertSetting);
router.post('/seed', authorize('admin'), seedDefaults);
router.route('/:key').get(getSetting).delete(authorize('admin'), deleteSetting);

module.exports = router;
