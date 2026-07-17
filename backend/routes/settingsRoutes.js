const express = require('express');
const router = express.Router();
const { getSettings, getSetting, upsertSetting, deleteSetting, seedDefaults } = require('../controllers/settingsController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);
router.route('/').get(getSettings).post(authorize('admin'), upsertSetting);
router.post('/seed', authorize('admin'), seedDefaults);
router.route('/:key').get(getSetting).delete(authorize('admin'), deleteSetting);

module.exports = router;
