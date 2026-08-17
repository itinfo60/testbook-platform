import { describe, it, expect, vi } from 'vitest';
import authReducer, { login, register, verifyMfaLogin, logout } from '@/features/auth/authSlice';
import { authAPI } from '@/services/api';

vi.mock('@/services/api', () => ({
  authAPI: {
    login: vi.fn(),
    register: vi.fn(),
    verifyMfaLogin: vi.fn(),
  },
}));

describe('authSlice', () => {
  const initialState = {
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  };

  it('login action sets user and token', async () => {
    const mockUser = { id: 1, name: 'Test' };
    const mockToken = 'abc';
    const action = {
      type: login.fulfilled.type,
      payload: { user: mockUser, token: mockToken, refreshToken: 'def' },
    };

    const state = authReducer(initialState, action);

    expect(state.user).toEqual(mockUser);
    expect(state.token).toEqual(mockToken);
    expect(state.isAuthenticated).toBe(true);
  });

  it('logout action clears state', () => {
    const loggedInState = {
      ...initialState,
      user: { id: 1 },
      token: 'abc',
      isAuthenticated: true,
    };

    const action = { type: logout.type };
    const state = authReducer(loggedInState, action);

    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});
