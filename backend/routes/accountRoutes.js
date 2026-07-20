const express = require('express');
const router = express.Router();
const { getAccounts, getAccount, createAccount, bulkCreateAccounts, updateAccount, deleteAccount, sendInvite } = require('../controllers/accountController');
const { protect } = require('../middlewares/auth');
const { accountValidator } = require('../validators/accountValidator');
const validate = require('../validators/validate');

router.use(protect);
router.route('/').get(getAccounts).post(accountValidator, validate, createAccount);
router.post('/bulk', bulkCreateAccounts);
router.route('/:id').get(getAccount).put(updateAccount).delete(deleteAccount);
router.post('/:id/send-invite', sendInvite);

module.exports = router;
