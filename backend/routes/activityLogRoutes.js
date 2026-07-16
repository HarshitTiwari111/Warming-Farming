const express = require('express');
const router = express.Router();
const { getLogs } = require('../controllers/activityLogController');
const { protect } = require('../middlewares/auth');

router.use(protect);
router.get('/', getLogs);

module.exports = router;
