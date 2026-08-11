import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../helpers/renderWithProviders';
import LoginPage from '@/features/auth/pages/LoginPage';
import RegisterPage from '@/features/auth/pages/RegisterPage';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/features/auth/authSlice';

vi.mock('@/features/auth/authSlice', () => ({
  login: vi.fn().mockReturnValue({
    type: 'auth/login/fulfilled',
    payload: {
      user: { name: 'Test', email: 'test@test.com', role: 'student' },
      token: 'mock-token',
    },
  }),
  verifyMfaLogin: vi.fn().mockReturnValue({ type: 'auth/verifyMfaLogin/fulfilled', payload: {} }),
  login: {
    rejected: { match: (action) => action?.type === 'auth/login/rejected' },
    fulfilled: { match: (action) => action?.type === 'auth/login/fulfilled' },
  },
  verifyMfaLogin: {
    rejected: { match: (action) => action?.type === 'auth/verifyMfaLogin/rejected' },
  },
}));

describe('LoginPage', () => {
  let mockDispatch;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDispatch = vi.fn().mockResolvedValue({ type: 'auth/login/fulfilled' });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const createTestStore = (preloadedState = {}) => {
    return configureStore({
      reducer: { auth: authReducer },
      preloadedState: {
        auth: {
          isAuthenticated: false,
          user: null,
          token: null,
          loading: false,
          ...preloadedState,
        },
      },
    });
  };

  describe('AUTH-001: Page Load', () => {
    it('renders login page without errors', async () => {
      renderWithProviders(<LoginPage />);
      await waitFor(() => {
        expect(screen.getByText(/Welcome Back/i)).toBeInTheDocument();
      });
    });

    it('renders email and password fields', async () => {
      renderWithProviders(<LoginPage />);
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Enter your email/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Enter your password/i)).toBeInTheDocument();
      });
    });

    it('renders Sign In button', async () => {
      renderWithProviders(<LoginPage />);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
      });
    });

    it('renders Google login button', async () => {
      renderWithProviders(<LoginPage />);
      await waitFor(() => {
        expect(screen.getByRole('link', { name: /Continue with Google/i })).toBeInTheDocument();
      });
    });
  });

  describe('AUTH-002/003: Validation', () => {
    it('shows validation error when email is empty on submit', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LoginPage />);
      await waitFor(() => {
        user.click(screen.getByRole('button', { name: /Sign In/i }));
      });
      await waitFor(() => {
        expect(screen.getByText(/Enter a valid email address/i)).toBeInTheDocument();
      });
    });

    it('shows validation error when password is empty on submit', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LoginPage />);
      await waitFor(() => {
        user.type(screen.getByPlaceholderText(/Enter your email/i), 'test@example.com');
        user.click(screen.getByRole('button', { name: /Sign In/i }));
      });
      await waitFor(() => {
        expect(screen.getByText(/Password is required/i)).toBeInTheDocument();
      });
    });

    it('shows validation error for invalid email format', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LoginPage />);
      await waitFor(() => {
        user.type(screen.getByPlaceholderText(/Enter your email/i), 'invalid-email');
        user.click(screen.getByRole('button', { name: /Sign In/i }));
      });
      await waitFor(() => {
        expect(screen.getByText(/Enter a valid email address/i)).toBeInTheDocument();
      });
    });
  });

  describe('AUTH-004/005/006/007: Quick Login', () => {
    it('renders quick login buttons for Student and Teacher', async () => {
      renderWithProviders(<LoginPage />);
      await waitFor(() => {
        expect(screen.getByText('Student')).toBeInTheDocument();
        expect(screen.getByText('Teacher')).toBeInTheDocument();
      });
    });

    it('fills in student quick login credentials on button click', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LoginPage />);
      await waitFor(() => {
        const studentBtn = screen.getByText('Student').closest('button');
        user.click(studentBtn);
      });
      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText(/Enter your email/i);
        expect(emailInput.value).toBe('arjun@student.com');
      });
    });

    it('fills in teacher quick login credentials on button click', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LoginPage />);
      await waitFor(() => {
        const teacherBtn = screen.getByText('Teacher').closest('button');
        user.click(teacherBtn);
      });
      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText(/Enter your email/i);
        expect(emailInput.value).toBe('teacher@testbook.com');
      });
    });
  });

  describe('AUTH-008: Navigation', () => {
    it('renders link to register page', async () => {
      renderWithProviders(<LoginPage />);
      await waitFor(() => {
        expect(screen.getByRole('link', { name: /Sign up/i })).toBeInTheDocument();
      });
    });

    it('renders forgot password link', async () => {
      renderWithProviders(<LoginPage />);
      await waitFor(() => {
        expect(screen.getByRole('link', { name: /Forgot Password?/i })).toBeInTheDocument();
      });
    });
  });

  describe('AUTH-009: MFA', () => {
    it('does not show MFA input by default', async () => {
      renderWithProviders(<LoginPage />);
      await waitFor(() => {
        expect(screen.queryByPlaceholderText(/6-digit code/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Server Error Handling', () => {
    it('displays server error message', async () => {
      const { login } = await import('@/features/auth/authSlice');
      login.mockReturnValueOnce({ type: 'auth/login/rejected', payload: 'Invalid credentials' });

      const user = userEvent.setup();
      renderWithProviders(<LoginPage />);
      await waitFor(() => {
        user.type(screen.getByPlaceholderText(/Enter your email/i), 'test@example.com');
        user.type(screen.getByPlaceholderText(/Enter your password/i), 'password');
        user.click(screen.getByRole('button', { name: /Sign In/i }));
      });
      await waitFor(() => {
        expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
      });
    });
  });

  describe('Remember Me', () => {
    it('renders remember me checkbox', async () => {
      renderWithProviders(<LoginPage />);
      await waitFor(() => {
        expect(screen.getByRole('checkbox', { name: /Remember me/i })).toBeInTheDocument();
      });
    });
  });
});

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const createTestStore = (preloadedState = {}) => {
    return configureStore({
      reducer: { auth: authReducer },
      preloadedState: {
        auth: {
          isAuthenticated: false,
          user: null,
          token: null,
          loading: false,
          ...preloadedState,
        },
      },
    });
  };

  describe('Registration Form', () => {
    it('renders registration page', async () => {
      renderWithProviders(<RegisterPage />);
      await waitFor(() => {
        expect(screen.getByText(/Create Account/i)).toBeInTheDocument();
      });
    });

    it('renders name, email, password, confirm password fields', async () => {
      renderWithProviders(<RegisterPage />);
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Enter your full name/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Enter your email/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Enter your password/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Confirm your password/i)).toBeInTheDocument();
      });
    });

    it('shows validation error for empty name', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RegisterPage />);
      await waitFor(() => {
        user.click(screen.getByRole('button', { name: /Register/i }));
      });
      await waitFor(() => {
        expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
      });
    });

    it('shows validation error for invalid email', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RegisterPage />);
      await waitFor(() => {
        user.type(screen.getByPlaceholderText(/Enter your full name/i), 'Test User');
        user.type(screen.getByPlaceholderText(/Enter your email/i), 'invalid-email');
        user.click(screen.getByRole('button', { name: /Register/i }));
      });
      await waitFor(() => {
        expect(screen.getByText(/Enter a valid email address/i)).toBeInTheDocument();
      });
    });

    it('shows validation error for short password', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RegisterPage />);
      await waitFor(() => {
        user.type(screen.getByPlaceholderText(/Enter your full name/i), 'Test User');
        user.type(screen.getByPlaceholderText(/Enter your email/i), 'test@example.com');
        user.type(screen.getByPlaceholderText(/Enter your password/i), '123');
        user.click(screen.getByRole('button', { name: /Register/i }));
      });
      await waitFor(() => {
        expect(screen.getByText(/Password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('shows validation error for password mismatch', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RegisterPage />);
      await waitFor(() => {
        user.type(screen.getByPlaceholderText(/Enter your full name/i), 'Test User');
        user.type(screen.getByPlaceholderText(/Enter your email/i), 'test@example.com');
        user.type(screen.getByPlaceholderText(/Enter your password/i), 'Password123!');
        user.type(screen.getByPlaceholderText(/Confirm your password/i), 'DifferentPassword123!');
        user.click(screen.getByRole('button', { name: /Register/i }));
      });
      await waitFor(() => {
        expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
      });
    });

    it('renders role selection (Student/Teacher)', async () => {
      renderWithProviders(<RegisterPage />);
      await waitFor(() => {
        expect(screen.getByRole('radio', { name: /Student/i })).toBeInTheDocument();
        expect(screen.getByRole('radio', { name: /Teacher/i })).toBeInTheDocument();
      });
    });

    it('renders link to login page', async () => {
      renderWithProviders(<RegisterPage />);
      await waitFor(() => {
        expect(screen.getByRole('link', { name: /Sign in/i })).toBeInTheDocument();
      });
    });
  });
});
