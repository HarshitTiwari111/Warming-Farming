const express = require('express');
const router = express.Router({ mergeParams: true });
const { getKeywords, createKeyword, createBulkKeywords, updateKeyword, deleteKeyword } = require('../controllers/keywordController');
const { protect } = require('../middlewares/auth');

router.use(protect);
router.route('/').get(getKeywords).post(createKeyword);
router.post('/bulk', createBulkKeywords);
router.route('/:id').put(updateKeyword).delete(deleteKeyword);

module.exports = router;
