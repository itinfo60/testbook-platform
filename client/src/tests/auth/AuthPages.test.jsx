import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../helpers/renderWithProviders';
import LoginPage from '@/features/auth/pages/LoginPage';
import RegisterPage from '@/features/auth/pages/RegisterPage';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/features/auth/authSlice';

vi.mock('@/features/auth/authSlice', () => {
  const loginFn = vi.fn().mockImplementation(() => ({
    type: 'auth/login/fulfilled',
    payload: {
      user: { name: 'Test', email: 'test@test.com', role: 'student' },
      token: 'mock-token',
    },
  }));
  loginFn.rejected = { match: (action) => action?.type === 'auth/login/rejected' };
  loginFn.fulfilled = { match: (action) => action?.type === 'auth/login/fulfilled' };

  const verifyMfaLoginFn = vi
    .fn()
    .mockImplementation(() => ({ type: 'auth/verifyMfaLogin/fulfilled', payload: {} }));
  verifyMfaLoginFn.rejected = {
    match: (action) => action?.type === 'auth/verifyMfaLogin/rejected',
  };

  const registerFn = vi.fn().mockImplementation(() => ({
    type: 'auth/register/fulfilled',
    payload: {
      user: { name: 'Test', email: 'test@test.com', role: 'student' },
      token: 'mock-token',
    },
  }));
  registerFn.rejected = { match: (action) => action?.type === 'auth/register/rejected' };
  registerFn.fulfilled = { match: (action) => action?.type === 'auth/register/fulfilled' };

  const reducer = (
    state = { isAuthenticated: false, user: null, token: null, loading: false },
    action
  ) => {
    switch (action.type) {
      case 'auth/login/fulfilled':
        return {
          ...state,
          isAuthenticated: true,
          user: action.payload.user,
          token: action.payload.token,
          loading: false,
        };
      case 'auth/login/rejected':
        return { ...state, loading: false, error: action.payload };
      case 'auth/register/fulfilled':
        return {
          ...state,
          isAuthenticated: true,
          user: action.payload.user,
          token: action.payload.token,
          loading: false,
        };
      case 'auth/register/rejected':
        return { ...state, loading: false, error: action.payload };
      default:
        return state;
    }
  };

  return {
    __esModule: true,
    default: reducer,
    login: loginFn,
    verifyMfaLogin: verifyMfaLoginFn,
    register: registerFn,
  };
});

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // preserve mock implementations
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
        expect(emailInput.value).toBe('teacher@civicshub.com');
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
    it('handles server errors gracefully', async () => {
      const { login } = await import('@/features/auth/authSlice');
      login.mockImplementationOnce(() => ({
        type: 'auth/login/rejected',
        payload: 'Invalid credentials',
      }));

      const user = userEvent.setup();
      renderWithProviders(<LoginPage />);
      await waitFor(() => {
        user.type(screen.getByPlaceholderText(/Enter your email/i), 'test@example.com');
        user.type(screen.getByPlaceholderText(/Enter your password/i), 'password');
        user.click(screen.getByRole('button', { name: /Sign In/i }));
      });
      // Just verify the component doesn't crash
      await waitFor(() => {
        expect(screen.getByText(/Welcome Back/i)).toBeInTheDocument();
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
    // preserve mock implementations
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
        // "Create Account" appears twice (h1 and button) - use getAllByText
        const createAccountElements = screen.getAllByText(/Create Account/i);
        expect(createAccountElements.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('renders name, email, password, confirm password fields', async () => {
      renderWithProviders(<RegisterPage />);
      await waitFor(() => {
        // Use actual placeholder texts from the component
        expect(screen.getByPlaceholderText(/John Doe/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/john@example\.com/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Min 8 characters/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Repeat password/i)).toBeInTheDocument();
      });
    });

    it('renders role selection (Student/Teacher/Parent)', async () => {
      renderWithProviders(<RegisterPage />);
      await waitFor(() => {
        // Role selection uses buttons with labels "Learn", "Teach", "Monitor"
        const learnBtn = screen.getByRole('button', { name: /Learn/i });
        const teachBtn = screen.getByRole('button', { name: /Teach/i });
        const monitorBtn = screen.getByRole('button', { name: /Monitor/i });
        expect(learnBtn).toBeInTheDocument();
        expect(teachBtn).toBeInTheDocument();
        expect(monitorBtn).toBeInTheDocument();
      });
    });

    it('renders link to login page', async () => {
      renderWithProviders(<RegisterPage />);
      await waitFor(() => {
        expect(screen.getByRole('link', { name: /Sign in/i })).toBeInTheDocument();
      });
    });

    it('renders Google signup button', async () => {
      renderWithProviders(<RegisterPage />);
      await waitFor(() => {
        expect(screen.getByRole('link', { name: /Sign up with Google/i })).toBeInTheDocument();
      });
    });

    it('renders password strength indicator when typing', async () => {
      const user = userEvent.setup();
      renderWithProviders(<RegisterPage />);
      await waitFor(() => {
        const passwordInput = screen.getByPlaceholderText(/Min 8 characters/i);
        user.type(passwordInput, 'Test123!');
      });
      await waitFor(() => {
        // Password strength indicator appears after typing
        expect(screen.getByText(/Password strength:/i)).toBeInTheDocument();
      });
    });
  });
});
