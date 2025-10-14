'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';
import ThemeSelector from '../../components/ThemeSelector';
import DarkModeToggle from '../../components/DarkModeToggle';
import Navigation from '../../components/Navigation';
import AnomalyProcessor from '../../components/AnomalyProcessor';
import { themes, Theme } from '../../utils/themes';

interface AnomalyFlag {
  id: string;
  submissionId: string;
  type: 'DATA_QUALITY' | 'CALCULATION' | 'PROCESS' | 'BUSINESS_LOGIC';
  code: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  metadata: Record<string, unknown>;
  dateCreated: string;
  dateResolved?: string;
  resolved: boolean;
  resolvedBy?: string;
  resolutionNotes?: string;
  submission?: {
    id: string;
    title: string;
    category: string;
    manufacturer: string;
    price: number;
    currency: string;
  };
}

interface AnomalyStats {
  totalAnomalies: number;
  unresolvedAnomalies: number;
  resolvedAnomalies: number;
  anomaliesByType: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  anomaliesBySeverity: Array<{
    severity: string;
    count: number;
    percentage: number;
  }>;
  anomaliesByCode: Array<{
    code: string;
    count: number;
    percentage: number;
  }>;
  recentTrends: Array<{
    date: string;
    total: number;
    resolved: number;
    unresolved: number;
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

export default function AnomaliesPage() {
  const [anomalies, setAnomalies] = useState<AnomalyFlag[]>([]);
  const [anomalyStats, setAnomalyStats] = useState<AnomalyStats | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Theme state
  const [selectedTheme, setSelectedTheme] = useState<Theme>(themes[0]);
  
  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [resolvedFilter, setResolvedFilter] = useState<string>('all');
  const [sortBy] = useState<'dateCreated' | 'severity' | 'type'>('dateCreated');
  const [sortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Selected anomaly for details
  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyFlag | null>(null);
  const [showAnomalyDetails, setShowAnomalyDetails] = useState(false);
  
  // Anomaly processor state
  const [processingAnomaly, setProcessingAnomaly] = useState<AnomalyFlag | null>(null);
  const [showAnomalyProcessor, setShowAnomalyProcessor] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888';

  const fetchAnomalies = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      
      const response = await axios.get(`${API_BASE_URL}/admin/anomalies`, {
        headers: { 'Authorization': 'Bearer Bearit01!' },
        params: {
          page,
          limit: pageSize,
          search: searchTerm || undefined,
          type: typeFilter !== 'all' ? typeFilter : undefined,
          severity: severityFilter !== 'all' ? severityFilter : undefined,
          resolved: resolvedFilter !== 'all' ? resolvedFilter === 'resolved' : undefined,
          sortBy,
          sortDirection
        }
      });

      const { anomalies: fetchedAnomalies, total, totalPages, hasNextPage, hasPrevPage } = response.data;
      
      setAnomalies(fetchedAnomalies);
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
      console.error('Failed to fetch anomalies:', error);
    } finally {
      setLoading(false);
    }
  }, [pageSize, searchTerm, typeFilter, severityFilter, resolvedFilter]);

  const handleAnomalyResolved = useCallback((anomalyId: string) => {
    // Remove the resolved anomaly from the list or update its status
    setAnomalies(prev => prev.filter(anomaly => anomaly.id !== anomalyId));
    
    // Update stats
    if (anomalyStats) {
      setAnomalyStats(prev => prev ? {
        ...prev,
        unresolvedAnomalies: Math.max(0, prev.unresolvedAnomalies - 1),
        resolvedAnomalies: prev.resolvedAnomalies + 1
      } : null);
    }
    
    setShowAnomalyProcessor(false);
    setProcessingAnomaly(null);
  }, [anomalyStats]);

  const handleProcessAnomaly = useCallback((anomaly: AnomalyFlag) => {
    setProcessingAnomaly(anomaly);
    setShowAnomalyProcessor(true);
  }, []);

