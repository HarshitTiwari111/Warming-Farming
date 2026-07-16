const express = require('express');
const router = express.Router();
const { startWarming, advanceWarming, getWarmingStatus, getAllWarmingAccounts, resetWarming } = require('../controllers/warmingController');
const { protect } = require('../middlewares/auth');

router.use(protect);
router.get('/', getAllWarmingAccounts);
router.post('/:accountId/start', startWarming);
router.put('/:accountId/advance', advanceWarming);
router.get('/:accountId/status', getWarmingStatus);
router.put('/:accountId/reset', resetWarming);

module.exports = router;
