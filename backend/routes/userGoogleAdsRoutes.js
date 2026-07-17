const express = require('express');
const router = express.Router();
const { getMyGoogleStatus, saveMyToken, disconnectMyGoogle, saveMyMccIds, syncMyAccounts, adminGetAllUsersGoogleStatus } = require('../controllers/userGoogleAdsController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);
router.get('/my-google-status', getMyGoogleStatus);
router.post('/my-google-connect', saveMyToken);
router.post('/my-google-disconnect', disconnectMyGoogle);
router.post('/my-mcc-ids', saveMyMccIds);
router.post('/my-google-sync', syncMyAccounts);
router.get('/admin/users-google-status', authorize('admin', 'super_admin'), adminGetAllUsersGoogleStatus);

module.exports = router;
