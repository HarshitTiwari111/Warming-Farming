const express = require('express');
const router = express.Router();
const {
  register, login, refreshToken, logout, logoutAll,
  getMe, updateProfile, changePassword,
  setup2FA, verify2FA, disable2FA,
  getLoginHistory, getActiveSessions, revokeSession,
} = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const { registerValidator, loginValidator } = require('../validators/authValidator');
const validate = require('../validators/validate');

router.post('/register', registerValidator, validate, register);
router.post('/login', loginValidator, validate, login);
router.post('/refresh-token', refreshToken);

router.use(protect);
router.post('/logout', logout);
router.post('/logout-all', logoutAll);
router.get('/me', getMe);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);

// 2FA
router.post('/2fa/setup', setup2FA);
router.post('/2fa/verify', verify2FA);
router.post('/2fa/disable', disable2FA);

// Sessions & login history
router.get('/login-history', getLoginHistory);
router.get('/sessions', getActiveSessions);
router.delete('/sessions/:sessionIndex', revokeSession);

module.exports = router;
