import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/features/auth/authSlice';
import courseReducer from '@/features/course/courseSlice';
import enrollmentReducer from '@/features/enrollment/enrollmentSlice';
import testReducer from '@/features/test/testSlice';
import uiReducer from '@/features/ui/uiSlice';

export function makeStore(preloadedState = {}) {
  return configureStore({
    reducer: {
      auth: authReducer,
      course: courseReducer,
      enrollment: enrollmentReducer,
      test: testReducer,
      ui: uiReducer,
    },
    preloadedState,
  });
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function renderWithProviders(
  ui,
  {
    preloadedState = {},
    store = makeStore(preloadedState),
    initialEntries = ['/'],
    queryClient = createQueryClient(),
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }) {
    return (
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
        </Provider>
      </QueryClientProvider>
    );
  }

  return { store, queryClient, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

export async function renderAndLogin(ui, { user = 'student', ...options } = {}) {
  const tokens = {
    student: 'mock-student-token',
    teacher: 'mock-teacher-token',
    admin: 'mock-admin-token',
  };

  const preloadedState = {
    auth: {
      user: { name: 'Test User', email: `${user}@test.com`, role: user },
      token: tokens[user],
      isAuthenticated: true,
      loading: false,
    },
  };

  return renderWithProviders(ui, { preloadedState, ...options });
}

export async function waitForElement(selector, options = {}) {
  await waitFor(() => {
    expect(screen.querySelector(selector)).toBeInTheDocument();
  }, options);
}

export async function clickAndWait(element) {
  const user = userEvent.setup();
  await user.click(element);
  await waitFor(() => {}, { timeout: 100 });
}

export async function typeAndWait(element, text) {
  const user = userEvent.setup();
  await user.type(element, text);
  await waitFor(() => {}, { timeout: 100 });
}

export function createMockMutationResult(data, error = null) {
  return {
    data,
    error,
    isLoading: false,
    isSuccess: !error,
    isError: !!error,
    reset: vi.fn(),
  };
}

export function createMockQueryResult(data, error = null) {
  return {
    data,
    error,
    isLoading: false,
    isSuccess: !error,
    isError: !!error,
    isFetching: false,
    refetch: vi.fn(),
  };
}

export const testSelectors = {
  getByTestId: (testId) => screen.getByTestId(testId),
  getByRole: (role, options) => screen.getByRole(role, options),
  getByText: (text, options) => screen.getByText(text, options),
  getByPlaceholderText: (text) => screen.getByPlaceholderText(text),
  getByLabelText: (text) => screen.getByLabelText(text),
  queryByTestId: (testId) => screen.queryByTestId(testId),
  queryByRole: (role, options) => screen.queryByRole(role, options),
  queryByText: (text, options) => screen.queryByText(text, options),
  queryByPlaceholderText: (text) => screen.queryByPlaceholderText(text),
  findByTestId: (testId) => screen.findByTestId(testId),
  findByRole: (role, options) => screen.findByRole(role, options),
  findByText: (text, options) => screen.findByText(text, options),
};

export function mockLocalStorage(data = {}) {
  const store = { ...data };
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
  };
}

export function mockSessionStorage(data = {}) {
  const store = { ...data };
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
  };
}

import { vi } from 'vitest';
