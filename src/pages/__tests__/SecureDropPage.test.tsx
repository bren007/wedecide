import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SecureDropPage from '../../pages/SecureDropPage';
import { __mocks } from '../../lib/supabase';



// Mock supabase client
vi.mock('../../lib/supabase', () => {
  const mockUpload = vi.fn();
  const mockFrom = vi.fn(() => ({
    upsert: vi.fn(),
  }));
  const mockStorage = {
    from: vi.fn(() => ({
      upload: mockUpload,
    })),
  };
  return {
    supabase: {
      storage: mockStorage,
      from: mockFrom,
    },
    __mocks: { mockUpload, mockFrom },
  };
});

// Mock Papa parse
  vi.mock('papaparse', () => ({
    default: {
      parse: vi.fn((file, options) => {
        if (options && options.complete) {
          options.complete({
            data: [{
              initiative_name: 'Test Initiative',
              strategic_pillar: 'Policy',
              approval_mandate: 'Cabinet Approved',
              relative_priority: 'Tier 1',
              complexity_stakeholders_1_to_3: '2',
              complexity_novelty_1_to_3: '2',
              complexity_dependency_1_to_3: '2',
              current_fy_budget: '1000',
              lifecycle_stage: 'Planning',
              target_delivery_quarter: 'Q1',
              next_milestone_date: '2023-01-01',
              dependency_blockers: ''
            }],
            errors: [],
            meta: { fields: [
              'initiative_name', 'strategic_pillar', 'approval_mandate', 'relative_priority',
              'complexity_stakeholders_1_to_3', 'complexity_novelty_1_to_3',
              'complexity_dependency_1_to_3', 'current_fy_budget', 'lifecycle_stage',
              'target_delivery_quarter', 'next_milestone_date', 'dependency_blockers'
            ] }
          });
        }
      })
    }
  }));

describe('SecureDropPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('submits valid CSV without errors and shows success UI', async () => {

    __mocks.mockUpload.mockResolvedValue({ data: { path: 'uploads/file.csv' }, error: null });
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    __mocks.mockFrom.mockReturnValue({ upsert: mockUpsert });

    render(<SecureDropPage />);

    const emailInput = screen.getByPlaceholderText(/the email used to purchase your audit/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const csvContent = 'initiative_name,strategic_pillar,approval_mandate,relative_priority,complexity_stakeholders_1_to_3,complexity_novelty_1_to_3,complexity_dependency_1_to_3,current_fy_budget,lifecycle_stage,target_delivery_quarter,next_milestone_date,dependency_blockers\nTest Initiative,Policy,Cabinet Approved,Tier 1,2,2,2,1000,Planning,Q1,2023-01-01,';
    const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

    const fileLabel = screen.getByText(/raw portfolio dataset/i);
    const fileInput = fileLabel.parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    const submitBtn = screen.getByRole('button', { name: /securely transfer data/i });
    fireEvent.click(submitBtn);

    expect(screen.getByTestId('loader')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Data Received & Secured/i)).toBeInTheDocument();
    });

    expect(__mocks.mockUpload).toHaveBeenCalled();
    expect(mockUpsert).toHaveBeenCalledWith(
      {
        email: 'test@example.com',
        file_url: 'uploads/file.csv',
        audit_status: 'data_uploaded',
      },
      { onConflict: 'email' }
    );
  });
});
