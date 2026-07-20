const Account = require('../models/Account');
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const APIFeatures = require('../utils/apiFeatures');
const { asyncHandler } = require('../utils/helpers');
const { logActivity } = require('../middlewares/activityLogger');
const googleAds = require('../services/googleAdsService');

exports.getAccounts = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const ownerFilter = isAdmin ? { owner: { $ne: null } } : { owner: req.user._id };

  const baseQuery = Account.find(ownerFilter);
  const features = new APIFeatures(baseQuery, req.query)
    .search(['name', 'inviteEmail'])
    .filter()
    .sort()
    .paginate();

  const accounts = await features.query.populate('createdBy', 'name email').populate('owner', 'name email');
  const combinedFilter = { ...ownerFilter, ...(features.filterObj || {}) };
  const total = await Account.countDocuments(combinedFilter);

  res.json({
    success: true,
    data: accounts,
    pagination: { ...features.pagination, total, pages: Math.ceil(total / (features.pagination?.limit || 10)) }
  });
});

exports.getAccount = asyncHandler(async (req, res) => {
  const account = await Account.findById(req.params.id).populate('createdBy', 'name email');
  if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
  if (req.user.role !== 'admin' && account.owner?.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  res.json({ success: true, data: account });
});

exports.createAccount = asyncHandler(async (req, res) => {
  req.body.createdBy = req.user._id;
  req.body.owner = req.user._id;
  const account = await Account.create(req.body);

  // One budget for both: the local Campaign doc and the Google Ads campaign.
  const budget = Math.floor(Math.random() * 31) + 80;

  let googleAdsCampaignId = null;
  const fullUser = await User.findById(req.user._id).select('+googleAdsRefreshToken');
  if (fullUser?.googleAdsConnected && fullUser.googleAdsRefreshToken) {
    try {
      const result = await googleAds.createClientAccount(fullUser.googleAdsRefreshToken, {
        name: account.name,
        currencyCode: account.currency || 'USD',
        timeZone: account.timezone || 'Asia/Kolkata',
      });
      if (result.customerId) {
        account.googleAdsCustomerId = result.customerId;
        account.sourceMccId = result.mccId;
        await account.save();

        try {
          const campResult = await googleAds.createGoogleAdsCampaign(
            result.customerId, account.name, fullUser.googleAdsRefreshToken, result.mccId, budget
          );
          googleAdsCampaignId = campResult.campaignId;
        } catch (campErr) {
          console.error('Google Ads campaign creation failed:', campErr.message);
        }
      }
    } catch (err) {
      console.error('Google Ads account creation failed:', err.message);
    }
  }

  await Campaign.create({
    campaignName: `${account.name} - Campaign`,
    account: account._id,
    owner: req.user._id,
    dailyBudget: budget,
    status: 'active',
    country: 'India',
    device: 'all',
    createdBy: req.user._id,
    ...(googleAdsCampaignId && { googleAdsCampaignId }),
  });

  await logActivity(req.user._id, 'account_created', 'account', account._id, `Account ${account.name} created`, req.ip);
  res.status(201).json({ success: true, data: account });
});

exports.bulkCreateAccounts = asyncHandler(async (req, res) => {
  const { count, ...accountData } = req.body;
  const num = Math.min(Math.max(parseInt(count) || 1, 1), 100);
  const created = [];

  const fullUser = await User.findById(req.user._id).select('+googleAdsRefreshToken');
  const canCreateGoogleAds = fullUser?.googleAdsConnected && fullUser.googleAdsRefreshToken;

  for (let i = 1; i <= num; i++) {
    const name = num === 1 ? accountData.name : `${accountData.name} ${i}`;
    const account = await Account.create({
      ...accountData,
      name,
      owner: req.user._id,
      createdBy: req.user._id,
    });

    // One budget for both: the local Campaign doc and the Google Ads campaign.
    const budget = Math.floor(Math.random() * 31) + 80;

    let googleAdsCampaignId = null;
    if (canCreateGoogleAds) {
      try {
        const result = await googleAds.createClientAccount(fullUser.googleAdsRefreshToken, {
          name,
          currencyCode: accountData.currency || 'USD',
          timeZone: accountData.timezone || 'Asia/Kolkata',
        });
        if (result.customerId) {
          account.googleAdsCustomerId = result.customerId;
          account.sourceMccId = result.mccId;
          await account.save();
          try {
            const campResult = await googleAds.createGoogleAdsCampaign(
              result.customerId, name, fullUser.googleAdsRefreshToken, result.mccId, budget
            );
            googleAdsCampaignId = campResult.campaignId;
          } catch (campErr) {
            console.error(`Google Ads campaign failed for ${name}:`, campErr.message);
          }
        }
      } catch (err) {
        console.error(`Google Ads account creation failed for ${name}:`, err.message);
      }
    }

    await Campaign.create({
      campaignName: `${name} - Campaign`,
      account: account._id,
      owner: req.user._id,
      dailyBudget: budget,
      status: 'active',
      country: 'India',
      device: 'all',
      createdBy: req.user._id,
      ...(googleAdsCampaignId && { googleAdsCampaignId }),
    });

    created.push(account);
  }

  await logActivity(req.user._id, 'account_bulk_created', 'account', null, `${num} accounts created`, req.ip);
  res.status(201).json({ success: true, data: created, count: num });
});

exports.updateAccount = asyncHandler(async (req, res) => {
  const account = await Account.findById(req.params.id);
  if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
  if (req.user.role !== 'admin' && account.owner?.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  Object.assign(account, req.body);
  await account.save({ runValidators: true });
  await logActivity(req.user._id, 'account_updated', 'account', account._id, `Account ${account.name} updated`, req.ip);
  res.json({ success: true, data: account });
});

exports.sendInvite = asyncHandler(async (req, res) => {
  const account = await Account.findById(req.params.id);
  if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
  if (req.user.role !== 'admin' && account.owner?.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  const email = req.body?.email || account.inviteEmail;
  if (!email) return res.status(400).json({ success: false, message: 'No invite email set for this account' });
  if (!account.googleAdsCustomerId) {
    return res.status(400).json({ success: false, message: 'Account is not linked to Google Ads yet' });
  }

  // Send with the requester's Google connection; fall back to the account
  // owner's connection (e.g. when an admin triggers the invite).
  let tokenUser = await User.findById(req.user._id).select('+googleAdsRefreshToken');
  if (!tokenUser?.googleAdsRefreshToken && account.owner) {
    tokenUser = await User.findById(account.owner).select('+googleAdsRefreshToken');
  }
  if (!tokenUser?.googleAdsRefreshToken) {
    return res.status(400).json({ success: false, message: 'No connected Google Ads user available to send the invitation' });
  }

  try {
    await googleAds.sendUserAccessInvitation(
      account.googleAdsCustomerId, email, tokenUser.googleAdsRefreshToken, account.sourceMccId
    );
  } catch (err) {
    return res.status(502).json({ success: false, message: `Failed to send invitation: ${err.message}` });
  }

  await logActivity(req.user._id, 'invite_sent', 'account', account._id, `Google Ads invite sent to ${email} for ${account.name}`, req.ip);
  res.json({ success: true, message: `Invitation sent to ${email}` });
});

exports.deleteAccount = asyncHandler(async (req, res) => {
  const account = await Account.findById(req.params.id);
  if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
  if (req.user.role !== 'admin' && account.owner?.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  await Account.findByIdAndDelete(req.params.id);
  await logActivity(req.user._id, 'account_deleted', 'account', account._id, `Account ${account.name} deleted`, req.ip);
  res.json({ success: true, message: 'Account deleted successfully' });
});
