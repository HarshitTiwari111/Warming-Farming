const express = require('express');
const router = express.Router({ mergeParams: true });
const { getAds, createAd, getAd, updateAd, deleteAd } = require('../controllers/adController');
const { protect } = require('../middlewares/auth');

router.use(protect);
router.route('/').get(getAds).post(createAd);
router.route('/:id').get(getAd).put(updateAd).delete(deleteAd);

module.exports = router;
