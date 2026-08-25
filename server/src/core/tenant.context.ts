import { AsyncLocalStorage } from 'node:async_hooks';

export interface TenantStore {
  tenantId: string | null;
  bypass: boolean;
}

const tenantStorage = new AsyncLocalStorage<TenantStore>();

/**
 * Runs a function within the scope of a tenant context.
 *
 * @param tenantId The active tenant/institute ID or null.
 * @param bypass Whether tenant filtering should be bypassed (e.g. for super admin or global lookups).
 * @param callback The function to execute within the context.
 */
export const runWithTenant = <T>(
  tenantId: string | null,
  bypass = false,
  callback: () => T | Promise<T>
): T | Promise<T> => {
  return tenantStorage.run({ tenantId, bypass }, callback);
};

/**
 * Returns the currently active tenant ID from AsyncLocalStorage, or null if none is bound.
 */
export const getTenantId = (): string | null => {
  const store = tenantStorage.getStore();
  return store ? store.tenantId : null;
};

/**
 * Returns true if the current execution context explicitly bypasses tenant filtering.
 */
export const isBypassTenant = (): boolean => {
  const store = tenantStorage.getStore();
  return store ? store.bypass : false;
};

/**
 * Returns the active tenant store, or undefined if no context is active.
 */
export const getTenantStore = (): TenantStore | undefined => {
  return tenantStorage.getStore();
};
