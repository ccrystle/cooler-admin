'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  UsersIcon, 
  KeyIcon, 
  BuildingOfficeIcon, 
  ChartBarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  ArrowPathIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import axios from 'axios';
import ThemeSelector from '../components/ThemeSelector';
import DarkModeToggle from '../components/DarkModeToggle';
import Navigation from '../components/Navigation';
import { themes, Theme, getThemeById } from '../utils/themes';

interface DashboardStats {
  totalUsers: number;
  totalOrganizations: number;
  totalApiKeys: number;
  activeUsers: number;
  lastUpdated: string;
}

interface AggregateUsageData {
  dailyUsage: Array<{
    date: string;
    totalRequests: number;
    successCount: number;
    errorCount: number;
    averageResponseTime: number;
  }>;
  endpointDistribution: Array<{
    endpoint: string;
    count: number;
    percentage: number;
  }>;
  customerGrowth: Array<{
    date: string;
    totalCustomers: number;
    newCustomers: number;
  }>;
  performanceMetrics: {
    averageResponseTime: number;
    successRate: number;
    errorRate: number;
    peakHour: string;
    peakRequests: number;
  };
}

interface Customer {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  organizationName: string;
  organizationSlug: string;
  planId: string;
  stripeId: string;
  verifiedEmail: boolean;
  dateCreated: string;
  dateUpdated: string;
  apiKeyCount: number;
  hasApiUsage?: boolean; // Whether they've made actual API calls
  lastActivity?: string; // Last API activity date
}

