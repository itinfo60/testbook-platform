import { AsyncLocalStorage } from 'async_hooks';

const tenantStorage = new AsyncLocalStorage();

/**
 * Run a callback function within a specific tenant context.
 * @param {string|null} tenantId - The active tenant's database ID.
 * @param {boolean} bypass - Whether to bypass tenant query filtering.
 * @param {Function} callback - The function to execute.
 * @returns {*} The return value of the callback.
 */
export const runWithTenant = (tenantId, bypass = false, callback) => {
  return tenantStorage.run({ tenantId, bypass }, callback);
};

/**
 * Retrieve the active tenant ID from the current context.
 * @returns {string|null} The tenant ID or null if not set.
 */
export const getTenantId = () => {
  const store = tenantStorage.getStore();
  return store ? store.tenantId : null;
};

/**
 * Check if the tenant query filter should be bypassed.
 * @returns {boolean} True if bypassing tenant filters, false otherwise.
 */
export const isBypassTenant = () => {
  const store = tenantStorage.getStore();
  return store ? store.bypass : false;
};
