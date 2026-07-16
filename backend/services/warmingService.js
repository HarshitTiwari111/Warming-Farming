const Account = require('../models/Account');
const { logActivity } = require('../middlewares/activityLogger');

class WarmingService {
  getDefaultSchedule() {
    return [
      { day: 1, budget: 500, status: 'pending' },
      { day: 2, budget: 700, status: 'pending' },
      { day: 3, budget: 1000, status: 'pending' },
      { day: 4, budget: 1200, status: 'pending' },
      { day: 5, budget: 1500, status: 'pending' },
      { day: 6, budget: 1800, status: 'pending' },
      { day: 7, budget: 2000, status: 'pending' },
      { day: 8, budget: 2500, status: 'pending' },
      { day: 9, budget: 3000, status: 'pending' },
      { day: 10, budget: 3500, status: 'pending' }
    ];
  }

  async startWarming(accountId, userId, customSchedule = null) {
    const account = await Account.findById(accountId);
    if (!account) throw new Error('Account not found');

    account.status = 'warming';
    account.warmingStage = 1;
    account.warmingStartDate = new Date();
    account.warmingSchedule = customSchedule || this.getDefaultSchedule();
    await account.save();
    await logActivity(userId, 'warming_started', 'warming', accountId, `Warming started for ${account.accountName}`);
    return account;
  }

  async advanceWarming(accountId, userId) {
    const account = await Account.findById(accountId);
    if (!account || account.status !== 'warming') throw new Error('Account is not in warming state');

    const currentStage = account.warmingStage;
    const schedule = account.warmingSchedule;

    if (currentStage > 0 && currentStage <= schedule.length) {
      schedule[currentStage - 1].status = 'completed';
      schedule[currentStage - 1].completedAt = new Date();
    }

    if (currentStage >= schedule.length) {
      account.status = 'active';
      account.warmingStage = schedule.length;
      await account.save();
      await logActivity(userId, 'warming_completed', 'warming', accountId, `Warming completed for ${account.accountName}`);
      return { account, completed: true };
    }

    account.warmingStage = currentStage + 1;
    account.warmingSchedule = schedule;
    await account.save();
    await logActivity(userId, 'warming_advanced', 'warming', accountId, `Warming advanced to day ${account.warmingStage}`);
    return { account, completed: false };
  }

  async getWarmingStatus(accountId) {
    const account = await Account.findById(accountId);
    if (!account) throw new Error('Account not found');

    const schedule = account.warmingSchedule || [];
    const currentStage = account.warmingStage || 0;
    const completedStages = schedule.filter(s => s.status === 'completed').length;
    const progress = schedule.length > 0 ? Math.round((completedStages / schedule.length) * 100) : 0;

    return {
      accountId: account._id,
      accountName: account.accountName,
      status: account.status,
      currentDay: currentStage,
      totalDays: schedule.length,
      currentBudget: currentStage > 0 && currentStage <= schedule.length ? schedule[currentStage - 1].budget : 0,
      progress,
      schedule,
      startDate: account.warmingStartDate
    };
  }
}

module.exports = new WarmingService();
