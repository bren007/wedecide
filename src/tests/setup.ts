// src/tests/setup.ts
// Global test setup for Vitest
import { beforeAll } from 'vitest';

beforeAll(() => {
  // Provide a dummy JWT secret for auth code during tests
  process.env.JWT_SECRET ??= 'dev-secret-key-change-in-production';
});
