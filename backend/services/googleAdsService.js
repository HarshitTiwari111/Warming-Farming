const Setting = require('../models/Setting');

const WORKER_BASE = 'https://secure.dataram.workers.dev/api/v24';
const MCC_ID = '8331500921';

async function getRefreshToken() {
  const setting = await Setting.findOne({ key: 'google_ads_refresh_token' });
  return setting?.value || '';
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
  return MCC_ID;
}

async function fetchClientAccounts(mccId, refreshToken) {
  const query = `SELECT customer_client.id, customer_client.descriptive_name, customer_client.manager, customer_client.status FROM customer_client WHERE customer_client.level <= 1`;
  const rows = await workerQuery(mccId, query, refreshToken);
  return rows
    .filter((r) => r.customerClient && !r.customerClient.manager)
    .map((r) => ({
      customerId: String(r.customerClient.id),
      name: r.customerClient.descriptiveName || '',
      status: r.customerClient.status || 'UNKNOWN',
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
  workerQuery,
  listAccessibleCustomers,
  findMccId,
  fetchClientAccounts,
  fetchCampaigns,
  fetchSearchTerms,
  MCC_ID,
};
