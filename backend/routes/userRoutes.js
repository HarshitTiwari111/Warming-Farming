const express = require('express');
const router = express.Router();
const { getAllUsers, createUser, updateUser, deleteUser } = require('../controllers/authController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);
router.use(authorize('admin'));

router.route('/').get(getAllUsers).post(createUser);
router.route('/:id').put(updateUser).delete(deleteUser);

module.exports = router;
