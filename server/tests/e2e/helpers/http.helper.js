import request from 'supertest';
import { DEFAULT_TENANT_ID } from './auth.helper.js';

/**
 * Creates an HTTP request helper instance wrapping supertest
 */
export function createRequester(app) {
  return {
    async get(url, headers = {}) {
      const req = request(app).get(url);
      if (!headers['X-Tenant-Id'] && !headers['x-tenant-id'] && headers['X-Tenant-Id'] !== null) {
        req.set('X-Tenant-Id', DEFAULT_TENANT_ID);
      }
      for (const [key, value] of Object.entries(headers)) {
        if (value !== null && value !== undefined) {
          req.set(key, value);
        }
      }
      return req;
    },

    async post(url, body = {}, headers = {}) {
      const req = request(app).post(url);
      if (!headers['X-Tenant-Id'] && !headers['x-tenant-id'] && headers['X-Tenant-Id'] !== null) {
        req.set('X-Tenant-Id', DEFAULT_TENANT_ID);
      }
      for (const [key, value] of Object.entries(headers)) {
        if (value !== null && value !== undefined) {
          req.set(key, value);
        }
      }
      return req.send(body);
    },

    async put(url, body = {}, headers = {}) {
      const req = request(app).put(url);
      if (!headers['X-Tenant-Id'] && !headers['x-tenant-id'] && headers['X-Tenant-Id'] !== null) {
        req.set('X-Tenant-Id', DEFAULT_TENANT_ID);
      }
      for (const [key, value] of Object.entries(headers)) {
        if (value !== null && value !== undefined) {
          req.set(key, value);
        }
      }
      return req.send(body);
    },

    async patch(url, body = {}, headers = {}) {
      const req = request(app).patch(url);
      if (!headers['X-Tenant-Id'] && !headers['x-tenant-id'] && headers['X-Tenant-Id'] !== null) {
        req.set('X-Tenant-Id', DEFAULT_TENANT_ID);
      }
      for (const [key, value] of Object.entries(headers)) {
        if (value !== null && value !== undefined) {
          req.set(key, value);
        }
      }
      return req.send(body);
    },

    async delete(url, headers = {}) {
      const req = request(app).delete(url);
      if (!headers['X-Tenant-Id'] && !headers['x-tenant-id'] && headers['X-Tenant-Id'] !== null) {
        req.set('X-Tenant-Id', DEFAULT_TENANT_ID);
      }
      for (const [key, value] of Object.entries(headers)) {
        if (value !== null && value !== undefined) {
          req.set(key, value);
        }
      }
      return req;
    },
  };
}
