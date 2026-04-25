// Finance Guard API Service
// NEW FILE — extend only. Delete to discard the Finance feature entirely.
// No existing service files are modified.

import axios from 'axios';

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const financeApi = axios.create({ baseURL: BASE_URL, timeout: 15000 });

/**
 * Fetches curated list of RBI-verified trusted lenders.
 * @returns {Promise<Array>}
 */
export async function getTrustedLenders() {
  const res = await financeApi.get('/finance/trusted-lenders');
  return res.data.lenders;
}

/**
 * Checks whether a loan app / interest rate is safe.
 * @param {{ app_name?: string, interest_rate?: number, amount?: number, tenure_months?: number }} params
 * @returns {Promise<Object>}
 */
export async function checkLoan(params) {
  const res = await financeApi.post('/finance/check-loan', params);
  return res.data;
}
