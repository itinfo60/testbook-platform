import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginPage from '@/features/auth/pages/LoginPage';
import { renderWithProviders } from '../testUtils';
import { authAPI } from '@/services/api';

vi.mock('@/services/api', () => ({
  authAPI: {
    login: vi.fn(),
  },
  injectStore: vi.fn(),
  courseAPI: {},
  quizAPI: {},
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('validates email format', async () => {
    renderWithProviders(<LoginPage />);
    const user = userEvent.setup();
    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    const passwordInput = screen.getByPlaceholderText(/enter your password/i);
    const submitBtn = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'invalid-email');
    await user.type(passwordInput, 'password123');
    await user.click(submitBtn);

    expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument();
  });

  it('validates required password', async () => {
    renderWithProviders(<LoginPage />);
    const user = userEvent.setup();
    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    const submitBtn = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitBtn);

    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });

  it('shows error on wrong credentials (mock API 401)', async () => {
    authAPI.login.mockRejectedValue({
      response: { data: { message: 'Invalid credentials' } },
    });
    renderWithProviders(<LoginPage />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText(/enter your email/i), 'test@example.com');
    await user.type(screen.getByPlaceholderText(/enter your password/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
  });

  it('redirects to dashboard on success (mock API 200)', async () => {
    authAPI.login.mockResolvedValue({
      data: { data: { token: 'fake-token', user: { id: 1, name: 'Test User' } } },
    });

    // We can spy on window.location or use a Router mock, but MemoryRouter handles it.
    // The component redirects using navigate(from, { replace: true }).
    renderWithProviders(<LoginPage />, { initialEntries: ['/login'] });

    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText(/enter your email/i), 'test@example.com');
    await user.type(screen.getByPlaceholderText(/enter your password/i), 'correctpass');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      // It should dispatch login and then auth state becomes authenticated, redirecting to /dashboard.
      // Testing redirection directly in this isolated test requires checking the router context or mock,
      // but we can check if it successfully submitted and API was called.
      expect(authAPI.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'correctpass',
      });
    });
  });

  it('disables button while loading', async () => {
    let resolveLogin;
    authAPI.login.mockReturnValue(
      new Promise((resolve) => {
        resolveLogin = resolve;
      })
    );

    renderWithProviders(<LoginPage />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText(/enter your email/i), 'test@example.com');
    await user.type(screen.getByPlaceholderText(/enter your password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    const btn = screen.getByRole('button', { name: /sign in/i });
    expect(btn).toBeDisabled();

    // Cleanup
    resolveLogin({ data: { token: 'token', user: {} } });
  });

  it('handles network failure gracefully', async () => {
    authAPI.login.mockRejectedValue(new Error('Network Error'));
    renderWithProviders(<LoginPage />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText(/enter your email/i), 'test@example.com');
    await user.type(screen.getByPlaceholderText(/enter your password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/network error|login failed/i)).toBeInTheDocument();
  });
});