  const handleCloseProcessor = useCallback(() => {
    setShowAnomalyProcessor(false);
    setProcessingAnomaly(null);
  }, []);

  const fetchAnomalyStats = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/anomalies/stats`, {
        headers: { 'Authorization': 'Bearer Bearit01!' }
      });
      setAnomalyStats(response.data);
    } catch (error) {
      console.error('Failed to fetch anomaly stats:', error);
    }
  }, []);

  const resolveAnomaly = async (anomalyId: string, resolutionNotes: string) => {
    try {
      await axios.patch(`${API_BASE_URL}/admin/anomalies/${anomalyId}/resolve`, {
        resolutionNotes
      }, {
        headers: { 'Authorization': 'Bearer Bearit01!' }
      });
      
      // Refresh the data
      await fetchAnomalies(currentPage);
      await fetchAnomalyStats();
    } catch (error) {
      console.error('Failed to resolve anomaly:', error);
    }
  };

  const handleAnomalyClick = (anomaly: AnomalyFlag) => {
    setSelectedAnomaly(anomaly);
    setShowAnomalyDetails(true);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchAnomalies(1);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'DATA_QUALITY': return 'bg-purple-100 text-purple-800';
      case 'CALCULATION': return 'bg-blue-100 text-blue-800';
      case 'PROCESS': return 'bg-green-100 text-green-800';
      case 'BUSINESS_LOGIC': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    fetchAnomalies();
    fetchAnomalyStats();
  }, []);

  if (showAnomalyDetails && selectedAnomaly) {
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
          showBackButton={true}
          backButtonText="Back to Anomalies"
          onBackClick={() => setShowAnomalyDetails(false)}
        />

        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-200 ${
          isDarkMode 
            ? `bg-[${selectedTheme.darkMode.background}]`
            : 'bg-gray-50'
        }`}>
          {/* Anomaly Details */}
          <div className={`shadow rounded-lg p-6 mb-8 transition-colors duration-200 ${
            isDarkMode 
              ? `bg-[${selectedTheme.darkMode.surface}] border border-[${selectedTheme.darkMode.border}]`
              : 'bg-white'
          }`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Anomaly Information</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Type:</span>
                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(selectedAnomaly.type)}`}>
                      {selectedAnomaly.type.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Severity:</span>
                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(selectedAnomaly.severity)}`}>
                      {selectedAnomaly.severity}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Code:</span>
                    <p className="text-sm text-gray-900 font-mono">{selectedAnomaly.code}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Description:</span>
                    <p className="text-sm text-gray-900">{selectedAnomaly.description}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Status:</span>
                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedAnomaly.resolved 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedAnomaly.resolved ? 'Resolved' : 'Unresolved'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Submission Details</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Product:</span>
                    <p className="text-sm text-gray-900">{selectedAnomaly.submission?.title || 'Unknown'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Category:</span>
                    <p className="text-sm text-gray-900">{selectedAnomaly.submission?.category || 'Unknown'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Manufacturer:</span>
                    <p className="text-sm text-gray-900">{selectedAnomaly.submission?.manufacturer || 'Unknown'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Price:</span>
                    <p className="text-sm text-gray-900">
                      {selectedAnomaly.submission?.price ? 
                        `${selectedAnomaly.submission.currency} ${selectedAnomaly.submission.price}` : 
                        'Unknown'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Metadata */}
            {selectedAnomaly.metadata && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Metadata</h3>
                <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                  {JSON.stringify(selectedAnomaly.metadata, null, 2)}
                </pre>
              </div>
            )}

            {/* Resolution */}
            {selectedAnomaly.resolved ? (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Resolution</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Resolved By:</span>
                    <p className="text-sm text-gray-900">{selectedAnomaly.resolvedBy || 'Unknown'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Resolution Notes:</span>
                    <p className="text-sm text-gray-900">{selectedAnomaly.resolutionNotes || 'No notes provided'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Resolved Date:</span>
                    <p className="text-sm text-gray-900">
                      {selectedAnomaly.dateResolved ? 
                        new Date(selectedAnomaly.dateResolved).toLocaleString() : 
                        'Unknown'
                      }
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Resolve Anomaly</h3>
                <div className="space-y-4">
                  <textarea
                    placeholder="Enter resolution notes..."
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    rows={3}
                    id="resolutionNotes"
                  />
                  <button
                    onClick={() => {
                      const notes = (document.getElementById('resolutionNotes') as HTMLTextAreaElement)?.value || '';
                      resolveAnomaly(selectedAnomaly.id, notes);
                      setShowAnomalyDetails(false);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Mark as Resolved
                  </button>
                </div>
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
        {/* Stats Cards */}
        {anomalyStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className={`overflow-hidden shadow rounded-lg transition-colors duration-200 ${
              isDarkMode 
                ? `bg-[${selectedTheme.darkMode.surface}] border border-[${selectedTheme.darkMode.border}]`
                : 'bg-white'
            }`}>
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className={`text-sm font-medium truncate transition-colors duration-200 ${
                        isDarkMode 
                          ? `text-[${selectedTheme.darkMode.textSecondary}]`
                          : 'text-gray-500'
                      }`}>Total Anomalies</dt>
                      <dd className={`text-lg font-medium transition-colors duration-200 ${
                        isDarkMode 
                          ? `text-[${selectedTheme.darkMode.text}]`
                          : 'text-gray-900'
                      }`}>{anomalyStats.totalAnomalies}</dd>
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
                    <XCircleIcon className="h-6 w-6 text-red-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className={`text-sm font-medium truncate transition-colors duration-200 ${
                        isDarkMode 
                          ? `text-[${selectedTheme.darkMode.textSecondary}]`
                          : 'text-gray-500'
                      }`}>Unresolved</dt>
                      <dd className={`text-lg font-medium transition-colors duration-200 ${
                        isDarkMode 
                          ? `text-[${selectedTheme.darkMode.text}]`
                          : 'text-gray-900'
                      }`}>{anomalyStats.unresolvedAnomalies}</dd>
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
                    <CheckCircleIcon className="h-6 w-6 text-green-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className={`text-sm font-medium truncate transition-colors duration-200 ${
                        isDarkMode 
                          ? `text-[${selectedTheme.darkMode.textSecondary}]`
                          : 'text-gray-500'
                      }`}>Resolved</dt>
                      <dd className={`text-lg font-medium transition-colors duration-200 ${
                        isDarkMode 
                          ? `text-[${selectedTheme.darkMode.text}]`
                          : 'text-gray-900'
                      }`}>{anomalyStats.resolvedAnomalies}</dd>
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
                    <InformationCircleIcon className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className={`text-sm font-medium truncate transition-colors duration-200 ${
                        isDarkMode 
                          ? `text-[${selectedTheme.darkMode.textSecondary}]`
                          : 'text-gray-500'
                      }`}>Resolution Rate</dt>
                      <dd className={`text-lg font-medium transition-colors duration-200 ${
                        isDarkMode 
                          ? `text-[${selectedTheme.darkMode.text}]`
                          : 'text-gray-900'
                      }`}>
                        {anomalyStats.totalAnomalies > 0 
                          ? Math.round((anomalyStats.resolvedAnomalies / anomalyStats.totalAnomalies) * 100)
                          : 0}%
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts */}
        {anomalyStats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Anomalies by Type */}
            <div className={`shadow rounded-lg p-6 transition-colors duration-200 ${
              isDarkMode 
                ? `bg-[${selectedTheme.darkMode.surface}] border border-[${selectedTheme.darkMode.border}]`
                : 'bg-white'
            }`}>
              <h3 className={`text-lg font-medium mb-4 transition-colors duration-200 ${
                isDarkMode 
                  ? `text-[${selectedTheme.darkMode.text}]`
                  : 'text-gray-900'
              }`}>Anomalies by Type</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={anomalyStats.anomaliesByType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ type, percentage }) => `${type}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {anomalyStats.anomaliesByType.map((entry, index) => (
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

            {/* Anomalies by Severity */}
            <div className={`shadow rounded-lg p-6 transition-colors duration-200 ${
              isDarkMode 
                ? `bg-[${selectedTheme.darkMode.surface}] border border-[${selectedTheme.darkMode.border}]`
                : 'bg-white'
            }`}>
              <h3 className={`text-lg font-medium mb-4 transition-colors duration-200 ${
                isDarkMode 
                  ? `text-[${selectedTheme.darkMode.text}]`
                  : 'text-gray-900'
              }`}>Anomalies by Severity</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={anomalyStats.anomaliesBySeverity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="severity" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill={selectedTheme.colors.chart1} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className={`shadow rounded-lg p-6 mb-8 transition-colors duration-200 ${
          isDarkMode 
            ? `bg-[${selectedTheme.darkMode.surface}] border border-[${selectedTheme.darkMode.border}]`
            : 'bg-white'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex space-x-4">
              <button
                onClick={() => fetchAnomalies(currentPage)}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            <div className="flex space-x-4">
              {/* Type Filter */}
              <div className="flex items-center space-x-2">
                <label className={`text-sm transition-colors duration-200 ${
                  isDarkMode 
                    ? `text-[${selectedTheme.darkMode.textSecondary}]`
                    : 'text-gray-500'
                }`}>
                  Type:
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className={`text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 ${
                    isDarkMode 
                      ? `bg-[${selectedTheme.darkMode.surface}] text-[${selectedTheme.darkMode.text}] border-[${selectedTheme.darkMode.border}]`
                      : 'bg-white text-gray-900'
                  }`}
                >
                  <option value="all">All Types</option>
                  <option value="DATA_QUALITY">Data Quality</option>
                  <option value="CALCULATION">Calculation</option>
                  <option value="PROCESS">Process</option>
                  <option value="BUSINESS_LOGIC">Business Logic</option>
                </select>
              </div>

              {/* Severity Filter */}
              <div className="flex items-center space-x-2">
                <label className={`text-sm transition-colors duration-200 ${
                  isDarkMode 
                    ? `text-[${selectedTheme.darkMode.textSecondary}]`
                    : 'text-gray-500'
                }`}>
                  Severity:
                </label>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className={`text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 ${
                    isDarkMode 
                      ? `bg-[${selectedTheme.darkMode.surface}] text-[${selectedTheme.darkMode.text}] border-[${selectedTheme.darkMode.border}]`
                      : 'bg-white text-gray-900'
                  }`}
                >
                  <option value="all">All Severities</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              {/* Resolved Filter */}
              <div className="flex items-center space-x-2">
                <label className={`text-sm transition-colors duration-200 ${
                  isDarkMode 
                    ? `text-[${selectedTheme.darkMode.textSecondary}]`
                    : 'text-gray-500'
                }`}>
                  Status:
                </label>
                <select
                  value={resolvedFilter}
                  onChange={(e) => setResolvedFilter(e.target.value)}
                  className={`text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 ${
                    isDarkMode 
                      ? `bg-[${selectedTheme.darkMode.surface}] text-[${selectedTheme.darkMode.text}] border-[${selectedTheme.darkMode.border}]`
                      : 'bg-white text-gray-900'
                  }`}
                >
                  <option value="all">All Statuses</option>
                  <option value="unresolved">Unresolved</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search anomalies..."
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
            </div>
          </div>
        </div>

        {/* Anomalies Table */}
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
            }`}>Anomaly Flags</h3>
            <p className={`mt-1 max-w-2xl text-sm transition-colors duration-200 ${
              isDarkMode 
                ? `text-[${selectedTheme.darkMode.textSecondary}]`
                : 'text-gray-500'
            }`}>
              List of all anomaly flags detected in the system
            </p>
            {pagination && (
              <p className={`mt-2 text-sm transition-colors duration-200 ${
                isDarkMode 
                  ? `text-[${selectedTheme.darkMode.textSecondary}]`
                  : 'text-gray-600'
              }`}>
                Showing page {currentPage} of {pagination.totalPages} • Total anomalies: {pagination.total}
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
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                    isDarkMode 
                      ? `text-[${selectedTheme.darkMode.textSecondary}]`
                      : 'text-gray-500'
                  }`}>
                    Type
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                    isDarkMode 
                      ? `text-[${selectedTheme.darkMode.textSecondary}]`
                      : 'text-gray-500'
                  }`}>
                    Severity
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                    isDarkMode 
                      ? `text-[${selectedTheme.darkMode.textSecondary}]`
                      : 'text-gray-500'
                  }`}>
                    Code
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                    isDarkMode 
                      ? `text-[${selectedTheme.darkMode.textSecondary}]`
                      : 'text-gray-500'
                  }`}>
                    Description
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                    isDarkMode 
                      ? `text-[${selectedTheme.darkMode.textSecondary}]`
                      : 'text-gray-500'
                  }`}>
                    Product
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
                    Date Created
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
                {anomalies.map((anomaly) => (
                  <tr key={anomaly.id} className={`transition-colors duration-200 ${
                    isDarkMode 
                      ? `hover:bg-[${selectedTheme.darkMode.hover}]`
                      : 'hover:bg-gray-50'
                  }`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(anomaly.type)}`}>
                        {anomaly.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(anomaly.severity)}`}>
                        {anomaly.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-mono transition-colors duration-200 ${
                        isDarkMode 
                          ? `text-[${selectedTheme.darkMode.text}]`
                          : 'text-gray-900'
                      }`}>
                        {anomaly.code}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm transition-colors duration-200 ${
                        isDarkMode 
                          ? `text-[${selectedTheme.darkMode.text}]`
                          : 'text-gray-900'
                      }`}>
                        {anomaly.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm transition-colors duration-200 ${
                        isDarkMode 
                          ? `text-[${selectedTheme.darkMode.text}]`
                          : 'text-gray-900'
                      }`}>
                        {anomaly.submission?.title || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        anomaly.resolved 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {anomaly.resolved ? 'Resolved' : 'Unresolved'}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm transition-colors duration-200 ${
                      isDarkMode 
                        ? `text-[${selectedTheme.darkMode.textSecondary}]`
                        : 'text-gray-500'
                    }`}>
                      {new Date(anomaly.dateCreated).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleAnomalyClick(anomaly)}
                          className="text-indigo-600 hover:text-indigo-900 flex items-center"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          View
                        </button>
                        {!anomaly.resolved && (
                          <button
                            onClick={() => handleProcessAnomaly(anomaly)}
                            className="text-green-600 hover:text-green-900 flex items-center"
                          >
                            <PencilIcon className="h-4 w-4 mr-1" />
                            Process
                          </button>
                        )}
                      </div>
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
                  onClick={() => fetchAnomalies(currentPage - 1)}
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
                  onClick={() => fetchAnomalies(currentPage + 1)}
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
                    <button
                      onClick={() => fetchAnomalies(currentPage - 1)}
                      disabled={!pagination.hasPrevPage}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium transition-colors duration-200 ${
                        isDarkMode 
                          ? 'border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600 disabled:opacity-50'
                          : 'border-gray-300 text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50'
                      }`}
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => fetchAnomalies(currentPage + 1)}
                      disabled={!pagination.hasNextPage}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium transition-colors duration-200 ${
                        isDarkMode 
                          ? 'border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600 disabled:opacity-50'
                          : 'border-gray-300 text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50'
                      }`}
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

      {/* Anomaly Processor Modal */}
      {showAnomalyProcessor && processingAnomaly && (
        <AnomalyProcessor
          anomaly={processingAnomaly}
          onResolved={handleAnomalyResolved}
          onClose={handleCloseProcessor}
          isDarkMode={isDarkMode}
          selectedTheme={selectedTheme}
        />
      )}
    </div>
  );
}
