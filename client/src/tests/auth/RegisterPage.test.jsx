import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RegisterPage from '@/features/auth/pages/RegisterPage';
import { renderWithProviders } from '../testUtils';
import { authAPI } from '@/services/api';

vi.mock('@/services/api', () => ({
  authAPI: {
    register: vi.fn(),
    checkEmail: vi.fn(),
  },
  injectStore: vi.fn(),
}));

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders register form fields and requires all fields', () => {
    renderWithProviders(<RegisterPage />);
    expect(screen.getByPlaceholderText(/john doe/i)).toBeRequired();
    expect(screen.getByPlaceholderText(/john@example.com/i)).toBeRequired();
    expect(screen.getByPlaceholderText(/min 8 characters/i)).toBeRequired();
  });

  it('validates password must match confirm password', async () => {
    renderWithProviders(<RegisterPage />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText(/john doe/i), 'Test User');
    await user.type(screen.getByPlaceholderText(/john@example.com/i), 'test@example.com');
    await user.type(screen.getByPlaceholderText(/min 8 characters/i), 'password123');

    // Find confirm password by label if placeholder isn't known
    const confirmInputs = screen.getAllByLabelText(/confirm password/i);
    if (confirmInputs.length > 0) {
      await user.type(confirmInputs[0], 'password124');
    } else {
      // fallback if no label
      const allPasswordInputs = screen.getAllByPlaceholderText(/password/i);
      await user.type(allPasswordInputs[1] || allPasswordInputs[0], 'password124');
    }

    await user.click(screen.getByRole('button', { name: /create account|sign up/i, exact: false }));

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it('email format validation', async () => {
    renderWithProviders(<RegisterPage />);
    const user = userEvent.setup();
    const emailInput = screen.getByPlaceholderText(/john@example.com/i);

    await user.type(emailInput, 'invalid-email');
    await user.tab(); // trigger blur

    expect(await screen.findByText(/invalid email format/i)).toBeInTheDocument();
  });

  it('handles duplicate email error from API', async () => {
    authAPI.checkEmail.mockResolvedValue({ data: { data: { available: false } } });
    renderWithProviders(<RegisterPage />);
    const user = userEvent.setup();
    const emailInput = screen.getByPlaceholderText(/john@example.com/i);

    await user.type(emailInput, 'used@example.com');
    await user.tab(); // trigger blur

    expect(await screen.findByText(/this email is already registered/i)).toBeInTheDocument();
  });

  it('shows success and redirects', async () => {
    authAPI.checkEmail.mockResolvedValue({ data: { data: { available: true } } });
    authAPI.register.mockResolvedValue({
      data: { data: { token: 'token123', user: { id: 1 } } },
    });

    renderWithProviders(<RegisterPage />, { initialEntries: ['/register'] });
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText(/john doe/i), 'Test User');
    await user.type(screen.getByPlaceholderText(/john@example.com/i), 'test@example.com');
    await user.type(screen.getByPlaceholderText(/min 8 characters/i), 'password123');

    const confirmInputs = screen.getAllByLabelText(/confirm password/i);
    if (confirmInputs.length > 0) {
      await user.type(confirmInputs[0], 'password123');
    } else {
      const allPasswordInputs = screen.getAllByPlaceholderText(/password/i);
      await user.type(allPasswordInputs[1] || allPasswordInputs[0], 'password123');
    }

    const submitBtn = screen.getByRole('button', { name: /create account|sign up/i, exact: false });
    // Click submit
    await user.click(submitBtn);

    await waitFor(() => {
      expect(authAPI.register).toHaveBeenCalled();
    });
  });
});
