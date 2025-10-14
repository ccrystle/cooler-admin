'use client';

import { useState } from 'react';
import { 
  PencilIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

interface AnomalySubmission {
  id: string;
  title: string;
  manufacturer: string;
  category: string;
  description: string;
  price: number;
  currency: string;
  naicsCode?: string;
}

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
  submission?: AnomalySubmission;
}

interface AnomalyProcessorProps {
  anomaly: AnomalyFlag;
  onResolved: (anomalyId: string) => void;
  onClose: () => void;
  isDarkMode: boolean;
  selectedTheme: any;
}

type ResolutionAction = 
  | 'UPDATE_SUBMISSION' 
  | 'UPDATE_NAICS_CODE' 
  | 'UPDATE_PRICE' 
  | 'MARK_RESOLVED';

const RESOLUTION_ACTIONS: { value: ResolutionAction; label: string; description: string }[] = [
  {
    value: 'UPDATE_SUBMISSION',
    label: 'Update Product Details',
    description: 'Edit product title, manufacturer, category, or description'
  },
  {
    value: 'UPDATE_NAICS_CODE',
    label: 'Update NAICS Code',
    description: 'Change the NAICS classification code'
  },
  {
    value: 'UPDATE_PRICE',
    label: 'Update Price',
    description: 'Correct the product price'
  },
  {
    value: 'MARK_RESOLVED',
    label: 'Mark as Resolved',
    description: 'Mark anomaly as resolved without making changes'
  }
];

