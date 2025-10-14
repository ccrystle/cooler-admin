import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { themes } from '../../utils/themes'

// Mock theme provider
const MockThemeProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <div data-testid="theme-provider">
      {children}
    </div>
  )
}

// Custom render function that includes providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: MockThemeProvider, ...options })

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Test data factories
export const createMockAnomaly = (overrides = {}) => ({
  id: 'anomaly-1',
  submissionId: 'submission-1',
  type: 'DATA_QUALITY' as const,
  code: 'MISSING_PRODUCT_NAME',
  severity: 'HIGH' as const,
  description: 'Product name is missing or invalid',
  metadata: { field: 'title', value: '' },
  dateCreated: '2024-01-01T00:00:00Z',
  resolved: false,
  submission: {
    id: 'submission-1',
    title: 'Test Product',
    manufacturer: 'Test Manufacturer',
    category: 'Electronics',
    description: 'A test product description',
    price: 99.99,
    currency: 'USD',
    naicsCode: '339999'
  },
  ...overrides
})

export const createMockCustomer = (overrides = {}) => ({
  userId: 'user-1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  organizationName: 'Test Organization',
  organizationSlug: 'test-org',
  planId: 'api_pro',
  stripeId: 'stripe-123',
  verifiedEmail: true,
  dateCreated: '2024-01-01T00:00:00Z',
  dateUpdated: '2024-01-01T00:00:00Z',
  apiKeyCount: 2,
  hasApiUsage: true,
  lastActivity: '2024-01-15T00:00:00Z',
  ...overrides
})

export const createMockDashboardStats = (overrides = {}) => ({
  totalUsers: 100,
  totalOrganizations: 50,
  totalApiKeys: 200,
  activeUsers: 75,
  lastUpdated: '2024-01-15T00:00:00Z',
  ...overrides
})

// Mock theme
export const mockTheme = themes[0]

// Common test utilities
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0))

export const mockConsoleError = () => {
  const originalError = console.error
  const mockError = jest.fn()
  console.error = mockError
  return {
    mockError,
    restore: () => {
      console.error = originalError
    }
  }
}

export const mockConsoleLog = () => {
  const originalLog = console.log
  const mockLog = jest.fn()
  console.log = mockLog
  return {
    mockLog,
    restore: () => {
      console.log = originalLog
    }
  }
}
