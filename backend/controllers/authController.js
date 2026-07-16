const User = require('../models/User');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const UAParser = require('ua-parser-js');
const crypto = require('crypto');
const {
  generateToken, generateRefreshToken, hashToken, asyncHandler,
  setRefreshTokenCookie, clearRefreshTokenCookie,
} = require('../utils/helpers');
const { logActivity } = require('../middlewares/activityLogger');

const parseDevice = (req) => {
  const parser = new UAParser(req.headers['user-agent']);
  const result = parser.getResult();
  return {
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.headers['user-agent'],
    device: result.device?.model || result.device?.type || 'Desktop',
    browser: `${result.browser?.name || 'Unknown'} ${result.browser?.version || ''}`.trim(),
    os: `${result.os?.name || 'Unknown'} ${result.os?.version || ''}`.trim(),
  };
};

const deviceFingerprint = (info) => {
  return crypto.createHash('sha256').update(`${info.browser}-${info.os}-${info.device}`).digest('hex').substring(0, 16);
};

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'Email already registered' });
  }
  const user = await User.create({ name, email, password, role: role || 'user' });
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshTokens.push({
    token: hashToken(refreshToken),
    device: parseDevice(req).device,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  await user.save({ validateBeforeSave: false });

  setRefreshTokenCookie(res, refreshToken);
  res.status(201).json({ success: true, data: { user, token, refreshToken } });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password, twoFactorCode } = req.body;
  const user = await User.findOne({ email }).select('+password +twoFactorSecret +twoFactorBackupCodes +loginHistory');

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  if (user.isLocked) {
    const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
    return res.status(423).json({
      success: false,
      message: `Account locked due to too many failed attempts. Try again in ${minutesLeft} minutes.`,
    });
  }

  if (!(await user.comparePassword(password))) {
    await user.incrementLoginAttempts();
    const deviceInfo = parseDevice(req);
    user.loginHistory.push({ ...deviceInfo, success: false });
    if (user.loginHistory.length > 50) user.loginHistory = user.loginHistory.slice(-50);
    await user.save({ validateBeforeSave: false });

    await logActivity(user._id, 'login_failed', 'user', user._id, `Failed login attempt from ${deviceInfo.ip}`, req.ip);
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  if (!user.isActive) {
    return res.status(401).json({ success: false, message: 'Account is deactivated' });
  }

  if (user.twoFactorEnabled) {
    if (!twoFactorCode) {
      return res.status(200).json({ success: true, requiresTwoFactor: true, message: 'Please enter your 2FA code' });
    }

    const isValidCode = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: twoFactorCode,
      window: 1,
    });

    if (!isValidCode) {
      const isBackupCode = user.twoFactorBackupCodes.includes(
        crypto.createHash('sha256').update(twoFactorCode).digest('hex')
      );
      if (isBackupCode) {
        user.twoFactorBackupCodes = user.twoFactorBackupCodes.filter(
          c => c !== crypto.createHash('sha256').update(twoFactorCode).digest('hex')
        );
      } else {
        return res.status(401).json({ success: false, message: 'Invalid 2FA code' });
      }
    }
  }

  await user.resetLoginAttempts();

  const deviceInfo = parseDevice(req);
  const fp = deviceFingerprint(deviceInfo);
  const isNewDevice = !user.trustedDevices.includes(fp);

  user.lastLogin = new Date();
  user.loginHistory.push({ ...deviceInfo, success: true });
  if (user.loginHistory.length > 50) user.loginHistory = user.loginHistory.slice(-50);

  if (isNewDevice) {
    user.trustedDevices.push(fp);
    if (user.trustedDevices.length > 20) user.trustedDevices = user.trustedDevices.slice(-20);
  }

  user.refreshTokens = user.refreshTokens.filter(t => t.expiresAt > new Date());
  if (user.refreshTokens.length > 5) user.refreshTokens = user.refreshTokens.slice(-5);

  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshTokens.push({
    token: hashToken(refreshToken),
    device: deviceInfo.device,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  await user.save({ validateBeforeSave: false });

  await logActivity(user._id, 'login', 'user', user._id, `User logged in from ${deviceInfo.ip} (${deviceInfo.browser}, ${deviceInfo.os})`, req.ip, { device: deviceInfo.device, isNewDevice });

  setRefreshTokenCookie(res, refreshToken);
  res.json({
    success: true,
    data: { user, token, refreshToken },
    isNewDevice,
  });
});

exports.refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!token) {
    return res.status(401).json({ success: false, message: 'No refresh token provided' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }

  const user = await User.findById(decoded.id).select('+refreshTokens');
  if (!user || !user.isActive) {
    return res.status(401).json({ success: false, message: 'User not found or inactive' });
  }

  const hashedToken = hashToken(token);
  const storedToken = user.refreshTokens.find(t => t.token === hashedToken);
  if (!storedToken) {
    user.refreshTokens = [];
    await user.save({ validateBeforeSave: false });
    clearRefreshTokenCookie(res);
    return res.status(401).json({ success: false, message: 'Refresh token reuse detected. All sessions revoked.' });
  }

  user.refreshTokens = user.refreshTokens.filter(t => t.token !== hashedToken);
  const newAccessToken = generateToken(user._id);
  const newRefreshToken = generateRefreshToken(user._id);

  user.refreshTokens.push({
    token: hashToken(newRefreshToken),
    device: storedToken.device,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  await user.save({ validateBeforeSave: false });

  setRefreshTokenCookie(res, newRefreshToken);
  res.json({ success: true, data: { token: newAccessToken, refreshToken: newRefreshToken } });
});

exports.logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;

  if (token && req.user) {
    const hashed = hashToken(token);
    const user = await User.findById(req.user._id).select('+refreshTokens');
    if (user) {
      user.refreshTokens = user.refreshTokens.filter(t => t.token !== hashed);
      await user.save({ validateBeforeSave: false });
    }
  }

  clearRefreshTokenCookie(res);
  await logActivity(req.user._id, 'logout', 'user', req.user._id, 'User logged out', req.ip);
  res.json({ success: true, message: 'Logged out successfully' });
});

