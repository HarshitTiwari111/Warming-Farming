const Setting = require('../models/Setting');

const WORKER_BASE = 'https://secure.dataram.workers.dev/api/v24';

// Final URLs for warmup ads — rotated so both domains get used across accounts.
const WARMUP_FINAL_URLS = ['https://www.udemy.com/', 'https://www.etsy.com/'];
function pickWarmupUrl() {
  return WARMUP_FINAL_URLS[Math.floor(Math.random() * WARMUP_FINAL_URLS.length)];
}

async function getRefreshToken() {
  const setting = await Setting.findOne({ key: 'google_ads_refresh_token' });
  return setting?.value || '';
}

async function getMccIds() {
  const setting = await Setting.findOne({ key: 'google_ads_mcc_ids' });
  if (Array.isArray(setting?.value) && setting.value.length > 0) return setting.value;
  return [];
}

async function getMccId() {
  const ids = await getMccIds();
  if (!ids.length) return null;
  return ids[0];
}

async function workerQuery(customerId, query, refreshToken, loginCustomerId) {
  const url = `${WORKER_BASE}/customers/${customerId}/googleAds:search`;
  const headers = {
    'x-user-refresh-token': refreshToken,
    'Content-Type': 'application/json',
  };
  if (loginCustomerId) {
    headers['login-customer-id'] = loginCustomerId;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Worker API ${response.status}: ${text.substring(0, 300)}`);
  }

  const data = await response.json();
  return Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : [];
}

async function workerMutate(customerId, operations, refreshToken, loginCustomerId) {
  const url = `${WORKER_BASE}/customers/${customerId}/googleAds:mutate`;
  const headers = {
    'x-user-refresh-token': refreshToken,
    'Content-Type': 'application/json',
  };
  if (loginCustomerId) headers['login-customer-id'] = loginCustomerId;

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ mutateOperations: operations }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Mutate ${response.status}: ${text.substring(0, 300)}`);
  }

  return response.json();
}

async function createGoogleAdsCampaign(customerId, accountName, refreshToken, mccId) {
  const ts = Date.now();

  const budgetResult = await workerMutate(customerId, [{
    campaignBudgetOperation: {
      create: {
        name: `Budget_${customerId}_${ts}`,
        amountMicros: String(1000000),
        deliveryMethod: 'STANDARD',
        explicitlyShared: false,
      },
    },
  }], refreshToken, mccId);
  const budgetResource = budgetResult.mutateOperationResponses?.[0]?.campaignBudgetResult?.resourceName;
  if (!budgetResource) throw new Error('Failed to create campaign budget');

  const campaignResult = await workerMutate(customerId, [{
    campaignOperation: {
      create: {
        name: `Warmup_${accountName}_${ts}`,
        advertisingChannelType: 'SEARCH',
        status: 'PAUSED',
        campaignBudget: budgetResource,
        manualCpc: {},
        networkSettings: {
          targetGoogleSearch: true,
          targetSearchNetwork: false,
          targetContentNetwork: false,
        },
        containsEuPoliticalAdvertising: 2,
      },
    },
  }], refreshToken, mccId);
  const campaignResource = campaignResult.mutateOperationResponses?.[0]?.campaignResult?.resourceName;
  if (!campaignResource) throw new Error('Failed to create campaign');

  const adGroupResult = await workerMutate(customerId, [{
    adGroupOperation: {
      create: {
        name: 'Ad Group 1',
        campaign: campaignResource,
        type: 'SEARCH_STANDARD',
        cpcBidMicros: String(500000),
        status: 'ENABLED',
      },
    },
  }], refreshToken, mccId);
  const adGroupResource = adGroupResult.mutateOperationResponses?.[0]?.adGroupResult?.resourceName;
  if (!adGroupResource) throw new Error('Failed to create ad group');

  await workerMutate(customerId, [
    { adGroupCriterionOperation: { create: { adGroup: adGroupResource, keyword: { text: 'brand awareness', matchType: 'BROAD' }, status: 'ENABLED' } } },
    { adGroupCriterionOperation: { create: { adGroup: adGroupResource, keyword: { text: 'digital marketing', matchType: 'BROAD' }, status: 'ENABLED' } } },
    { adGroupCriterionOperation: { create: { adGroup: adGroupResource, keyword: { text: 'online advertising', matchType: 'BROAD' }, status: 'ENABLED' } } },
  ], refreshToken, mccId);

  await workerMutate(customerId, [{
    adGroupAdOperation: {
      create: {
        adGroup: adGroupResource,
        ad: {
          responsiveSearchAd: {
            headlines: [
              { text: 'Best Digital Marketing' },
              { text: 'Grow Your Business' },
              { text: 'Online Advertising' },
            ],
            descriptions: [
              { text: 'Reach new customers with targeted ads.' },
              { text: 'Start your campaign today.' },
            ],
          },
          finalUrls: [pickWarmupUrl()],
        },
        status: 'ENABLED',
      },
    },
  }], refreshToken, mccId);

  await workerMutate(customerId, [{
    campaignOperation: {
      update: { resourceName: campaignResource, status: 'ENABLED' },
      updateMask: 'status',
    },
  }], refreshToken, mccId);

  const campaignId = campaignResource.split('/').pop() || '';
  return { campaignId, campaignResource };
}

