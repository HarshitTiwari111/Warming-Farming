const express = require('express');
const router = express.Router();
const { generateReport, exportReport } = require('../controllers/reportController');
const { protect } = require('../middlewares/auth');

router.use(protect);
router.get('/', generateReport);
router.get('/export/:format', exportReport);

module.exports = router;