interface CustomerUsage {
  userId: string;
  period: string;
  totalRequests: number;
  stats: {
    totalRequests: number;
    successCount: number;
    errorCount: number;
    successRate: number;
    averageResponseTime: number;
  };
  endpointStats: Array<{
    endpoint: string;
    count: number;
    successRate: number;
    averageResponseTime: number;
  }>;
  timeSeriesData: Array<{
    timestamp: string;
    count: number;
    successCount: number;
    errorCount: number;
  }>;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Always authenticated
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [aggregateUsage, setAggregateUsage] = useState<AggregateUsageData | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Theme state
  const [selectedTheme, setSelectedTheme] = useState<Theme>(themes[0]);
  
  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sortBy, setSortBy] = useState<'mostRecent' | 'name' | 'organization'>('mostRecent');
  const [datePeriod, setDatePeriod] = useState<'thisYear' | 'lastYear' | 'custom' | 'all'>('thisYear');
  const [showOnlyApiUsers, setShowOnlyApiUsers] = useState<boolean>(false);
  const [showOnlyNonApiUsers, setShowOnlyNonApiUsers] = useState<boolean>(false);
  const [sortField, setSortField] = useState<'dateCreated' | 'lastActivity' | 'organizationName'>('dateCreated');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [apiStatusFilter, setApiStatusFilter] = useState<string>('all');
  
  // Customer detail states
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerUsage, setCustomerUsage] = useState<CustomerUsage | null>(null);
  const [usagePeriod, setUsagePeriod] = useState('30d');
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [customerApiRequests, setCustomerApiRequests] = useState<any[]>([]);
  const [loadingApiRequests, setLoadingApiRequests] = useState(false);
  
  // Sign In As states
  const [signingIn, setSigningIn] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);
  
  // Clear database states
  const [isClearingDatabase, setIsClearingDatabase] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888';

  // Authentication is now bypassed - always authenticated

  const checkCustomerApiUsage = async (userId: string): Promise<boolean> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/customers/${userId}/api-usage`, {
        headers: { 'Authorization': 'Bearer Bearit01!' },
        params: { days: 30 }
      });
      return response.data.totalRequests > 0;
    } catch (error) {
      console.error(`Failed to check API usage for user ${userId}:`, error);
      return false;
    }
  };

  const fetchCustomerApiRequests = async (userId: string) => {
    try {
      setLoadingApiRequests(true);
      const response = await axios.get('/api/api-requests', {
        params: { userId, limit: 50 }
      });
      
      if (response.data.success) {
        setCustomerApiRequests(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch customer API requests:', error);
      setCustomerApiRequests([]);
    } finally {
      setLoadingApiRequests(false);
    }
  };

  const getDateRangeForPeriod = (period: string) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    
    switch (period) {
      case 'thisYear':
        return {
          startDate: new Date(currentYear, 0, 1).toISOString().split('T')[0],
          endDate: now.toISOString().split('T')[0]
        };
      case 'lastYear':
        return {
          startDate: new Date(currentYear - 1, 0, 1).toISOString().split('T')[0],
          endDate: new Date(currentYear - 1, 11, 31).toISOString().split('T')[0]
        };
      case 'custom':
        return { startDate, endDate };
      case 'all':
      default:
        return { startDate: '', endDate: '' };
    }
  };

  const getFilteredCustomers = (allCustomers: Customer[]) => {
    let filtered = allCustomers;
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(customer => 
        customer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.organizationName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by API usage status
    if (showOnlyApiUsers && !showOnlyNonApiUsers) {
      filtered = filtered.filter(customer => customer.hasApiUsage);
    } else if (showOnlyNonApiUsers && !showOnlyApiUsers) {
      filtered = filtered.filter(customer => !customer.hasApiUsage);
    }
    
    // Filter by plan
    if (planFilter !== 'all') {
      filtered = filtered.filter(customer => customer.planId === planFilter);
    }
    
    // Filter by API status
    if (apiStatusFilter !== 'all') {
      switch (apiStatusFilter) {
        case 'active':
          filtered = filtered.filter(customer => customer.hasApiUsage);
          break;
        case 'noUsage':
          filtered = filtered.filter(customer => !customer.hasApiUsage && customer.apiKeyCount > 0);
          break;
        case 'noKeys':
          filtered = filtered.filter(customer => customer.apiKeyCount === 0);
          break;
      }
    }
    
    // Sort the filtered results
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'dateCreated':
          aValue = new Date(a.dateCreated).getTime();
          bValue = new Date(b.dateCreated).getTime();
          break;
        case 'lastActivity':
          aValue = a.lastActivity ? new Date(a.lastActivity).getTime() : 0;
          bValue = b.lastActivity ? new Date(b.lastActivity).getTime() : 0;
          break;
        case 'organizationName':
          aValue = a.organizationName.toLowerCase();
          bValue = b.organizationName.toLowerCase();
          break;
        default:
          return 0;
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  };

  const fetchDashboardData = async (page: number = 1) => {
    try {
      setLoading(true);
      
      // Fetch dashboard stats
      const statsResponse = await axios.get(`${API_BASE_URL}/admin/stats`, {
        headers: { 'Authorization': 'Bearer Bearit01!' }
      });
      setDashboardStats(statsResponse.data);

      // Fetch customers with pagination - default to 100 records per page
      const customersResponse = await axios.get(`${API_BASE_URL}/admin/customers`, {
        headers: { 'Authorization': 'Bearer Bearit01!' },
        params: {
          page,
          limit: pageSize, // Use the pageSize state (default 20, can be changed to 100)
          search: searchTerm || undefined
        }
      });

      const { customers: fetchedCustomers, total, totalPages, hasNextPage, hasPrevPage } = customersResponse.data;
      
      // Check API usage for each customer
      const customersWithUsage = await Promise.all(
        fetchedCustomers.map(async (customer: any) => {
          const hasApiUsage = await checkCustomerApiUsage(customer.userId);
          return {
            ...customer,
            hasApiUsage,
            lastActivity: customer.lastActivity || null
          };
        })
      );

      setCustomers(customersWithUsage);
      setPagination({
        page,
        limit: pageSize,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage
      });
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Don't set mock data - let the UI handle the error gracefully
    } finally {
      setLoading(false);
    }
  };

  const fetchAggregateUsage = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/api-usage`, {
        headers: { 'Authorization': 'Bearer Bearit01!' },
        params: { days: 30 }
      });
      setAggregateUsage(response.data);
    } catch (error) {
      console.error('Failed to fetch aggregate usage:', error);
      // Don't set mock data - let the UI handle the error gracefully
      setAggregateUsage(null);
    }
  };





  const fetchCustomerUsage = async (userId: string, period: string) => {
    try {
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const response = await axios.get(`${API_BASE_URL}/admin/customers/${userId}/api-usage`, {
        headers: { 'Authorization': 'Bearer Bearit01!' },
        params: { days }
      });
      setCustomerUsage(response.data);
    } catch (err) {
      console.error('Failed to fetch customer usage:', err);
      // Don't set mock data - let the UI handle the error gracefully
      setCustomerUsage(null);
    }
  };

  const syncCustomers = async () => {
    try {
      setLoading(true);
      // For now, we'll just refresh the data since the sync endpoint doesn't exist yet
      // In the future, this would call: /admin/sync-customers
      await fetchDashboardData(currentPage);
    } catch (err) {
      console.error('Failed to sync customers');
    } finally {
      setLoading(false);
    }
  };

  const clearDatabase = async () => {
    // Show confirmation dialog
    if (!confirm("⚠️ WARNING: This will permanently delete ALL data from the Cooler API database including:\n\n• VectorDB (all product embeddings)\n• Transactions (all order data)\n• Transaction Items (all line items)\n• Submissions (all footprint calculations)\n• Anomalies (all anomaly detection data)\n• Integrations (all Shopify integrations)\n\nThis action cannot be undone. Are you sure you want to continue?")) {
      return;
    }

    setIsClearingDatabase(true);
    
    try {
      console.log("Clear Database: Calling Cooler Admin backend API...");
      
      const response = await fetch('/api/clear-database', {
        method: 'POST',
        headers: {
          'admin-password': process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123',
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        console.log("Clear Database: Success!", result);
        alert(`✅ ${result.message}\n\nCheck console for detailed results.`);
      } else {
        console.error("Clear Database: Failed:", result);
        alert(`❌ ${result.error || 'Failed to clear database'}\n\nCheck console for details.`);
      }
    } catch (error) {
      console.error("Clear Database: Unexpected error:", error);
      alert("❌ Failed to clear database. Check console for details.");
    } finally {
      setIsClearingDatabase(false);
    }
  };

  const handleCustomerClick = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerDetails(true);
    await Promise.all([
      fetchCustomerUsage(customer.userId, usagePeriod),
      fetchCustomerApiRequests(customer.userId)
    ]);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchDashboardData(1);
  };

  const handlePeriodChange = async (period: string) => {
    setUsagePeriod(period);
    if (selectedCustomer) {
      await fetchCustomerUsage(selectedCustomer.userId, period);
    }
  };

  const handleSignInAs = async (userId: string) => {
    try {
      setSigningIn(true);
      setSignInError(null);

      const response = await axios.post('/api/impersonate', 
        { userId },
        { 
          headers: { 
            'Authorization': 'Bearer Bearit01!' 
          }
        }
      );

      if (response.data.success) {
        // Open magic link in new tab
        window.open(response.data.magicLink, '_blank');
      } else {
        setSignInError(response.data.error || 'Failed to generate magic link');
      }
    } catch (error) {
      console.error('Error generating magic link:', error);
      setSignInError('Failed to generate magic link');
    } finally {
      setSigningIn(false);
    }
  };

  useEffect(() => {
    // Always fetch data since we're always authenticated
    fetchDashboardData();
    fetchAggregateUsage();
  }, []);

  // Update date period when component mounts
  useEffect(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    setStartDate(new Date(currentYear, 0, 1).toISOString().split('T')[0]);
    setEndDate(now.toISOString().split('T')[0]);
  }, []);

  // Login form removed - always authenticated

  if (showCustomerDetails && selectedCustomer) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <button
                  onClick={() => setShowCustomerDetails(false)}
                  className="mr-4 p-2 text-gray-400 hover:text-gray-600"
                >
                  <ArrowPathIcon className="h-5 w-5 transform rotate-180" />
                </button>
                <ChartBarIcon className="h-8 w-8 text-indigo-600 mr-3" />
                <h1 className="text-2xl font-bold text-gray-900">
                  {selectedCustomer.firstName} {selectedCustomer.lastName}
                </h1>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleSignInAs(selectedCustomer.userId)}
                  disabled={signingIn}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-md transition-colors"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4" />
                  <span>{signingIn ? 'Generating...' : 'Sign In As User'}</span>
                </button>
                {signInError && (
                  <p className="text-sm text-red-600">{signInError}</p>
                )}
              </div>
              <button
                onClick={() => setIsAuthenticated(false)}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>

        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-200 ${
          isDarkMode 
            ? `bg-[${selectedTheme.darkMode.background}]`
            : 'bg-gray-50'
        }`}>
          {/* Customer Info */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Details</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Email:</span>
                    <p className="text-sm text-gray-900">{selectedCustomer.email}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Organization:</span>
                    <p className="text-sm text-gray-900">{selectedCustomer.organizationName}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Plan:</span>
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      {selectedCustomer.planId}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">API Usage</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">API Keys:</span>
                    <p className="text-sm text-gray-900">{selectedCustomer.apiKeyCount}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Total Calls:</span>
                    <p className="text-sm text-gray-900">{selectedCustomer.apiKeyCount}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Last Activity:</span>
                    <p className="text-sm text-gray-900">
                      {selectedCustomer.lastActivity 
                        ? new Date(selectedCustomer.lastActivity).toLocaleString()
                        : 'Never'
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Account Status</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Status:</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedCustomer.verifiedEmail 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedCustomer.verifiedEmail ? 'Active' : 'Pending'}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Email Verified:</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedCustomer.verifiedEmail 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedCustomer.verifiedEmail ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Created:</span>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedCustomer.dateCreated).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Usage Analytics */}
          <div className="space-y-8">
            {/* Period Selector */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Usage Analytics</h3>
                <div className="flex space-x-2">
                  {['24h', '7d', '30d', '90d'].map((period) => (
                    <button
                      key={period}
                      onClick={() => handlePeriodChange(period)}
                      className={`px-3 py-1 text-sm rounded-md ${
                        usagePeriod === period
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>

              {/* Usage Content */}
              {customerUsage ? (
                <>
                  {/* Usage Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{customerUsage.totalRequests}</div>
                      <div className="text-sm text-gray-500">Total Requests</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {customerUsage.stats.successRate.toFixed(1)}%
                      </div>
                      <div className="text-sm text-green-500">Success Rate</div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {customerUsage.stats.averageResponseTime.toFixed(0)}ms
                      </div>
                      <div className="text-sm text-blue-500">Avg Response Time</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {customerUsage.endpointStats.length}
                      </div>
                      <div className="text-sm text-purple-500">Endpoints Used</div>
                    </div>
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Time Series Chart */}
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="text-md font-medium text-gray-900 mb-4">Request Volume Over Time</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={customerUsage.timeSeriesData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="timestamp" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Endpoint Usage Chart */}
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="text-md font-medium text-gray-900 mb-4">Endpoint Usage</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={customerUsage.endpointStats}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="endpoint" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#10b981" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <ChartBarIcon className="h-12 w-12 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Usage Data Available</h3>
                  <p className="text-gray-500">
                    This customer hasn't made any API calls yet, or the data is still being collected.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Recent API Requests */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Recent API Requests</h3>
              <Link
                href={`/api-requests?userId=${selectedCustomer.userId}`}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View All →
              </Link>
            </div>
            
            {loadingApiRequests ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading API requests...</p>
              </div>
            ) : customerApiRequests.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Endpoint
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Response Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {customerApiRequests.slice(0, 10).map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(request.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {request.endpoint}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            request.success 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {request.success ? 'Success' : 'Error'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {request.responseTime ? `${request.responseTime}ms` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No recent API requests found</p>
              </div>
            )}
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isDarkMode 
        ? `bg-[${selectedTheme.darkMode.background}] text-[${selectedTheme.darkMode.text}]`
        : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Header */}
      <Navigation
        selectedTheme={selectedTheme}
        onThemeChange={setSelectedTheme}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />

      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-200 ${
        isDarkMode 
          ? `bg-[${selectedTheme.darkMode.background}]`
          : 'bg-gray-50'
      }`}>
        {/* Quick Overview Section */}
        <div className="mb-8">
          <div className={`shadow rounded-lg p-6 transition-colors duration-200 ${
            isDarkMode 
              ? `bg-[${selectedTheme.darkMode.surface}] border border-[${selectedTheme.darkMode.border}]`
              : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-semibold transition-colors duration-200 ${
                isDarkMode 
                  ? `text-[${selectedTheme.darkMode.text}]`
                  : 'text-gray-900'
              }`}>
                Quick Overview
              </h2>
              <div className="flex space-x-2">
                <Link
                  href="/api-requests"
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <EyeIcon className="h-4 w-4 mr-1" />
                  View All Requests
                </Link>
                <Link
                  href="/anomalies"
                  className="text-sm text-orange-600 hover:text-orange-800 flex items-center"
                >
                  <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                  View Issues
                </Link>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Requests */}
              <div className={`p-4 rounded-lg border transition-colors duration-200 ${
                isDarkMode 
                  ? `border-[${selectedTheme.darkMode.border}] bg-[${selectedTheme.darkMode.hover}]`
                  : 'border-gray-200 bg-gray-50'
              }`}>
                <h3 className={`text-lg font-medium mb-3 transition-colors duration-200 ${
                  isDarkMode 
                    ? `text-[${selectedTheme.darkMode.text}]`
                    : 'text-gray-900'
                }`}>
                  Recent Requests (All Accounts)
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className={`text-sm transition-colors duration-200 ${
                      isDarkMode 
                        ? `text-[${selectedTheme.darkMode.textSecondary}]`
                        : 'text-gray-600'
                    }`}>Last 10 requests:</span>
                    <span className={`text-sm font-medium transition-colors duration-200 ${
                      isDarkMode 
                        ? `text-[${selectedTheme.darkMode.text}]`
                        : 'text-gray-900'
                    }`}>85% success rate</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm transition-colors duration-200 ${
                      isDarkMode 
                        ? `text-[${selectedTheme.darkMode.textSecondary}]`
                        : 'text-gray-600'
                    }`}>Avg response time:</span>
                    <span className={`text-sm font-medium transition-colors duration-200 ${
                      isDarkMode 
                        ? `text-[${selectedTheme.darkMode.text}]`
                        : 'text-gray-900'
                    }`}>1,470ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm transition-colors duration-200 ${
                      isDarkMode 
                        ? `text-[${selectedTheme.darkMode.textSecondary}]`
                        : 'text-gray-600'
                    }`}>Primary endpoint:</span>
                    <span className={`text-sm font-medium transition-colors duration-200 ${
                      isDarkMode 
                        ? `text-[${selectedTheme.darkMode.text}]`
                        : 'text-gray-900'
                    }`}>/v2/footprint/products</span>
                  </div>
                </div>
              </div>

              {/* Issue Visibility */}
              <div className={`p-4 rounded-lg border transition-colors duration-200 ${
                isDarkMode 
                  ? `border-[${selectedTheme.darkMode.border}] bg-[${selectedTheme.darkMode.hover}]`
                  : 'border-gray-200 bg-gray-50'
              }`}>
                <h3 className={`text-lg font-medium mb-3 transition-colors duration-200 ${
                  isDarkMode 
                    ? `text-[${selectedTheme.darkMode.text}]`
                    : 'text-gray-900'
                }`}>
                  Current Issues
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className={`text-sm transition-colors duration-200 ${
                      isDarkMode 
                        ? `text-[${selectedTheme.darkMode.textSecondary}]`
                        : 'text-gray-600'
                    }`}>OpenAI API failures:</span>
                    <span className="text-sm font-medium text-red-600">2</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm transition-colors duration-200 ${
                      isDarkMode 
                        ? `text-[${selectedTheme.darkMode.textSecondary}]`
                        : 'text-gray-600'
                    }`}>Database constraints:</span>
                    <span className="text-sm font-medium text-orange-600">3</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm transition-colors duration-200 ${
                      isDarkMode 
                        ? `text-[${selectedTheme.darkMode.textSecondary}]`
                        : 'text-gray-600'
                    }`}>Timeout errors:</span>
                    <span className="text-sm font-medium text-yellow-600">1</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm transition-colors duration-200 ${
                      isDarkMode 
                        ? `text-[${selectedTheme.darkMode.textSecondary}]`
                        : 'text-gray-600'
                    }`}>Missing fields:</span>
                    <span className="text-sm font-medium text-blue-600">5</span>
                  </div>
                </div>
              </div>

              {/* Data Quality */}
              <div className={`p-4 rounded-lg border transition-colors duration-200 ${
                isDarkMode 
                  ? `border-[${selectedTheme.darkMode.border}] bg-[${selectedTheme.darkMode.hover}]`
                  : 'border-gray-200 bg-gray-50'
              }`}>
                <h3 className={`text-lg font-medium mb-3 transition-colors duration-200 ${
                  isDarkMode 
                    ? `text-[${selectedTheme.darkMode.text}]`
                    : 'text-gray-900'
                }`}>
                  Data Quality
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className={`text-sm transition-colors duration-200 ${
                      isDarkMode 
                        ? `text-[${selectedTheme.darkMode.textSecondary}]`
                        : 'text-gray-600'
                    }`}>Low AI confidence:</span>
                    <span className="text-sm font-medium text-red-600">12</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm transition-colors duration-200 ${
                      isDarkMode 
                        ? `text-[${selectedTheme.darkMode.textSecondary}]`
                        : 'text-gray-600'
                    }`}>Default NAICS codes:</span>
                    <span className="text-sm font-medium text-orange-600">8</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm transition-colors duration-200 ${
                      isDarkMode 
                        ? `text-[${selectedTheme.darkMode.textSecondary}]`
                        : 'text-gray-600'
                    }`}>Unusual pricing:</span>
                    <span className="text-sm font-medium text-yellow-600">3</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm transition-colors duration-200 ${
                      isDarkMode 
                        ? `text-[${selectedTheme.darkMode.textSecondary}]`
                        : 'text-gray-600'
                    }`}>Missing descriptions:</span>
                    <span className="text-sm font-medium text-blue-600">7</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className={`overflow-hidden shadow rounded-lg transition-colors duration-200 ${
            isDarkMode 
              ? `bg-[${selectedTheme.darkMode.surface}] border border-[${selectedTheme.darkMode.border}]`
              : 'bg-white'
          }`}>
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UsersIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className={`text-sm font-medium truncate transition-colors duration-200 ${
                      isDarkMode 
                        ? `text-[${selectedTheme.darkMode.textSecondary}]`
                        : 'text-gray-500'
                    }`}>Total Users</dt>
                    <dd className={`text-lg font-medium transition-colors duration-200 ${
                      isDarkMode 
                        ? `text-[${selectedTheme.darkMode.text}]`
                        : 'text-gray-900'
                    }`}>{dashboardStats?.totalUsers || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className={`overflow-hidden shadow rounded-lg transition-colors duration-200 ${
            isDarkMode 
              ? `bg-[${selectedTheme.darkMode.surface}] border border-[${selectedTheme.darkMode.border}]`
              : 'bg-white'
          }`}>
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <KeyIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className={`text-sm font-medium truncate transition-colors duration-200 ${
                      isDarkMode 
                        ? `text-[${selectedTheme.darkMode.textSecondary}]`
                        : 'text-gray-500'
                    }`}>Total API Keys</dt>
                    <dd className={`text-lg font-medium transition-colors duration-200 ${
                      isDarkMode 
                        ? `text-[${selectedTheme.darkMode.text}]`
                        : 'text-gray-900'
                    }`}>{dashboardStats?.totalApiKeys || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className={`overflow-hidden shadow rounded-lg transition-colors duration-200 ${
            isDarkMode 
              ? `bg-[${selectedTheme.darkMode.surface}] border border-[${selectedTheme.darkMode.border}]`
              : 'bg-white'
          }`}>
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BuildingOfficeIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className={`text-sm font-medium truncate transition-colors duration-200 ${
                      isDarkMode 
                        ? `text-[${selectedTheme.darkMode.textSecondary}]`
                        : 'text-gray-500'
                    }`}>Organizations</dt>
                    <dd className={`text-lg font-medium transition-colors duration-200 ${
                      isDarkMode 
                        ? `text-[${selectedTheme.darkMode.text}]`
                        : 'text-gray-900'
                    }`}>{dashboardStats?.totalOrganizations || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className={`overflow-hidden shadow rounded-lg transition-colors duration-200 ${
            isDarkMode 
              ? `bg-[${selectedTheme.darkMode.surface}] border border-[${selectedTheme.darkMode.border}]`
              : 'bg-white'
          }`}>
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className={`text-sm font-medium truncate transition-colors duration-200 ${
                      isDarkMode 
                        ? `text-[${selectedTheme.darkMode.textSecondary}]`
                        : 'text-gray-500'
                    }`}>Active Users</dt>
                    <dd className={`text-lg font-medium transition-colors duration-200 ${
                      isDarkMode 
                        ? `text-[${selectedTheme.darkMode.text}]`
                        : 'text-gray-900'
                    }`}>{dashboardStats?.activeUsers || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Aggregate Analytics Charts */}
        {aggregateUsage && (
          <div className="space-y-8 mb-8">
            {/* Performance Metrics */}
            <div className={`shadow rounded-lg p-6 transition-colors duration-200 ${
              isDarkMode 
                ? `bg-[${selectedTheme.darkMode.surface}] border border-[${selectedTheme.darkMode.border}]`
                : 'bg-white'
            }`}>
              <h3 className={`text-lg font-medium mb-6 transition-colors duration-200 ${
                isDarkMode 
                  ? `text-[${selectedTheme.darkMode.text}]`
                  : 'text-gray-900'
              }`}>Platform Performance Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="p-4 rounded-lg text-center" style={{ backgroundColor: `${selectedTheme.colors.chart1}20` }}>
                  <div className="text-2xl font-bold" style={{ color: selectedTheme.colors.chart1 }}>
                    {aggregateUsage.performanceMetrics.averageResponseTime}ms
                  </div>
                  <div className="text-sm" style={{ color: selectedTheme.colors.chart1 }}>Avg Response Time</div>
                </div>
                <div className="p-4 rounded-lg text-center" style={{ backgroundColor: `${selectedTheme.colors.chart2}20` }}>
                  <div className="text-2xl font-bold" style={{ color: selectedTheme.colors.chart2 }}>
                    {aggregateUsage.performanceMetrics.successRate.toFixed(1)}%
                  </div>
                  <div className="text-sm" style={{ color: selectedTheme.colors.chart2 }}>Success Rate</div>
                </div>
                <div className="p-4 rounded-lg text-center" style={{ backgroundColor: `${selectedTheme.colors.chart3}20` }}>
                  <div className="text-2xl font-bold" style={{ color: selectedTheme.colors.chart3 }}>
                    {aggregateUsage.performanceMetrics.errorRate.toFixed(1)}%
                  </div>
                  <div className="text-sm" style={{ color: selectedTheme.colors.chart3 }}>Error Rate</div>
                </div>
                <div className="p-4 rounded-lg text-center" style={{ backgroundColor: `${selectedTheme.colors.chart4}20` }}>
                  <div className="text-2xl font-bold" style={{ color: selectedTheme.colors.chart4 }}>
                    {aggregateUsage.performanceMetrics.peakHour}
                  </div>
                  <div className="text-sm" style={{ color: selectedTheme.colors.chart4 }}>Peak Hour</div>
                </div>
                <div className="p-4 rounded-lg text-center" style={{ backgroundColor: `${selectedTheme.colors.chart5}20` }}>
                  <div className="text-2xl font-bold" style={{ color: selectedTheme.colors.chart5 }}>
                    {aggregateUsage.performanceMetrics.peakRequests}
                  </div>
                  <div className="text-sm" style={{ color: selectedTheme.colors.chart5 }}>Peak Requests</div>
                </div>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Daily Usage Trend */}
              <div className={`shadow rounded-lg p-6 transition-colors duration-200 ${
                isDarkMode 
                  ? `bg-[${selectedTheme.darkMode.surface}] border border-[${selectedTheme.darkMode.border}]`
                  : 'bg-white'
              }`}>
                <h3 className={`text-lg font-medium mb-4 transition-colors duration-200 ${
                  isDarkMode 
                    ? `text-[${selectedTheme.darkMode.text}]`
                    : 'text-gray-900'
                }`}>Daily API Usage (30 Days)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={aggregateUsage.dailyUsage}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="totalRequests" stackId="1" stroke={selectedTheme.colors.chart1} fill={selectedTheme.colors.chart1} fillOpacity={0.6} />
                    <Area type="monotone" dataKey="successCount" stackId="2" stroke={selectedTheme.colors.chart2} fill={selectedTheme.colors.chart2} fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
                <div className="mt-4 flex justify-center space-x-6 text-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: selectedTheme.colors.chart1 }}></div>
                    <span className={`transition-colors duration-200 ${
                      isDarkMode 
                        ? `text-[${selectedTheme.darkMode.textSecondary}]`
                        : 'text-gray-600'
                    }`}>Total Requests</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: selectedTheme.colors.chart2 }}></div>
                    <span className={`transition-colors duration-200 ${
                      isDarkMode 
                        ? `text-[${selectedTheme.darkMode.textSecondary}]`
                        : 'text-gray-600'
                    }`}>Successful</span>
                  </div>
                </div>
              </div>

              {/* Customer Growth */}
              <div className={`shadow rounded-lg p-6 transition-colors duration-200 ${
                isDarkMode 
                  ? `bg-[${selectedTheme.darkMode.surface}] border border-[${selectedTheme.darkMode.border}]`
                  : 'bg-white'
              }`}>
                <h3 className={`text-lg font-medium mb-4 transition-colors duration-200 ${
                  isDarkMode 
                    ? `text-[${selectedTheme.darkMode.text}]`
                    : 'text-gray-900'
                }`}>Customer Growth (30 Days)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={aggregateUsage.customerGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="totalCustomers" stroke={selectedTheme.colors.chart3} strokeWidth={3} />
                    <Line type="monotone" dataKey="newCustomers" stroke={selectedTheme.colors.chart4} strokeWidth={2} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-4 flex justify-center space-x-6 text-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: selectedTheme.colors.chart3 }}></div>
                    <span className={`transition-colors duration-200 ${
                      isDarkMode 
                        ? `text-[${selectedTheme.darkMode.textSecondary}]`
                        : 'text-gray-600'
                    }`}>Total Customers</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: selectedTheme.colors.chart4 }}></div>
                    <span className={`transition-colors duration-200 ${
                      isDarkMode 
                        ? `text-[${selectedTheme.darkMode.textSecondary}]`
                        : 'text-gray-600'
                    }`}>New Customers</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Endpoint Distribution */}
            <div className={`shadow rounded-lg p-6 transition-colors duration-200 ${
              isDarkMode 
                ? `bg-[${selectedTheme.darkMode.surface}] border border-[${selectedTheme.darkMode.border}]`
                : 'bg-white'
            }`}>
              <h3 className={`text-lg font-medium mb-4 transition-colors duration-200 ${
                isDarkMode 
                  ? `text-[${selectedTheme.darkMode.text}]`
                  : 'text-gray-900'
              }`}>API Endpoint Usage Distribution</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={aggregateUsage.endpointDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name}: ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {aggregateUsage.endpointDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={[
                            selectedTheme.colors.chart1,
                            selectedTheme.colors.chart2,
                            selectedTheme.colors.chart3,
                            selectedTheme.colors.chart4,
                            selectedTheme.colors.chart5
                          ][index % 5]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                                     <div className="space-y-3">
                       {aggregateUsage.endpointDistribution.map((endpoint, index) => (
                         <div key={endpoint.endpoint} className={`flex items-center justify-between p-3 rounded-lg transition-colors duration-200 ${
                           isDarkMode 
                             ? `bg-[${selectedTheme.darkMode.hover}]`
                             : 'bg-gray-50'
                         }`}>
                           <div className="flex items-center">
                             <div 
                               className="w-4 h-4 rounded-full mr-3"
                               style={{ backgroundColor: [
                                 selectedTheme.colors.chart1,
                                 selectedTheme.colors.chart2,
                                 selectedTheme.colors.chart3,
                                 selectedTheme.colors.chart4,
                                 selectedTheme.colors.chart5
                               ][index % 5] }}
                             ></div>
                             <span className={`text-sm font-medium transition-colors duration-200 ${
                               isDarkMode 
                                 ? `text-[${selectedTheme.darkMode.text}]`
                                 : 'text-gray-900'
                             }`}>{endpoint.endpoint}</span>
                           </div>
                           <div className="text-right">
                             <div className={`text-sm font-bold transition-colors duration-200 ${
                               isDarkMode 
                                 ? `text-[${selectedTheme.darkMode.text}]`
                                 : 'text-gray-900'
                             }`}>{endpoint.count}</div>
                             <div className={`text-xs transition-colors duration-200 ${
                               isDarkMode 
                                 ? `text-[${selectedTheme.darkMode.textSecondary}]`
                                 : 'text-gray-500'
                             }`}>{endpoint.percentage}%</div>
                           </div>
                         </div>
                       ))}
                     </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions and Search */}
        <div className={`shadow rounded-lg p-6 mb-8 transition-colors duration-200 ${
          isDarkMode 
            ? `bg-[${selectedTheme.darkMode.surface}] border border-[${selectedTheme.darkMode.border}]`
            : 'bg-white'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex space-x-4">
              <button
                onClick={syncCustomers}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Syncing...' : 'Sync Customers'}
              </button>
              <button
                onClick={clearDatabase}
                disabled={isClearingDatabase}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {isClearingDatabase ? 'Clearing...' : '🗑️ Clear Database'}
              </button>
              {dashboardStats?.lastUpdated && (
                <span className="flex items-center text-sm text-gray-500">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  Last updated: {new Date(dashboardStats.lastUpdated).toLocaleString()}
                </span>
              )}
            </div>

            <div className="flex space-x-4">
              {/* Date Period Selector */}
              <div className="flex items-center space-x-2">
                <label className={`text-sm transition-colors duration-200 ${
                  isDarkMode 
                    ? `text-[${selectedTheme.darkMode.textSecondary}]`
                    : 'text-gray-500'
                }`}>
                  Period:
                </label>
                <select
                  value={datePeriod}
                  onChange={(e) => {
                    setDatePeriod(e.target.value as any);
                    setCurrentPage(1);
                    fetchDashboardData(1);
                  }}
                  className={`text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 ${
                    isDarkMode 
                      ? `bg-[${selectedTheme.darkMode.surface}] text-[${selectedTheme.darkMode.text}] border-[${selectedTheme.darkMode.border}]`
                      : 'bg-white text-gray-900'
                  }`}
                >
                  <option value="thisYear">This Year</option>
                  <option value="lastYear">Last Year</option>
                  <option value="custom">Custom Range</option>
                  <option value="all">All Time</option>
                </select>
              </div>

              {/* Custom Date Range */}
              {datePeriod === 'custom' && (
                <div className="flex items-center space-x-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button
                    onClick={() => {
                      setCurrentPage(1);
                      fetchDashboardData(1);
                    }}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Apply
                  </button>
                </div>
              )}

              {/* Sort By */}
              <div className="flex items-center space-x-2">
                <label className={`text-sm transition-colors duration-200 ${
                  isDarkMode 
                    ? `text-[${selectedTheme.darkMode.textSecondary}]`
                    : 'text-gray-500'
                }`}>
                  Sort by:
                </label>
                <select
                  value={sortField}
                  onChange={(e) => {
                    setSortField(e.target.value as 'dateCreated' | 'lastActivity' | 'organizationName');
                    setCurrentPage(1);
                  }}
                  className={`text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 ${
                    isDarkMode 
                      ? `bg-[${selectedTheme.darkMode.surface}] text-[${selectedTheme.darkMode.text}] border-[${selectedTheme.darkMode.border}]`
                      : 'bg-white text-gray-900'
                  }`}
                >
                  <option value="dateCreated">Date Created</option>
                  <option value="lastActivity">Last Activity</option>
                  <option value="organizationName">Organization</option>
                </select>
                <button
                  onClick={() => {
                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                    setCurrentPage(1);
                  }}
                  className={`p-1 rounded transition-colors duration-200 ${
                    isDarkMode 
                      ? `text-[${selectedTheme.darkMode.textSecondary}] hover:text-[${selectedTheme.darkMode.text}]`
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title={sortDirection === 'asc' ? 'Sort Ascending' : 'Sort Descending'}
                >
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </button>
              </div>

              {/* API Usage Filters */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="hasApiUsage"
                    checked={showOnlyApiUsers}
                    onChange={(e) => setShowOnlyApiUsers(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="hasApiUsage" className={`text-sm transition-colors duration-200 ${
                    isDarkMode 
                      ? `text-[${selectedTheme.darkMode.textSecondary}]`
                      : 'text-gray-700'
                  }`}>
                    Has API Usage
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="noApiUsage"
                    checked={showOnlyNonApiUsers}
                    onChange={(e) => setShowOnlyNonApiUsers(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="noApiUsage" className={`text-sm transition-colors duration-200 ${
                    isDarkMode 
                      ? `text-[${selectedTheme.darkMode.textSecondary}]`
                      : 'text-gray-700'
                  }`}>
                    No API Usage
                  </label>
                </div>
              </div>

              {/* Plan Filter */}
              <div className="flex items-center space-x-2">
                <label className={`text-sm transition-colors duration-200 ${
                  isDarkMode 
                    ? `text-[${selectedTheme.darkMode.textSecondary}]`
                    : 'text-gray-500'
                }`}>
                  Plan:
                </label>
                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                  className={`text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 ${
                    isDarkMode 
                      ? `bg-[${selectedTheme.darkMode.surface}] text-[${selectedTheme.darkMode.text}] border-[${selectedTheme.darkMode.border}]`
                      : 'bg-white text-gray-900'
                  }`}
                >
                  <option value="all">All Plans</option>
                  <option value="api_pro">API Pro</option>
                  <option value="api_enterprise">API Enterprise</option>
                  <option value="api_starter">API Starter</option>
                </select>
              </div>

              {/* API Status Filter */}
              <div className="flex items-center space-x-2">
                <label className={`text-sm transition-colors duration-200 ${
                  isDarkMode 
                    ? `text-[${selectedTheme.darkMode.textSecondary}]`
                    : 'text-gray-500'
                }`}>
                  API Status:
                </label>
                <select
                  value={apiStatusFilter}
                  onChange={(e) => setApiStatusFilter(e.target.value)}
                  className={`text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 ${
                    isDarkMode 
                      ? `bg-[${selectedTheme.darkMode.surface}] text-[${selectedTheme.darkMode.text}] border-[${selectedTheme.darkMode.border}]`
                      : 'bg-white text-gray-900'
                  }`}
                >
                  <option value="all">All Statuses</option>
                  <option value="active">API Active</option>
                  <option value="noUsage">No Usage</option>
                  <option value="noKeys">No API Keys</option>
                </select>
              </div>

              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
              </div>

              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Search
              </button>
              
              {/* Reset Filters */}
              {(showOnlyApiUsers || showOnlyNonApiUsers || searchTerm || planFilter !== 'all' || apiStatusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setShowOnlyApiUsers(false);
                    setShowOnlyNonApiUsers(false);
                    setSearchTerm('');
                    setPlanFilter('all');
                    setApiStatusFilter('all');
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Reset Filters
                </button>
              )}
            </div>
            
            {/* Page Size Selector */}
            <div className="flex items-center space-x-2">
              <label className={`text-sm transition-colors duration-200 ${
                isDarkMode 
                  ? `text-[${selectedTheme.darkMode.textSecondary}]`
                  : 'text-gray-500'
              }`}>
                Show:
              </label>
              <select
                value={pageSize}
                onChange={async (e) => {
                  const newPageSize = Number(e.target.value);
                  console.log(`Changing page size from ${pageSize} to ${newPageSize}`);
                  setPageSize(newPageSize);
                  setCurrentPage(1);
                  try {
                    await fetchDashboardData(1);
                  } catch (error) {
                    console.error('Failed to fetch data with new page size:', error);
                  }
                }}
                className={`text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 ${
                  isDarkMode 
                    ? `bg-[${selectedTheme.darkMode.surface}] text-[${selectedTheme.darkMode.text}] border-[${selectedTheme.darkMode.border}]`
                    : 'bg-white text-gray-900'
                }`}
              >
                <option value={100}>100</option>
                <option value={50}>50</option>
                <option value={20}>20</option>
                <option value={10}>10</option>
              </select>
              <span className={`text-sm transition-colors duration-200 ${
                isDarkMode 
                  ? `text-[${selectedTheme.darkMode.textSecondary}]`
                  : 'text-gray-500'
              }`}>
                per page
              </span>
              
              {/* Go to Page Input */}
              <div className="flex items-center space-x-2">
                <label className={`text-sm transition-colors duration-200 ${
                  isDarkMode 
                    ? `text-[${selectedTheme.darkMode.textSecondary}]`
                    : 'text-gray-500'
                }`}>
                  Go to page:
                </label>
                <input
                  type="number"
                  min="1"
                  max={pagination?.totalPages || 1}
                  value={currentPage}
                  onChange={(e) => {
                    const page = parseInt(e.target.value);
                    if (page >= 1 && page <= (pagination?.totalPages || 1)) {
                      setCurrentPage(page);
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const page = parseInt(e.currentTarget.value);
                      if (page >= 1 && page <= (pagination?.totalPages || 1)) {
                        fetchDashboardData(page);
                      }
                    }
                  }}
                  className={`w-16 text-sm border border-gray-300 rounded-md px-2 py-1 text-center focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 ${
                    isDarkMode 
                      ? `bg-[${selectedTheme.darkMode.surface}] text-[${selectedTheme.darkMode.text}] border-[${selectedTheme.darkMode.border}]`
                      : 'bg-white text-gray-900'
                  }`}
                />
                <span className={`text-sm transition-colors duration-200 ${
                  isDarkMode 
                    ? `text-[${selectedTheme.darkMode.textSecondary}]`
                    : 'text-gray-500'
                }`}>
                  of {pagination?.totalPages || 1}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Customers Table */}
        <div className={`shadow overflow-hidden sm:rounded-md transition-colors duration-200 ${
          isDarkMode 
            ? `bg-[${selectedTheme.darkMode.surface}] border border-[${selectedTheme.darkMode.border}]`
            : 'bg-white'
        }`}>
          <div className="px-4 py-5 sm:px-6">
            <h3 className={`text-lg leading-6 font-medium transition-colors duration-200 ${
              isDarkMode 
                ? `text-[${selectedTheme.darkMode.text}]`
                : 'text-gray-900'
            }`}>API Customers</h3>
            <p className={`mt-1 max-w-2xl text-sm transition-colors duration-200 ${
              isDarkMode 
                ? `text-[${selectedTheme.darkMode.textSecondary}]`
                : 'text-gray-500'
            }`}>
              List of all customers using the Cooler API
            </p>
            {pagination && (
              <p className={`mt-2 text-sm transition-colors duration-200 ${
                isDarkMode 
                  ? `text-[${selectedTheme.darkMode.textSecondary}]`
                  : 'text-gray-600'
              }`}>
                                Showing page {currentPage} of {pagination.totalPages} • Total customers: {pagination.total} • Filtered: {getFilteredCustomers(customers).length}
              </p>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className={`min-w-full divide-y transition-colors duration-200 ${
              isDarkMode 
                ? `divide-[${selectedTheme.darkMode.border}]`
                : 'divide-gray-200'
            }`}>
              <thead className={`transition-colors duration-200 ${
                isDarkMode 
                  ? `bg-[${selectedTheme.darkMode.hover}]`
                  : 'bg-gray-50'
              }`}>
                <tr>
                  <th className={`w-16 px-2 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                    isDarkMode 
                      ? `text-[${selectedTheme.darkMode.textSecondary}]`
                      : 'text-gray-500'
                  }`}>
                    Customer ID
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                    isDarkMode 
                      ? `text-[${selectedTheme.darkMode.textSecondary}]`
                      : 'text-gray-500'
                  }`}>
                    Customer
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 cursor-pointer hover:bg-gray-100 ${
                    isDarkMode 
                      ? `text-[${selectedTheme.darkMode.textSecondary}] hover:bg-[${selectedTheme.darkMode.hover}]`
                      : 'text-gray-500'
                  }`} onClick={() => {
                    setSortField('organizationName');
                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                    setCurrentPage(1);
                  }}>
                    Organization {sortField === 'organizationName' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                    isDarkMode 
                      ? `text-[${selectedTheme.darkMode.textSecondary}]`
                      : 'text-gray-500'
                  }`}>
                    Plan
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                    isDarkMode 
                      ? `text-[${selectedTheme.darkMode.textSecondary}]`
                      : 'text-gray-500'
                  }`}>
                    API Status
                  </th>

                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 cursor-pointer hover:bg-gray-100 ${
                    isDarkMode 
                      ? `text-[${selectedTheme.darkMode.textSecondary}] hover:bg-[${selectedTheme.darkMode.hover}]`
                      : 'text-gray-500'
                  }`} onClick={() => {
                    setSortField('dateCreated');
                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                    setCurrentPage(1);
                  }}>
                    Date Created {sortField === 'dateCreated' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                    isDarkMode 
                      ? `text-[${selectedTheme.darkMode.textSecondary}]`
                      : 'text-gray-500'
                  }`}>
                    Status
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 cursor-pointer hover:bg-gray-100 ${
                    isDarkMode 
                      ? `text-[${selectedTheme.darkMode.textSecondary}] hover:bg-[${selectedTheme.darkMode.hover}]`
                      : 'text-gray-500'
                  }`} onClick={() => {
                    setSortField('lastActivity');
                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                    setCurrentPage(1);
                  }}>
                    Last Activity {sortField === 'lastActivity' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                    isDarkMode 
                      ? `text-[${selectedTheme.darkMode.textSecondary}]`
                      : 'text-gray-500'
                  }`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`transition-colors duration-200 ${
                isDarkMode 
                  ? `bg-[${selectedTheme.darkMode.surface}] divide-[${selectedTheme.darkMode.border}]`
                  : 'bg-white divide-gray-200'
              }`}>
                {getFilteredCustomers(customers).map((customer) => (
                  <tr key={customer.userId} className={`transition-colors duration-200 ${
                    isDarkMode 
                      ? `hover:bg-[${selectedTheme.darkMode.hover}] ${
                          customer.hasApiUsage 
                            ? `bg-[${selectedTheme.darkMode.surface}]` 
                            : 'bg-gray-800'
                        }`
                      : `hover:bg-gray-50 ${
                          customer.hasApiUsage 
                            ? 'bg-white' 
                            : 'bg-gray-100'
                        }`
                  }`}>
                    <td className="w-16 px-2 py-4 whitespace-nowrap">
                      <div className={`text-xs font-mono transition-colors duration-200 truncate ${
                        isDarkMode 
                          ? `text-[${selectedTheme.darkMode.textSecondary}]`
                          : 'text-gray-500'
                      }`} title={customer.userId}>
                        {customer.userId.substring(0, 8)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-indigo-600">
                              {customer.firstName.charAt(0)}{customer.lastName.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className={`text-sm font-medium transition-colors duration-200 ${
                            isDarkMode 
                              ? `text-[${selectedTheme.darkMode.text}]`
                              : 'text-gray-900'
                          }`}>
                            {customer.firstName} {customer.lastName}
                          </div>
                          <div className={`text-sm transition-colors duration-200 ${
                            isDarkMode 
                              ? `text-[${selectedTheme.darkMode.textSecondary}]`
                              : 'text-gray-500'
                          }`}>{customer.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm transition-colors duration-200 ${
                        isDarkMode 
                          ? `text-[${selectedTheme.darkMode.text}]`
                          : 'text-gray-900'
                      }`}>{customer.organizationName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {customer.planId}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {customer.hasApiUsage && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          API Active
                        </span>
                      )}
                      {!customer.hasApiUsage && customer.apiKeyCount > 0 && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          No Usage
                        </span>
                      )}
                      {!customer.hasApiUsage && customer.apiKeyCount === 0 && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                          No API Keys
                        </span>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        customer.verifiedEmail 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {customer.verifiedEmail ? 'Active' : 'Pending'}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm transition-colors duration-200 ${
                      isDarkMode 
                        ? `text-[${selectedTheme.darkMode.textSecondary}]`
                        : 'text-gray-500'
                    }`}>
                      {customer.dateCreated 
                        ? new Date(customer.dateCreated).toLocaleDateString()
                        : 'Never'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        customer.verifiedEmail 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {customer.verifiedEmail ? 'Active' : 'Pending'}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm transition-colors duration-200 ${
                      isDarkMode 
                        ? `text-[${selectedTheme.darkMode.textSecondary}]`
                        : 'text-gray-500'
                    }`}>
                      {customer.lastActivity 
                        ? new Date(customer.lastActivity).toLocaleDateString()
                        : 'Never'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/api-requests?userId=${customer.userId}`}
                        className="text-indigo-600 hover:text-indigo-900 flex items-center"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className={`px-4 py-3 flex items-center justify-between border-t sm:px-6 transition-colors duration-200 ${
              isDarkMode 
                ? `bg-[${selectedTheme.darkMode.surface}] border-[${selectedTheme.darkMode.border}]`
                : 'bg-white border-gray-200'
            }`}>
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => fetchDashboardData(currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md transition-colors duration-200 ${
                    isDarkMode 
                      ? 'border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600 disabled:opacity-50'
                      : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50'
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => fetchDashboardData(currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md transition-colors duration-200 ${
                    isDarkMode 
                      ? 'border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600 disabled:opacity-50'
                      : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50'
                  }`}
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className={`text-sm transition-colors duration-200 ${
                    isDarkMode 
                      ? `text-[${selectedTheme.darkMode.textSecondary}]`
                      : 'text-gray-700'
                  }`}>
                    Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{' '}
                    of <span className="font-medium">{pagination.total}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    {/* First Page Button */}
                    <button
                      onClick={() => fetchDashboardData(1)}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium transition-colors duration-200 ${
                        isDarkMode 
                          ? 'border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600 disabled:opacity-50'
                          : 'border-gray-300 text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50'
                      }`}
                      title="First Page"
                    >
                      «
                    </button>
                    
                    {/* Previous Button */}
                    <button
                      onClick={() => fetchDashboardData(currentPage - 1)}
                      disabled={!pagination.hasPrevPage}
                      className={`relative inline-flex items-center px-2 py-2 border text-sm font-medium transition-colors duration-200 ${
                        isDarkMode 
                          ? 'border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600 disabled:opacity-50'
                          : 'border-gray-300 text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50'
                      }`}
                    >
                      ‹
                    </button>
                    
                    {/* Page Numbers */}
                    {(() => {
                      const pages = [];
                      const totalPages = pagination.totalPages;
                      const current = currentPage;
                      
                      // Show first page
                      if (totalPages > 0) {
                        pages.push(1);
                      }
                      
                      // Show ellipsis if needed
                      if (current > 4) {
                        pages.push('...');
                      }
                      
                      // Show pages around current page
                      for (let i = Math.max(2, current - 1); i <= Math.min(totalPages - 1, current + 1); i++) {
                        if (i > 1 && i < totalPages) {
                          pages.push(i);
                        }
                      }
                      
                      // Show ellipsis if needed
                      if (current < totalPages - 3) {
                        pages.push('...');
                      }
                      
                      // Show last page
                      if (totalPages > 1) {
                        pages.push(totalPages);
                      }
                      
                      return pages.map((page, index) => (
                        <button
                          key={index}
                          onClick={() => typeof page === 'number' ? fetchDashboardData(page) : null}
                          disabled={typeof page !== 'number'}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors duration-200 ${
                            page === currentPage
                              ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                              : typeof page === 'number'
                              ? isDarkMode 
                                ? 'border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600'
                                : 'border-gray-300 text-gray-500 bg-white hover:bg-gray-50'
                              : 'border-gray-300 text-gray-400 bg-gray-100 cursor-default'
                          }`}
                        >
                          {page}
                        </button>
                      ));
                    })()}
                    
                    {/* Next Button */}
                    <button
                      onClick={() => fetchDashboardData(currentPage + 1)}
                      disabled={!pagination.hasNextPage}
                      className={`relative inline-flex items-center px-2 py-2 border text-sm font-medium transition-colors duration-200 ${
                        isDarkMode 
                          ? 'border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600 disabled:opacity-50'
                          : 'border-gray-300 text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50'
                      }`}
                    >
                      ›
                    </button>
                    
                    {/* Last Page Button */}
                    <button
                      onClick={() => fetchDashboardData(pagination.totalPages)}
                      disabled={currentPage === pagination.totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium transition-colors duration-200 ${
                        isDarkMode 
                          ? 'border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600 disabled:opacity-50'
                          : 'border-gray-300 text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50'
                      }`}
                      title="Last Page"
                    >
                      »
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
