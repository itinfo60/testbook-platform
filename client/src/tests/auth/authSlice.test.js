import { describe, it, expect } from 'vitest';
import authReducer, { logout, setCredentials } from '@/features/auth/authSlice';

// authSlice uses `loading` (not `isLoading`) and initializes from localStorage
const blankState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  message: null,
  initialized: true,
};

describe('authSlice reducer', () => {
  it('returns initial state shape', () => {
    const state = authReducer(blankState, { type: '@@INIT' });
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.loading).toBe(false);
  });

  it('sets loading=true and clears error when login is pending', () => {
    const action = { type: 'auth/login/pending' };
    const state = authReducer(blankState, action);
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('sets credentials and isAuthenticated=true on login fulfilled', () => {
    const action = {
      type: 'auth/login/fulfilled',
      payload: {
        user: { _id: '123', name: 'Alice', role: 'student' },
        token: 'abc.token.xyz',
        accessToken: 'abc.token.xyz',
        refreshToken: 'refresh.xyz',
      },
    };
    const state = authReducer(blankState, action);
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.name).toBe('Alice');
    expect(state.token).toBe('abc.token.xyz');
    expect(state.loading).toBe(false);
  });

  it('sets error on login rejected', () => {
    const action = {
      type: 'auth/login/rejected',
      payload: 'Invalid email or password',
    };
    const state = authReducer(blankState, action);
    expect(state.isAuthenticated).toBe(false);
    expect(state.error).toBe('Invalid email or password');
    expect(state.loading).toBe(false);
  });

  it('clears all auth state on logout', () => {
    const loggedInState = {
      ...blankState,
      isAuthenticated: true,
      user: { _id: '123', name: 'Alice' },
      token: 'some.token',
    };
    const state = authReducer(loggedInState, logout());
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.error).toBeNull();
  });

  it('setCredentials updates token and marks authenticated', () => {
    const state = authReducer(
      blankState,
      setCredentials({
        token: 'new.token',
        user: { _id: '456', name: 'Bob' },
      })
    );
    expect(state.isAuthenticated).toBe(true);
    expect(state.token).toBe('new.token');
    expect(state.user?.name).toBe('Bob');
  });
});