// Google emails the invitation itself; accepting it grants the address
// access to the account (same flow as inviting from the Google Ads UI).
async function sendUserAccessInvitation(customerId, emailAddress, refreshToken, loginCustomerId) {
  const url = `${WORKER_BASE}/customers/${customerId}/customerUserAccessInvitations:mutate`;
  const headers = {
    'x-user-refresh-token': refreshToken,
    'Content-Type': 'application/json',
  };
  if (loginCustomerId) headers['login-customer-id'] = loginCustomerId;

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      operation: { create: { emailAddress, accessRole: 'ADMIN' } },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Invitation ${response.status}: ${text.substring(0, 300)}`);
  }

  return response.json();
}

async function listAccessibleCustomers(refreshToken) {
  const url = `${WORKER_BASE}/customers:listAccessibleCustomers`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'x-user-refresh-token': refreshToken },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`listAccessibleCustomers ${response.status}: ${text.substring(0, 300)}`);
  }

  const data = await response.json();
  return (data.resourceNames || []).map((rn) => rn.replace('customers/', ''));
}

async function findMccId(refreshToken) {
  const ids = await listAccessibleCustomers(refreshToken);
  for (const id of ids) {
    try {
      const rows = await workerQuery(id, 'SELECT customer.id, customer.manager FROM customer LIMIT 1', refreshToken);
      if (rows[0]?.customer?.manager === true) return id;
    } catch { /* skip */ }
  }
  return null;
}

async function fetchClientAccounts(mccId, refreshToken) {
  const query = `SELECT customer_client.id, customer_client.descriptive_name, customer_client.manager, customer_client.status, customer_client.currency_code, customer_client.time_zone FROM customer_client WHERE customer_client.level <= 1`;
  const rows = await workerQuery(mccId, query, refreshToken, mccId);
  return rows
    .filter((r) => r.customerClient && !r.customerClient.manager)
    .map((r) => ({
      customerId: String(r.customerClient.id),
      name: r.customerClient.descriptiveName || '',
      status: r.customerClient.status || 'UNKNOWN',
      currency: r.customerClient.currencyCode || r.customerClient.currency_code || '',
      timezone: r.customerClient.timeZone || r.customerClient.time_zone || '',
    }));
}

async function fetchCampaigns(customerId, refreshToken, loginCustomerId) {
  const query = `SELECT campaign.id, campaign.name, campaign.status, metrics.cost_micros, metrics.clicks, metrics.impressions, metrics.conversions FROM campaign`;
  const rows = await workerQuery(customerId, query, refreshToken, loginCustomerId);
  return rows.map((r) => ({
    campaignId: String(r.campaign?.id || ''),
    campaignName: r.campaign?.name || 'Unknown',
    status: r.campaign?.status || 'UNKNOWN',
    spend: (r.metrics?.costMicros || r.metrics?.cost_micros || 0) / 1_000_000,
    clicks: Number(r.metrics?.clicks) || 0,
    impressions: Number(r.metrics?.impressions) || 0,
    conversions: Number(r.metrics?.conversions) || 0,
    customerId,
  }));
}

async function findAllMccIds(refreshToken) {
  const ids = await listAccessibleCustomers(refreshToken);
  const mccIds = [];
  for (const id of ids) {
    try {
      const rows = await workerQuery(id, 'SELECT customer.id, customer.manager, customer.status FROM customer LIMIT 1', refreshToken);
      if (rows[0]?.customer?.manager === true) mccIds.push(id);
    } catch { /* skip suspended */ }
  }
  return mccIds;
}

async function createClientAccount(refreshToken, { name, currencyCode, timeZone }) {
  const mccIds = await findAllMccIds(refreshToken);
  if (!mccIds.length) throw new Error('No active MCC found');

  let lastError = null;
  for (const mccId of mccIds) {
    try {
      const url = `${WORKER_BASE}/customers/${mccId}:createCustomerClient`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'x-user-refresh-token': refreshToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: mccId,
          customerClient: {
            descriptiveName: name,
            currencyCode: currencyCode || 'USD',
            timeZone: timeZone || 'Asia/Kolkata',
          },
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        lastError = `MCC ${mccId}: ${response.status} - ${text.substring(0, 200)}`;
        continue;
      }

      const data = await response.json();
      const resourceName = data.resourceName || '';
      const customerId = resourceName.split('/').pop() || '';
      return { customerId, mccId };
    } catch (err) {
      lastError = `MCC ${mccId}: ${err.message}`;
    }
  }

  throw new Error(lastError || 'All MCCs failed to create account');
}

async function fetchSearchTerms(customerId, refreshToken, loginCustomerId) {
  const query = `SELECT search_term_view.search_term, metrics.clicks, metrics.impressions, metrics.cost_micros FROM search_term_view WHERE segments.date DURING LAST_30_DAYS LIMIT 100`;
  const rows = await workerQuery(customerId, query, refreshToken, loginCustomerId);
  return rows.map((r) => ({
    searchTerm: r.searchTermView?.searchTerm || r.search_term_view?.search_term || '',
    clicks: Number(r.metrics?.clicks) || 0,
    impressions: Number(r.metrics?.impressions) || 0,
    spend: (r.metrics?.costMicros || r.metrics?.cost_micros || 0) / 1_000_000,
  }));
}

module.exports = {
  getRefreshToken,
  getMccId,
  getMccIds,
  workerQuery,
  workerMutate,
  listAccessibleCustomers,
  findMccId,
  fetchClientAccounts,
  createClientAccount,
  createGoogleAdsCampaign,
  fetchCampaigns,
  fetchSearchTerms,
  sendUserAccessInvitation,
};