exports.logoutAll = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+refreshTokens');
  user.refreshTokens = [];
  await user.save({ validateBeforeSave: false });

  clearRefreshTokenCookie(res);
  await logActivity(req.user._id, 'logout_all', 'user', req.user._id, 'All sessions revoked', req.ip);
  res.json({ success: true, message: 'All sessions revoked' });
});

exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, data: user });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;
  const user = await User.findByIdAndUpdate(req.user._id, { name, email }, { new: true, runValidators: true });
  res.json({ success: true, data: user });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password +refreshTokens');
  if (!(await user.comparePassword(currentPassword))) {
    return res.status(400).json({ success: false, message: 'Current password is incorrect' });
  }
  user.password = newPassword;
  user.refreshTokens = [];
  await user.save();

  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshTokens.push({
    token: hashToken(refreshToken),
    device: parseDevice(req).device,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  await user.save({ validateBeforeSave: false });

  setRefreshTokenCookie(res, refreshToken);
  await logActivity(user._id, 'password_changed', 'user', user._id, 'Password changed', req.ip);
  res.json({ success: true, data: { token, refreshToken }, message: 'Password updated successfully' });
});

// 2FA Setup
exports.setup2FA = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const secret = speakeasy.generateSecret({
    name: `WarmFarm (${user.email})`,
    issuer: 'WarmFarm',
  });

  user.twoFactorSecret = secret.base32;
  await user.save({ validateBeforeSave: false });

  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
  res.json({
    success: true,
    data: { secret: secret.base32, qrCode: qrCodeUrl },
  });
});

exports.verify2FA = asyncHandler(async (req, res) => {
  const { code } = req.body;
  const user = await User.findById(req.user._id).select('+twoFactorSecret');

  const isValid = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token: code,
    window: 1,
  });

  if (!isValid) {
    return res.status(400).json({ success: false, message: 'Invalid 2FA code' });
  }

  const backupCodes = Array.from({ length: 10 }, () => crypto.randomBytes(4).toString('hex'));
  user.twoFactorEnabled = true;
  user.twoFactorBackupCodes = backupCodes.map(c => crypto.createHash('sha256').update(c).digest('hex'));
  await user.save({ validateBeforeSave: false });

  await logActivity(user._id, '2fa_enabled', 'user', user._id, '2FA enabled', req.ip);
  res.json({ success: true, message: '2FA enabled', data: { backupCodes } });
});

exports.disable2FA = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(password))) {
    return res.status(400).json({ success: false, message: 'Invalid password' });
  }

  user.twoFactorEnabled = false;
  user.twoFactorSecret = undefined;
  user.twoFactorBackupCodes = [];
  await user.save({ validateBeforeSave: false });

  await logActivity(user._id, '2fa_disabled', 'user', user._id, '2FA disabled', req.ip);
  res.json({ success: true, message: '2FA disabled' });
});

// Login history
exports.getLoginHistory = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+loginHistory');
  const history = (user.loginHistory || []).slice(-20).reverse();
  res.json({ success: true, data: history });
});

exports.getActiveSessions = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+refreshTokens');
  const sessions = (user.refreshTokens || [])
    .filter(t => t.expiresAt > new Date())
    .map(t => ({ device: t.device, createdAt: t.createdAt, expiresAt: t.expiresAt }));
  res.json({ success: true, data: sessions });
});

exports.revokeSession = asyncHandler(async (req, res) => {
  const { sessionIndex } = req.params;
  const user = await User.findById(req.user._id).select('+refreshTokens');
  const activeSessions = user.refreshTokens.filter(t => t.expiresAt > new Date());

  const idx = parseInt(sessionIndex);
  if (idx < 0 || idx >= activeSessions.length) {
    return res.status(400).json({ success: false, message: 'Invalid session index' });
  }

  const tokenToRemove = activeSessions[idx].token;
  user.refreshTokens = user.refreshTokens.filter(t => t.token !== tokenToRemove);
  await user.save({ validateBeforeSave: false });

  res.json({ success: true, message: 'Session revoked' });
});

// Admin user management
exports.getAllUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  const search = req.query.search || '';

  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const total = await User.countDocuments(query);
  const users = await User.find(query).select('-password').skip(skip).limit(limit).sort('-createdAt');

  res.json({ success: true, data: users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

exports.createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'User with this email already exists' });
  }
  const user = await User.create({ name, email, password, role: role || 'user' });
  res.status(201).json({ success: true, data: { _id: user._id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt } });
});

exports.updateUser = asyncHandler(async (req, res) => {
  const { name, email, role } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ success: false, message: 'Email already in use' });
  }

  user.name = name || user.name;
  user.email = email || user.email;
  if (role) user.role = role;
  await user.save();

  res.json({ success: true, data: { _id: user._id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt } });
});

exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  if (user._id.toString() === req.user._id.toString()) {
    return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
  }
  await User.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'User deleted' });
});
