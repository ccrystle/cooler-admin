'use client';

import { useState, useEffect } from 'react';
import { 
  LockClosedIcon, 
  UsersIcon, 
  KeyIcon, 
  BuildingOfficeIcon, 
  ChartBarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  ArrowPathIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import axios from 'axios';
import ThemeSelector from '../components/ThemeSelector';
import DarkModeToggle from '../components/DarkModeToggle';
import { themes, Theme, getThemeById } from '../utils/themes';

interface DashboardStats {
  totalCustomers: number;
  activeCustomers: number;
  totalApiKeys: number;
  totalOrganizations: number;
  apiCallsLast24h: number;
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
  _id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  organizationName: string;
  organizationSlug: string;
  planId: string;
  stripeId: string;
  verifiedEmail: boolean;
  status: string;
  dateCreated: string;
  apiKeyCount: number;
  totalApiCalls: number;
  lastApiCall?: string;
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [aggregateUsage, setAggregateUsage] = useState<AggregateUsageData | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Theme state
  const [selectedTheme, setSelectedTheme] = useState<Theme>(themes[0]);
  
  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Customer detail states
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerUsage, setCustomerUsage] = useState<CustomerUsage | null>(null);
  const [usagePeriod, setUsagePeriod] = useState('30d');
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (password === (process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123')) {
        setIsAuthenticated(true);
        fetchDashboardData();
        fetchAggregateUsage();
      } else {
        setError('Invalid password');
      }
    } catch (err) {
      setError('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async (page = 1) => {
    try {
      const [statsResponse, customersResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/admin/dashboard/stats`, {
          headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'}` }
        }),
        axios.get(`${API_BASE_URL}/admin/customers`, {
          headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'}` },
          params: {
            page,
            limit: 20,
            search: searchTerm || undefined,
            status: statusFilter !== 'all' ? statusFilter : undefined
          }
        })
      ]);

      setDashboardStats(statsResponse.data);
      setCustomers(customersResponse.data.customers);
      setPagination(customersResponse.data.pagination);
      setCurrentPage(page);
    } catch (err) {
      setError('Failed to fetch dashboard data');
    }
  };

  const fetchAggregateUsage = async () => {
    try {
      // For now, we'll generate mock data since the API endpoint doesn't exist yet
      // In the future, this would call: /admin/aggregate-usage
      const mockData: AggregateUsageData = {
        dailyUsage: generateMockDailyUsage(),
        endpointDistribution: generateMockEndpointDistribution(),
        customerGrowth: generateMockCustomerGrowth(),
        performanceMetrics: generateMockPerformanceMetrics()
      };
      setAggregateUsage(mockData);
    } catch (err) {
      console.error('Failed to fetch aggregate usage:', err);
    }
  };

  const generateMockDailyUsage = () => {
    const data = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const baseRequests = Math.floor(Math.random() * 1000) + 500;
      const successRate = 0.95 + Math.random() * 0.04;
      const responseTime = 50 + Math.random() * 100;
      
      data.push({
        date: date.toISOString().split('T')[0],
        totalRequests: baseRequests,
        successCount: Math.floor(baseRequests * successRate),
        errorCount: Math.floor(baseRequests * (1 - successRate)),
        averageResponseTime: Math.floor(responseTime)
      });
    }
    return data;
  };

  const generateMockEndpointDistribution = () => {
    const endpoints = [
      { name: '/v1/footprint/products', baseCount: 800 },
      { name: '/v1/neutralize/transactions', baseCount: 600 },
      { name: '/v1/user/profile', baseCount: 400 },
      { name: '/v1/organization/details', baseCount: 300 },
      { name: '/v1/metrics', baseCount: 200 }
    ];
    
    const total = endpoints.reduce((sum, ep) => sum + ep.baseCount, 0);
    
    return endpoints.map(ep => ({
      endpoint: ep.name,
      count: ep.baseCount + Math.floor(Math.random() * 200),
      percentage: Math.round((ep.baseCount / total) * 100)
    }));
  };

  const generateMockCustomerGrowth = () => {
    const data = [];
    const now = new Date();
    let totalCustomers = 50;
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const newCustomers = Math.floor(Math.random() * 5) + 1;
      totalCustomers += newCustomers;
      
      data.push({
        date: date.toISOString().split('T')[0],
        totalCustomers,
        newCustomers
      });
    }
    return data;
  };

  const generateMockPerformanceMetrics = () => {
    return {
      averageResponseTime: Math.floor(75 + Math.random() * 50),
      successRate: 95 + Math.random() * 4,
      errorRate: 1 + Math.random() * 4,
      peakHour: `${Math.floor(Math.random() * 12) + 1}:00 PM`,
      peakRequests: Math.floor(Math.random() * 200) + 800
    };
  };

  const fetchCustomerUsage = async (userId: string, period: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/customers/${userId}/usage`, {
        headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'}` },
        params: { period }
      });
      setCustomerUsage(response.data);
    } catch (err) {
      console.error('Failed to fetch customer usage:', err);
    }
  };

  const syncCustomers = async () => {
    try {
      setLoading(true);
      await axios.post(`${API_BASE_URL}/admin/sync-customers`, {}, {
        headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'}` }
      });
      await fetchDashboardData(currentPage);
    } catch (err) {
      setError('Failed to sync customers');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerClick = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerDetails(true);
    await fetchCustomerUsage(customer.userId, usagePeriod);
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

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
      fetchAggregateUsage();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <LockClosedIcon className="h-12 w-12 text-indigo-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Cooler Admin Dashboard
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter password to access admin panel
          </p>
        </div>
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              {error && (
                <div className="text-red-600 text-sm text-center">{error}</div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

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
                    <p className="text-sm text-gray-900">{selectedCustomer.totalApiCalls}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Last Activity:</span>
                    <p className="text-sm text-gray-900">
                      {selectedCustomer.lastApiCall 
                        ? new Date(selectedCustomer.lastApiCall).toLocaleString()
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
                      selectedCustomer.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedCustomer.status}
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
          {customerUsage && (
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
              </div>
            </div>
          )}
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
      <div className={`shadow transition-colors duration-200 ${
        isDarkMode 
          ? `bg-[${selectedTheme.darkMode.surface}] border-b border-[${selectedTheme.darkMode.border}]`
          : 'bg-white'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-indigo-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Cooler Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeSelector 
                selectedTheme={selectedTheme}
                onThemeChange={setSelectedTheme}
              />
              <DarkModeToggle 
                isDarkMode={isDarkMode}
                onToggle={() => setIsDarkMode(!isDarkMode)}
              />
              <button
                onClick={() => setIsAuthenticated(false)}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-200 ${
        isDarkMode 
          ? `bg-[${selectedTheme.darkMode.background}]`
          : 'bg-gray-50'
      }`}>
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
                    }`}>Total Customers</dt>
                    <dd className={`text-lg font-medium transition-colors duration-200 ${
                      isDarkMode 
                        ? `text-[${selectedTheme.darkMode.text}]`
                        : 'text-gray-900'
                    }`}>{dashboardStats?.totalCustomers || 0}</dd>
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
                    }`}>API Calls (24h)</dt>
                    <dd className={`text-lg font-medium transition-colors duration-200 ${
                      isDarkMode 
                        ? `text-[${selectedTheme.darkMode.text}]`
                        : 'text-gray-900'
                    }`}>{dashboardStats?.apiCallsLast24h || 0}</dd>
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
              {dashboardStats?.lastUpdated && (
                <span className="flex items-center text-sm text-gray-500">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  Last updated: {new Date(dashboardStats.lastUpdated).toLocaleString()}
                </span>
              )}
            </div>

            <div className="flex space-x-4">
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

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Search
              </button>
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
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                    isDarkMode 
                      ? `text-[${selectedTheme.darkMode.textSecondary}]`
                      : 'text-gray-500'
                  }`}>
                    Customer
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                    isDarkMode 
                      ? `text-[${selectedTheme.darkMode.textSecondary}]`
                      : 'text-gray-500'
                  }`}>
                    Organization
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
                    API Keys
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                    isDarkMode 
                      ? `text-[${selectedTheme.darkMode.textSecondary}]`
                      : 'text-gray-500'
                  }`}>
                    Status
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                    isDarkMode 
                      ? `text-[${selectedTheme.darkMode.textSecondary}]`
                      : 'text-gray-500'
                  }`}>
                    Last Activity
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
                {customers.map((customer) => (
                  <tr key={customer._id} className={`transition-colors duration-200 ${
                    isDarkMode 
                      ? `hover:bg-[${selectedTheme.darkMode.hover}]`
                      : 'hover:bg-gray-50'
                  }`}>
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
                      <div className={`text-sm transition-colors duration-200 ${
                        isDarkMode 
                          ? `text-[${selectedTheme.darkMode.textSecondary}]`
                          : 'text-gray-500'
                      }`}>{customer.organizationSlug}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {customer.planId}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm transition-colors duration-200 ${
                      isDarkMode 
                        ? `text-[${selectedTheme.darkMode.text}]`
                        : 'text-gray-900'
                    }`}>
                      {customer.apiKeyCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        customer.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {customer.status}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm transition-colors duration-200 ${
                      isDarkMode 
                        ? `text-[${selectedTheme.darkMode.textSecondary}]`
                        : 'text-gray-500'
                    }`}>
                      {customer.lastApiCall 
                        ? new Date(customer.lastApiCall).toLocaleDateString()
                        : 'Never'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleCustomerClick(customer)}
                        className="text-indigo-600 hover:text-indigo-900 flex items-center"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View Details
                      </button>
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
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => fetchDashboardData(currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{' '}
                    of <span className="font-medium">{pagination.total}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => fetchDashboardData(currentPage - 1)}
                      disabled={!pagination.hasPrevPage}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => fetchDashboardData(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === currentPage
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => fetchDashboardData(currentPage + 1)}
                      disabled={!pagination.hasNextPage}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
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
