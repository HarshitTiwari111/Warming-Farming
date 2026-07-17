const Account = require('../models/Account');
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { asyncHandler } = require('../utils/helpers');

exports.getStats = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const acctFilter = isAdmin ? { owner: { $ne: null } } : { owner: req.user._id };
  const campFilter = isAdmin ? { owner: { $ne: null } } : { owner: req.user._id };

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

  let adminStats = {};
  let userBreakdown = [];
  if (isAdmin) {
    const [connectedUsers, totalUsers] = await Promise.all([
      User.countDocuments({ googleAdsConnected: true }),
      User.countDocuments()
    ]);
    const usersWithMcc = await User.find({ googleAdsMccIds: { $exists: true, $ne: [] } }, 'googleAdsMccIds');
    const totalMccIds = usersWithMcc.reduce((sum, u) => sum + (u.googleAdsMccIds?.length || 0), 0);
    adminStats = { connectedUsers, totalUsers, totalMccIds };

    const allUsers = await User.find({}, 'name email role googleAdsConnected googleAdsMccIds googleAdsLastSync');
    const [acctCounts, campCounts] = await Promise.all([
      Account.aggregate([
        { $match: { owner: { $ne: null } } },
        { $group: { _id: '$owner', total: { $sum: 1 }, active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } }, paused: { $sum: { $cond: [{ $eq: ['$status', 'paused'] }, 1, 0] } } } }
      ]),
      Campaign.aggregate([
        { $match: { owner: { $ne: null } } },
        { $group: { _id: '$owner', total: { $sum: 1 }, active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } }, paused: { $sum: { $cond: [{ $eq: ['$status', 'paused'] }, 1, 0] } } } }
      ])
    ]);
    const acctMap = {};
    acctCounts.forEach(a => { acctMap[a._id.toString()] = a; });
    const campMap = {};
    campCounts.forEach(c => { campMap[c._id.toString()] = c; });

    userBreakdown = allUsers.map(u => {
      const uid = u._id.toString();
      const ac = acctMap[uid] || { total: 0, active: 0, paused: 0 };
      const ca = campMap[uid] || { total: 0, active: 0, paused: 0 };
      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        connected: u.googleAdsConnected || false,
        mccIds: u.googleAdsMccIds || [],
        lastSync: u.googleAdsLastSync,
        accounts: { total: ac.total, active: ac.active, paused: ac.paused },
        campaigns: { total: ca.total, active: ca.active, paused: ca.paused }
      };
    });
  }

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
        totalSpend,
        ...adminStats
      },
      charts: { campaignsByStatus, campaignsByDevice },
      recentActivity,
      userBreakdown
    }
  });
});
