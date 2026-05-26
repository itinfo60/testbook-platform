import { AsyncLocalStorage } from 'async_hooks';

export interface TenantStore {
  tenantId: string | null;
  bypass: boolean;
}

const tenantStorage = new AsyncLocalStorage<TenantStore>();

export const runWithTenant = <T>(
  tenantId: string | null,
  bypass = false,
  callback: () => T | Promise<T>
): T | Promise<T> => {
  return tenantStorage.run({ tenantId, bypass }, callback);
};

export const getTenantId = (): string | null => {
  const store = tenantStorage.getStore();
  return store ? store.tenantId : null;
};

export const isBypassTenant = (): boolean => {
  const store = tenantStorage.getStore();
  return store ? store.bypass : false;
};
