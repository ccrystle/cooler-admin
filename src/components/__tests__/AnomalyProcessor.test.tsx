import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axios from 'axios'
import AnomalyProcessor from '../AnomalyProcessor'
import { themes } from '../../utils/themes'

// Mock axios
jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

// Mock theme
const mockTheme = themes[0]

// Mock anomaly data
const mockAnomaly = {
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
  }
}

const mockProps = {
  anomaly: mockAnomaly,
  onResolved: jest.fn(),
  onClose: jest.fn(),
  isDarkMode: false,
  selectedTheme: mockTheme
}

describe('AnomalyProcessor', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders anomaly details correctly', () => {
    render(<AnomalyProcessor {...mockProps} />)
    
    expect(screen.getByText('Process Anomaly')).toBeInTheDocument()
    expect(screen.getByText('DATA QUALITY')).toBeInTheDocument()
    expect(screen.getByText('HIGH')).toBeInTheDocument()
    expect(screen.getByText('Product name is missing or invalid')).toBeInTheDocument()
    expect(screen.getByText('Test Product')).toBeInTheDocument()
    expect(screen.getByText('Test Manufacturer')).toBeInTheDocument()
  })

  it('displays resolution action options', () => {
    render(<AnomalyProcessor {...mockProps} />)
    
    expect(screen.getByLabelText(/Update Product Details/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Update NAICS Code/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Update Price/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Mark as Resolved/)).toBeInTheDocument()
  })

  it('shows form fields when UPDATE_SUBMISSION is selected', async () => {
    const user = userEvent.setup()
    render(<AnomalyProcessor {...mockProps} />)
    
    // First select UPDATE_SUBMISSION (it's not selected by default)
    const updateSubmissionRadio = screen.getByLabelText(/Update Product Details/)
    await user.click(updateSubmissionRadio)
    
    expect(screen.getByLabelText(/Title/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Manufacturer/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Category/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Description/)).toBeInTheDocument()
  })

  it('shows price fields when UPDATE_PRICE is selected', async () => {
    const user = userEvent.setup()
    render(<AnomalyProcessor {...mockProps} />)
    
    const updatePriceRadio = screen.getByLabelText(/Update Price/)
    await user.click(updatePriceRadio)
    
    expect(screen.getByLabelText(/Price/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Currency/)).toBeInTheDocument()
  })

  it('shows NAICS code field when UPDATE_NAICS_CODE is selected', async () => {
    const user = userEvent.setup()
    render(<AnomalyProcessor {...mockProps} />)
    
    const updateNaicsRadio = screen.getByLabelText(/Update NAICS Code/)
    await user.click(updateNaicsRadio)
    
    expect(screen.getByLabelText(/NAICS Code/)).toBeInTheDocument()
  })

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(<AnomalyProcessor {...mockProps} />)
    
    const cancelButton = screen.getByText('Cancel')
    await user.click(cancelButton)
    
    expect(mockProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when X button is clicked', async () => {
    const user = userEvent.setup()
    render(<AnomalyProcessor {...mockProps} />)
    
    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)
    
    expect(mockProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('successfully resolves anomaly with UPDATE_SUBMISSION action', async () => {
    const user = userEvent.setup()
    mockedAxios.post.mockResolvedValueOnce({
      data: { success: true }
    })
    
    render(<AnomalyProcessor {...mockProps} />)
    
    // Select UPDATE_SUBMISSION action
    const updateSubmissionRadio = screen.getByLabelText(/Update Product Details/)
    await user.click(updateSubmissionRadio)
    
    // Fill in resolution notes
    const notesTextarea = screen.getByPlaceholderText(/Add notes about the resolution/)
    await user.type(notesTextarea, 'Fixed product title')
    
    // Click resolve button
    const resolveButton = screen.getByText('Resolve Anomaly')
    await user.click(resolveButton)
    
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:8888/admin/anomalies/anomaly-1/resolve',
        {
          action: 'UPDATE_SUBMISSION',
          notes: 'Fixed product title',
          submissionData: {
            title: 'Test Product',
            manufacturer: 'Test Manufacturer',
            category: 'Electronics',
            description: 'A test product description',
            price: 99.99,
            currency: 'USD',
            naicsCode: '339999'
          }
        },
        {
          headers: { 'Authorization': 'Bearer Bearit01!' }
        }
      )
    })
    
    expect(mockProps.onResolved).toHaveBeenCalledWith('anomaly-1')
    expect(mockProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('successfully resolves anomaly with UPDATE_PRICE action', async () => {
    const user = userEvent.setup()
    mockedAxios.post.mockResolvedValueOnce({
      data: { success: true }
    })
    
    render(<AnomalyProcessor {...mockProps} />)
    
    // Select UPDATE_PRICE action
    const updatePriceRadio = screen.getByLabelText(/Update Price/)
    await user.click(updatePriceRadio)
    
    // Update price
    const priceInput = screen.getByLabelText(/Price/)
    await user.clear(priceInput)
    await user.type(priceInput, '149.99')
    
    // Fill in resolution notes
    const notesTextarea = screen.getByPlaceholderText(/Add notes about the resolution/)
    await user.type(notesTextarea, 'Updated price to correct value')
    
    // Click resolve button
    const resolveButton = screen.getByText('Resolve Anomaly')
    await user.click(resolveButton)
    
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:8888/admin/anomalies/anomaly-1/resolve',
        {
          action: 'UPDATE_PRICE',
          notes: 'Updated price to correct value',
          price: 149.99,
          currency: 'USD'
        },
        {
          headers: { 'Authorization': 'Bearer Bearit01!' }
        }
      )
    })
  })

  it('successfully resolves anomaly with UPDATE_NAICS_CODE action', async () => {
    const user = userEvent.setup()
    mockedAxios.post.mockResolvedValueOnce({
      data: { success: true }
    })
    
    render(<AnomalyProcessor {...mockProps} />)
    
    // Select UPDATE_NAICS_CODE action
    const updateNaicsRadio = screen.getByLabelText(/Update NAICS Code/)
    await user.click(updateNaicsRadio)
    
    // Update NAICS code
    const naicsInput = screen.getByLabelText(/NAICS Code/)
    await user.clear(naicsInput)
    await user.type(naicsInput, '334111')
    
    // Fill in resolution notes
    const notesTextarea = screen.getByPlaceholderText(/Add notes about the resolution/)
    await user.type(notesTextarea, 'Updated to correct NAICS code')
    
    // Click resolve button
    const resolveButton = screen.getByText('Resolve Anomaly')
    await user.click(resolveButton)
    
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:8888/admin/anomalies/anomaly-1/resolve',
        {
          action: 'UPDATE_NAICS_CODE',
          notes: 'Updated to correct NAICS code',
          naicsCode: '334111'
        },
        {
          headers: { 'Authorization': 'Bearer Bearit01!' }
        }
      )
    })
  })

  it('successfully resolves anomaly with MARK_RESOLVED action', async () => {
    const user = userEvent.setup()
    mockedAxios.post.mockResolvedValueOnce({
      data: { success: true }
    })
    
    render(<AnomalyProcessor {...mockProps} />)
    
    // MARK_RESOLVED is selected by default, just add notes
    const notesTextarea = screen.getByPlaceholderText(/Add notes about the resolution/)
    await user.type(notesTextarea, 'Manually reviewed and confirmed as resolved')
    
    // Click resolve button
    const resolveButton = screen.getByText('Resolve Anomaly')
    await user.click(resolveButton)
    
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:8888/admin/anomalies/anomaly-1/resolve',
        {
          action: 'MARK_RESOLVED',
          notes: 'Manually reviewed and confirmed as resolved'
        },
        {
          headers: { 'Authorization': 'Bearer Bearit01!' }
        }
      )
    })
  })

  it('handles API error gracefully', async () => {
    const user = userEvent.setup()
    mockedAxios.post.mockRejectedValueOnce(new Error('API Error'))
    
    // Mock window.alert
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})
    
    render(<AnomalyProcessor {...mockProps} />)
    
    const resolveButton = screen.getByText('Resolve Anomaly')
    await user.click(resolveButton)
    
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to resolve anomaly')
      )
    })
    
    alertSpy.mockRestore()
  })

  it('shows loading state during resolution', async () => {
    const user = userEvent.setup()
    let resolvePromise: Promise<any>
    mockedAxios.post.mockImplementation(() => {
      resolvePromise = new Promise(resolve => setTimeout(resolve, 100))
      return resolvePromise
    })
    
    render(<AnomalyProcessor {...mockProps} />)
    
    const resolveButton = screen.getByText('Resolve Anomaly')
    await user.click(resolveButton)
    
    expect(screen.getByText('Processing...')).toBeInTheDocument()
    expect(resolveButton).toBeDisabled()
    
    await resolvePromise
  })

  it('renders correctly in dark mode', () => {
    render(<AnomalyProcessor {...mockProps} isDarkMode={true} />)
    
    expect(screen.getByText('Process Anomaly')).toBeInTheDocument()
    // Dark mode specific styling would be tested here
  })
})
