'use client';

import React, { useState } from 'react';
import { XMarkIcon, UserIcon, ClockIcon, CheckCircleIcon, XCircleIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import TransactionPreview from './TransactionPreview';
import axios from 'axios';

interface ApiRequest {
  id: string;
  userId: string;
  endpoint: string;
  method: string;
  timestamp: string;
  success: boolean;
  responseTime?: number;
  errorMessage?: string;
  responseStatus?: number;
  requestType?: string;
  hasRequestBody?: boolean;
  requestBody?: any;
}

interface RequestDetailsModalProps {
  request: ApiRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onViewUser?: (userId: string) => void;
  onViewSimilarRequests?: (request: ApiRequest) => void;
}

export default function RequestDetailsModal({
  request,
  isOpen,
  onClose,
  onViewUser,
  onViewSimilarRequests
}: RequestDetailsModalProps) {
  const [signingIn, setSigningIn] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  if (!isOpen || !request) return null;

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const handleSignInAs = async () => {
    try {
      setSigningIn(true);
      setSignInError(null);

      const response = await axios.post('/api/impersonate', 
        { userId: request.userId },
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

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircleIcon className="h-6 w-6 text-green-500" />
    ) : (
      <XCircleIcon className="h-6 w-6 text-red-500" />
    );
  };

  const getStatusColor = (success: boolean) => {
    return success 
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const formatRequestBody = (body: any) => {
    if (!body) return 'No request body';
    return JSON.stringify(body, null, 2);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-lg shadow-xl bg-white dark:bg-gray-800">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getStatusIcon(request.success)}
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                API Request Details
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Status
                </label>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(request.success)}
                  <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(request.success)}`}>
                    {request.success ? 'Success' : 'Error'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Timestamp
                </label>
                <div className="flex items-center space-x-2">
                  <ClockIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900 dark:text-white">
                    {formatTimestamp(request.timestamp)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  User ID
                </label>
                <div className="flex items-center space-x-2">
                  <UserIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900 dark:text-white font-mono">
                    {request.userId}
                  </span>
                  {onViewUser && (
                    <button
                      onClick={() => onViewUser(request.userId)}
                      className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      View User
                    </button>
                  )}
                </div>
                <div className="mt-2 flex items-center space-x-3">
                  <TransactionPreview userId={request.userId} />
                  <button
                    onClick={handleSignInAs}
                    disabled={signingIn}
                    className="flex items-center space-x-1 px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-md transition-colors"
                  >
                    <ArrowRightOnRectangleIcon className="h-3 w-3" />
                    <span>{signingIn ? 'Generating...' : 'Sign In As'}</span>
                  </button>
                </div>
                {signInError && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{signInError}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Endpoint
                </label>
                <span className="text-sm text-gray-900 dark:text-white font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  {request.endpoint}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Method
                </label>
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                  {request.method}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Response Time
                </label>
                <span className="text-sm text-gray-900 dark:text-white">
                  {request.responseTime ? `${request.responseTime}ms` : 'Not available'}
                </span>
              </div>

              {request.responseStatus && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    HTTP Status
                  </label>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    request.responseStatus >= 200 && request.responseStatus < 300
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {request.responseStatus}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Request Type */}
          {request.requestType && (
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Request Type
              </label>
              <span className="text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded">
                {request.requestType}
              </span>
            </div>
          )}

          {/* Error Message */}
          {!request.success && request.errorMessage && (
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Error Message
              </label>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                <p className="text-sm text-red-800 dark:text-red-200">
                  {request.errorMessage}
                </p>
              </div>
            </div>
          )}

          {/* Request Body */}
          {request.hasRequestBody && (
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Request Body
              </label>
              <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md p-4">
                <pre className="text-xs text-gray-900 dark:text-white overflow-x-auto">
                  {formatRequestBody(request.requestBody)}
                </pre>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            {onViewSimilarRequests && (
              <button
                onClick={() => onViewSimilarRequests(request)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                View Similar Requests
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 rounded-md"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
