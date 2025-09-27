import type { Objective } from './types';

// In a real application, this would be a database.
// For this demo, we're using a mutable in-memory array.
export const strategicGoals: Objective[] = [
  { id: 'OBJ-001', name: 'Improve Citizen Service Score by 15%', description: 'Enhance the efficiency, accessibility, and quality of services provided to the public.' },
  { id: 'OBJ-002', name: 'Reduce Carbon Footprint by 20%', description: 'Decrease organizational carbon emissions through sustainable practices and technology.' },
  { id: 'OBJ-003', name: 'Foster Sustainable Economic Development', description: 'Promote economic growth that is socially inclusive and environmentally sustainable.' },
  { id: 'OBJ-004', name: 'Strengthen International Cooperation', description: 'Enhance collaboration with international partners to address global challenges.' },
];
