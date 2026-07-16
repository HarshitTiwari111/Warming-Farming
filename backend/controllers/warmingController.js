const warmingService = require('../services/warmingService');
const Account = require('../models/Account');
const { asyncHandler } = require('../utils/helpers');
const notificationService = require('../services/notificationService');

exports.startWarming = asyncHandler(async (req, res) => {
  const { customSchedule } = req.body;
  const account = await warmingService.startWarming(req.params.accountId, req.user._id, customSchedule);
  await notificationService.create(req.user._id, 'Warming Started', `Warming process started for ${account.accountName}`, 'info');
  res.json({ success: true, data: account });
});

exports.advanceWarming = asyncHandler(async (req, res) => {
  const result = await warmingService.advanceWarming(req.params.accountId, req.user._id);
  if (result.completed) {
    await notificationService.create(req.user._id, 'Warming Completed', `Warming completed for ${result.account.accountName}`, 'success');
  }
  res.json({ success: true, data: result });
});

exports.getWarmingStatus = asyncHandler(async (req, res) => {
  const status = await warmingService.getWarmingStatus(req.params.accountId);
  res.json({ success: true, data: status });
});

exports.getAllWarmingAccounts = asyncHandler(async (req, res) => {
  const accounts = await Account.find({ status: 'warming', isDeleted: false }).sort('-warmingStartDate');
  const statuses = await Promise.all(accounts.map(a => warmingService.getWarmingStatus(a._id)));
  res.json({ success: true, data: statuses });
});

exports.resetWarming = asyncHandler(async (req, res) => {
  const account = await Account.findById(req.params.accountId);
  if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
  account.warmingStage = 0;
  account.warmingSchedule = [];
  account.warmingStartDate = null;
  account.status = 'pending';
  await account.save();
  res.json({ success: true, data: account, message: 'Warming reset successfully' });
});
