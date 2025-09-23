import type { Objective } from './types';

// In a real application, this would be a database.
// For this demo, we're using a mutable in-memory array.
export const strategicGoals: Objective[] = [
  { id: 'OBJ-001', name: 'Improve Public Service Delivery', description: 'Enhance the efficiency, accessibility, and quality of services provided to the public.' },
  { id: 'OBJ-002', name: 'Enhance Public Trust and Transparency', description: 'Increase transparency in government operations and build greater public trust.' },
  { id: 'OBJ-003', name: 'Foster Sustainable Economic Development', description: 'Promote economic growth that is socially inclusive and environmentally sustainable.' },
  { id: 'OBJ-004', name: 'Strengthen International Cooperation', description: 'Enhance collaboration with international partners to address global challenges.' },
];

// This is a mock function to simulate fetching data from an external source like a spreadsheet.
// In a real implementation, this would be a Firebase Cloud Function making a call to the Sheets API.
export async function getMockSpreadsheetData() {
    return {
        financials: {
            year: 2024,
            budget: 5000000,
            spend: 1200000,
        },
        kpis: [
            { name: 'User Satisfaction', value: '85%', trend: 'up' },
            { name: 'Service Uptime', value: '99.98%', trend: 'up' },
        ]
    }
}

// This is a mock function to simulate fetching data from another internal database.
export async function getMockDatabaseData() {
    return {
        project: {
            id: 'PROJ-123',
            name: 'Digital Services Portal',
            status: 'Active',
            manager: 'Alice Johnson'
        }
    }
}

// This is a mock function to simulate fetching data from a public API.
export async function getMockPublicAPIData() {
    return {
        region: {
            name: 'Aotearoa New Zealand',
            population: 5123000,
            gdp_per_capita: 48843, // USD
        }
    }
}
