import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../helpers/renderWithProviders';
import LoginPage from '@/features/auth/pages/LoginPage';

// Mock the auth slice thunks to avoid real API calls
vi.mock('@/features/auth/authSlice', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    login: Object.assign(
      vi.fn((credentials) => async (dispatch) => {
        const action = { type: 'auth/login/fulfilled', payload: { user: null, token: null } };
        return action;
      }),
      {
        rejected: { match: (action) => action?.type === 'auth/login/rejected' },
        fulfilled: { match: (action) => action?.type === 'auth/login/fulfilled' },
      }
    ),
  };
});

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email and password fields', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument();
  });

  it('renders Sign In button', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows validation error when email is empty on submit', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it('shows validation error when password is empty on submit', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByPlaceholderText(/enter your email/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('renders quick login buttons for Student and Teacher', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByText('Student')).toBeInTheDocument();
    expect(screen.getByText('Teacher')).toBeInTheDocument();
  });

  it('renders link to register page', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByText(/sign up/i)).toBeInTheDocument();
  });

  it('renders forgot password link', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
  });

  it('does not show MFA input by default', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.queryByPlaceholderText(/6-digit code/i)).not.toBeInTheDocument();
  });

  it('fills in student quick login credentials on button click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    const studentBtn = screen.getByText('Student').closest('button');
    await user.click(studentBtn);

    // Email field should be set
    await waitFor(() => {
      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      expect(emailInput.value).toBe('arjun@student.com');
    });
  });
});
