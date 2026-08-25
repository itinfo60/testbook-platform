import { vi, afterEach } from 'vitest';
import dotenv from 'dotenv';

// Load environment variables for tests
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.example' });

// Mock console methods
global.console = {
  ...console,
};

afterEach(async () => {
  vi.clearAllMocks();
});
