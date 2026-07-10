// src/tests/__mocks__/supabase.ts
import { vi } from 'vitest';

export const supabase = {
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user', email: 'test@example.com' } } }),
    signUp: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: { session: { access_token: 'test-token' }, user: { id: 'test-user' } }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null })
  },
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: {}, error: null }),
  insert: vi.fn().mockResolvedValue({ error: null }),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  rpc: vi.fn().mockResolvedValue({ data: { success: true, organization_id: 'org-123' }, error: null })
};

// Mock the supabase library import used in the project
vi.mock('../../src/lib/supabase', () => ({ supabase }));
