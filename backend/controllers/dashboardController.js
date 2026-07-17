const Account = require('../models/Account');
const Campaign = require('../models/Campaign');
const ActivityLog = require('../models/ActivityLog');
const { asyncHandler } = require('../utils/helpers');

exports.getStats = asyncHandler(async (req, res) => {
  const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
  const acctFilter = isAdmin ? {} : { $or: [{ owner: req.user._id }, { owner: null, createdBy: req.user._id }] };
  const campFilter = isAdmin ? {} : { $or: [{ owner: req.user._id }, { owner: null, createdBy: req.user._id }] };

  const [
    totalAccounts,
    activeAccounts,
    pausedAccounts,
    pendingAccounts,
    totalCampaigns,
    activeCampaigns,
    pausedCampaigns,
    draftCampaigns
  ] = await Promise.all([
    Account.countDocuments(acctFilter),
    Account.countDocuments({ ...acctFilter, status: 'active' }),
    Account.countDocuments({ ...acctFilter, status: 'paused' }),
    Account.countDocuments({ ...acctFilter, status: 'pending' }),
    Campaign.countDocuments(campFilter),
    Campaign.countDocuments({ ...campFilter, status: 'active' }),
    Campaign.countDocuments({ ...campFilter, status: 'paused' }),
    Campaign.countDocuments({ ...campFilter, status: 'draft' })
  ]);

  const budgetResult = await Campaign.aggregate([
    { $match: { ...campFilter, status: 'active' } },
    { $group: { _id: null, totalBudget: { $sum: '$dailyBudget' }, totalSpend: { $sum: '$spend' } } }
  ]);

  const totalDailyBudget = budgetResult.length > 0 ? budgetResult[0].totalBudget : 0;
  const totalSpend = budgetResult.length > 0 ? budgetResult[0].totalSpend : 0;

  const campaignsByStatus = await Campaign.aggregate([
    { $match: campFilter },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  const campaignsByDevice = await Campaign.aggregate([
    { $match: campFilter },
    { $group: { _id: '$device', count: { $sum: 1 } } }
  ]);

  const recentActivity = await ActivityLog.find()
    .populate('user', 'name')
    .sort('-createdAt')
    .limit(10);

  res.json({
    success: true,
    data: {
      stats: {
        totalAccounts,
        activeAccounts,
        pausedAccounts,
        pendingAccounts,
        totalCampaigns,
        activeCampaigns,
        pausedCampaigns,
        draftCampaigns,
        totalDailyBudget,
        totalSpend
      },
      charts: { campaignsByStatus, campaignsByDevice },
      recentActivity
    }
  });
});
