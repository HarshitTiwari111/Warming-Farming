const express = require('express');
const router = express.Router();
const { getCampaigns, getCampaign, updateCampaign, deleteCampaign, updateCampaignStatus } = require('../controllers/campaignController');
const { protect } = require('../middlewares/auth');

router.use(protect);
router.route('/').get(getCampaigns);
router.route('/:id').get(getCampaign).put(updateCampaign).delete(deleteCampaign);
router.put('/:id/status', updateCampaignStatus);

module.exports = router;
