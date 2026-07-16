const express = require('express');
const router = express.Router();
const { publishCampaign, getPublishHistory } = require('../controllers/publishController');
const { protect } = require('../middlewares/auth');

router.use(protect);
router.post('/:campaignId', publishCampaign);
router.get('/history', getPublishHistory);
router.get('/history/:campaignId', getPublishHistory);

module.exports = router;