export default function AnomalyProcessor({ anomaly, onResolved, onClose, isDarkMode, selectedTheme }: AnomalyProcessorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedAction, setSelectedAction] = useState<ResolutionAction>('MARK_RESOLVED');
  const [resolutionNotes, setResolutionNotes] = useState('');
  
  // Form data for UPDATE_SUBMISSION
  const [submissionData, setSubmissionData] = useState({
    title: anomaly.submission?.title || '',
    manufacturer: anomaly.submission?.manufacturer || '',
    category: anomaly.submission?.category || '',
    description: anomaly.submission?.description || '',
    price: anomaly.submission?.price || 0,
    currency: anomaly.submission?.currency || 'USD',
    naicsCode: anomaly.submission?.naicsCode || ''
  });

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888';

  const handleResolve = async () => {
    if (!selectedAction) return;

    setIsProcessing(true);
    
    try {
      let requestData: any = {
        action: selectedAction,
        notes: resolutionNotes
      };

      // Add specific data based on the resolution action
      if (selectedAction === 'UPDATE_SUBMISSION') {
        requestData.submissionData = submissionData;
      } else if (selectedAction === 'UPDATE_NAICS_CODE') {
        requestData.naicsCode = submissionData.naicsCode;
      } else if (selectedAction === 'UPDATE_PRICE') {
        requestData.price = submissionData.price;
        requestData.currency = submissionData.currency;
      }

      const response = await axios.post(
        `${API_BASE_URL}/admin/anomalies/${anomaly.id}/resolve`,
        requestData,
        {
          headers: { 'Authorization': 'Bearer Bearit01!' }
        }
      );

      if (response.data.success) {
        onResolved(anomaly.id);
        onClose();
      } else {
        throw new Error(response.data.error || 'Failed to resolve anomaly');
      }
    } catch (error) {
      console.error('Failed to resolve anomaly:', error);
      alert(`Failed to resolve anomaly: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'text-red-600 bg-red-100';
      case 'HIGH': return 'text-orange-600 bg-orange-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'LOW': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'DATA_QUALITY': return 'text-purple-600 bg-purple-100';
      case 'CALCULATION': return 'text-indigo-600 bg-indigo-100';
      case 'PROCESS': return 'text-green-600 bg-green-100';
      case 'BUSINESS_LOGIC': return 'text-pink-600 bg-pink-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50`}>
      <div className={`max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-lg shadow-xl ${
        isDarkMode 
          ? `bg-[${selectedTheme.darkMode.surface}] border border-[${selectedTheme.darkMode.border}]`
          : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b ${
          isDarkMode 
            ? `border-[${selectedTheme.darkMode.border}]`
            : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-orange-500" />
              <h2 className={`text-xl font-semibold ${
                isDarkMode 
                  ? `text-[${selectedTheme.darkMode.text}]`
                  : 'text-gray-900'
              }`}>
                Process Anomaly
              </h2>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg hover:bg-gray-100 ${
                isDarkMode 
                  ? `hover:bg-[${selectedTheme.darkMode.hover}] text-[${selectedTheme.darkMode.textSecondary}]`
                  : 'text-gray-500'
              }`}
            >
              <XCircleIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Anomaly Information */}
          <div className={`p-4 rounded-lg border ${
            isDarkMode 
              ? `border-[${selectedTheme.darkMode.border}] bg-[${selectedTheme.darkMode.hover}]`
              : 'border-gray-200 bg-gray-50'
          }`}>
            <h3 className={`text-lg font-medium mb-3 ${
              isDarkMode 
                ? `text-[${selectedTheme.darkMode.text}]`
                : 'text-gray-900'
            }`}>
              Anomaly Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className={`text-sm font-medium ${
                  isDarkMode 
                    ? `text-[${selectedTheme.darkMode.textSecondary}]`
                    : 'text-gray-500'
                }`}>Type:</span>
                <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(anomaly.type)}`}>
                  {anomaly.type.replace('_', ' ')}
                </span>
              </div>
              <div>
                <span className={`text-sm font-medium ${
                  isDarkMode 
                    ? `text-[${selectedTheme.darkMode.textSecondary}]`
                    : 'text-gray-500'
                }`}>Severity:</span>
                <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(anomaly.severity)}`}>
                  {anomaly.severity}
                </span>
              </div>
              <div className="col-span-2">
                <span className={`text-sm font-medium ${
                  isDarkMode 
                    ? `text-[${selectedTheme.darkMode.textSecondary}]`
                    : 'text-gray-500'
                }`}>Description:</span>
                <p className={`mt-1 text-sm ${
                  isDarkMode 
                    ? `text-[${selectedTheme.darkMode.text}]`
                    : 'text-gray-900'
                }`}>
                  {anomaly.description}
                </p>
              </div>
            </div>
          </div>

          {/* Product Information */}
          {anomaly.submission && (
            <div className={`p-4 rounded-lg border ${
              isDarkMode 
                ? `border-[${selectedTheme.darkMode.border}] bg-[${selectedTheme.darkMode.hover}]`
                : 'border-gray-200 bg-gray-50'
            }`}>
              <h3 className={`text-lg font-medium mb-3 ${
                isDarkMode 
                  ? `text-[${selectedTheme.darkMode.text}]`
                  : 'text-gray-900'
              }`}>
                Product Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className={`font-medium ${
                    isDarkMode 
                      ? `text-[${selectedTheme.darkMode.textSecondary}]`
                      : 'text-gray-500'
                  }`}>Title:</span>
                  <p className={`mt-1 ${
                    isDarkMode 
                      ? `text-[${selectedTheme.darkMode.text}]`
                      : 'text-gray-900'
                  }`}>{anomaly.submission.title}</p>
                </div>
                <div>
                  <span className={`font-medium ${
                    isDarkMode 
                      ? `text-[${selectedTheme.darkMode.textSecondary}]`
                      : 'text-gray-500'
                  }`}>Manufacturer:</span>
                  <p className={`mt-1 ${
                    isDarkMode 
                      ? `text-[${selectedTheme.darkMode.text}]`
                      : 'text-gray-900'
                  }`}>{anomaly.submission.manufacturer}</p>
                </div>
                <div>
                  <span className={`font-medium ${
                    isDarkMode 
                      ? `text-[${selectedTheme.darkMode.textSecondary}]`
                      : 'text-gray-500'
                  }`}>Category:</span>
                  <p className={`mt-1 ${
                    isDarkMode 
                      ? `text-[${selectedTheme.darkMode.text}]`
                      : 'text-gray-900'
                  }`}>{anomaly.submission.category}</p>
                </div>
                <div>
                  <span className={`font-medium ${
                    isDarkMode 
                      ? `text-[${selectedTheme.darkMode.textSecondary}]`
                      : 'text-gray-500'
                  }`}>Price:</span>
                  <p className={`mt-1 ${
                    isDarkMode 
                      ? `text-[${selectedTheme.darkMode.text}]`
                      : 'text-gray-900'
                  }`}>${anomaly.submission.price} {anomaly.submission.currency}</p>
                </div>
              </div>
            </div>
          )}

          {/* Resolution Action Selection */}
          <div className={`p-4 rounded-lg border ${
            isDarkMode 
              ? `border-[${selectedTheme.darkMode.border}]`
              : 'border-gray-200'
          }`}>
            <h3 className={`text-lg font-medium mb-4 ${
              isDarkMode 
                ? `text-[${selectedTheme.darkMode.text}]`
                : 'text-gray-900'
            }`}>
              Resolution Action
            </h3>
            <div className="space-y-3">
              {RESOLUTION_ACTIONS.map((action) => (
                <label key={action.value} className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="resolutionAction"
                    value={action.value}
                    checked={selectedAction === action.value}
                    onChange={(e) => setSelectedAction(e.target.value as ResolutionAction)}
                    className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <div className="flex-1">
                    <div className={`font-medium ${
                      isDarkMode 
                        ? `text-[${selectedTheme.darkMode.text}]`
                        : 'text-gray-900'
                    }`}>
                      {action.label}
                    </div>
                    <div className={`text-sm ${
                      isDarkMode 
                        ? `text-[${selectedTheme.darkMode.textSecondary}]`
                        : 'text-gray-500'
                    }`}>
                      {action.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Dynamic Form Fields Based on Selected Action */}
          {selectedAction === 'UPDATE_SUBMISSION' && (
            <div className={`p-4 rounded-lg border ${
              isDarkMode 
                ? `border-[${selectedTheme.darkMode.border}]`
                : 'border-gray-200'
            }`}>
              <h4 className={`text-md font-medium mb-4 ${
                isDarkMode 
                  ? `text-[${selectedTheme.darkMode.text}]`
                  : 'text-gray-900'
              }`}>
                Update Product Details
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode 
                      ? `text-[${selectedTheme.darkMode.text}]`
                      : 'text-gray-700'
                  }`}>
                    Title
                  </label>
                  <input
                    type="text"
                    value={submissionData.title}
                    onChange={(e) => setSubmissionData(prev => ({ ...prev, title: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                      isDarkMode 
                        ? `bg-[${selectedTheme.darkMode.surface}] border-[${selectedTheme.darkMode.border}] text-[${selectedTheme.darkMode.text}]`
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode 
                      ? `text-[${selectedTheme.darkMode.text}]`
                      : 'text-gray-700'
                  }`}>
                    Manufacturer
                  </label>
                  <input
                    type="text"
                    value={submissionData.manufacturer}
                    onChange={(e) => setSubmissionData(prev => ({ ...prev, manufacturer: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                      isDarkMode 
                        ? `bg-[${selectedTheme.darkMode.surface}] border-[${selectedTheme.darkMode.border}] text-[${selectedTheme.darkMode.text}]`
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode 
                      ? `text-[${selectedTheme.darkMode.text}]`
                      : 'text-gray-700'
                  }`}>
                    Category
                  </label>
                  <input
                    type="text"
                    value={submissionData.category}
                    onChange={(e) => setSubmissionData(prev => ({ ...prev, category: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                      isDarkMode 
                        ? `bg-[${selectedTheme.darkMode.surface}] border-[${selectedTheme.darkMode.border}] text-[${selectedTheme.darkMode.text}]`
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode 
                      ? `text-[${selectedTheme.darkMode.text}]`
                      : 'text-gray-700'
                  }`}>
                    NAICS Code
                  </label>
                  <input
                    type="text"
                    value={submissionData.naicsCode}
                    onChange={(e) => setSubmissionData(prev => ({ ...prev, naicsCode: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                      isDarkMode 
                        ? `bg-[${selectedTheme.darkMode.surface}] border-[${selectedTheme.darkMode.border}] text-[${selectedTheme.darkMode.text}]`
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div className="col-span-2">
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode 
                      ? `text-[${selectedTheme.darkMode.text}]`
                      : 'text-gray-700'
                  }`}>
                    Description
                  </label>
                  <textarea
                    value={submissionData.description}
                    onChange={(e) => setSubmissionData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                      isDarkMode 
                        ? `bg-[${selectedTheme.darkMode.surface}] border-[${selectedTheme.darkMode.border}] text-[${selectedTheme.darkMode.text}]`
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>
            </div>
          )}

          {selectedAction === 'UPDATE_PRICE' && (
            <div className={`p-4 rounded-lg border ${
              isDarkMode 
                ? `border-[${selectedTheme.darkMode.border}]`
                : 'border-gray-200'
            }`}>
              <h4 className={`text-md font-medium mb-4 ${
                isDarkMode 
                  ? `text-[${selectedTheme.darkMode.text}]`
                  : 'text-gray-900'
              }`}>
                Update Price
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode 
                      ? `text-[${selectedTheme.darkMode.text}]`
                      : 'text-gray-700'
                  }`}>
                    Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={submissionData.price}
                    onChange={(e) => setSubmissionData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                      isDarkMode 
                        ? `bg-[${selectedTheme.darkMode.surface}] border-[${selectedTheme.darkMode.border}] text-[${selectedTheme.darkMode.text}]`
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode 
                      ? `text-[${selectedTheme.darkMode.text}]`
                      : 'text-gray-700'
                  }`}>
                    Currency
                  </label>
                  <select
                    value={submissionData.currency}
                    onChange={(e) => setSubmissionData(prev => ({ ...prev, currency: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                      isDarkMode 
                        ? `bg-[${selectedTheme.darkMode.surface}] border-[${selectedTheme.darkMode.border}] text-[${selectedTheme.darkMode.text}]`
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="CAD">CAD</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {selectedAction === 'UPDATE_NAICS_CODE' && (
            <div className={`p-4 rounded-lg border ${
              isDarkMode 
                ? `border-[${selectedTheme.darkMode.border}]`
                : 'border-gray-200'
            }`}>
              <h4 className={`text-md font-medium mb-4 ${
                isDarkMode 
                  ? `text-[${selectedTheme.darkMode.text}]`
                  : 'text-gray-900'
              }`}>
                Update NAICS Code
              </h4>
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode 
                    ? `text-[${selectedTheme.darkMode.text}]`
                    : 'text-gray-700'
                }`}>
                  NAICS Code
                </label>
                <input
                  type="text"
                  value={submissionData.naicsCode}
                  onChange={(e) => setSubmissionData(prev => ({ ...prev, naicsCode: e.target.value }))}
                  placeholder="e.g., 339999"
                  className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                    isDarkMode 
                      ? `bg-[${selectedTheme.darkMode.surface}] border-[${selectedTheme.darkMode.border}] text-[${selectedTheme.darkMode.text}]`
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Resolution Notes */}
          <div className={`p-4 rounded-lg border ${
            isDarkMode 
              ? `border-[${selectedTheme.darkMode.border}]`
              : 'border-gray-200'
          }`}>
            <h4 className={`text-md font-medium mb-4 ${
              isDarkMode 
                ? `text-[${selectedTheme.darkMode.text}]`
                : 'text-gray-900'
            }`}>
              Resolution Notes
            </h4>
            <textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Add notes about the resolution action..."
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                isDarkMode 
                  ? `bg-[${selectedTheme.darkMode.surface}] border-[${selectedTheme.darkMode.border}] text-[${selectedTheme.darkMode.text}]`
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className={`px-4 py-2 border border-gray-300 rounded-md text-sm font-medium ${
                isDarkMode 
                  ? `bg-[${selectedTheme.darkMode.surface}] text-[${selectedTheme.darkMode.text}] border-[${selectedTheme.darkMode.border}] hover:bg-[${selectedTheme.darkMode.hover}]`
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } disabled:opacity-50`}
            >
              Cancel
            </button>
            <button
              onClick={handleResolve}
              disabled={isProcessing}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="-ml-1 mr-2 h-4 w-4" />
                  Resolve Anomaly
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

