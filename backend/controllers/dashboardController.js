const Account = require('../models/Account');
const Campaign = require('../models/Campaign');
const ActivityLog = require('../models/ActivityLog');
const { asyncHandler } = require('../utils/helpers');

exports.getStats = asyncHandler(async (req, res) => {
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
    Account.countDocuments(),
    Account.countDocuments({ status: 'active' }),
    Account.countDocuments({ status: 'paused' }),
    Account.countDocuments({ status: 'pending' }),
    Campaign.countDocuments(),
    Campaign.countDocuments({ status: 'active' }),
    Campaign.countDocuments({ status: 'paused' }),
    Campaign.countDocuments({ status: 'draft' })
  ]);

  const budgetResult = await Campaign.aggregate([
    { $match: { status: 'active' } },
    { $group: { _id: null, totalBudget: { $sum: '$dailyBudget' }, totalSpend: { $sum: '$spend' } } }
  ]);

  const totalDailyBudget = budgetResult.length > 0 ? budgetResult[0].totalBudget : 0;
  const totalSpend = budgetResult.length > 0 ? budgetResult[0].totalSpend : 0;

  const campaignsByStatus = await Campaign.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  const campaignsByDevice = await Campaign.aggregate([
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
