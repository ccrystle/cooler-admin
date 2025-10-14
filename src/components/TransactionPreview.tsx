'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

interface Transaction {
  id: string;
  dateCreated: string;
  status: string;
  itemCount: number;
  stripeUsageId?: string;
}

interface TransactionPreviewProps {
  userId: string;
  onTransactionClick?: (transactionId: string) => void;
}

export default function TransactionPreview({ userId, onTransactionClick }: TransactionPreviewProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPopover, setShowPopover] = useState(false);

  useEffect(() => {
    if (showPopover && transactions.length === 0) {
      fetchTransactions();
    }
  }, [showPopover]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`/api/transactions/${userId}`, {
        headers: {
          'Authorization': 'Bearer Bearit01!'
        }
      });

      if (response.data.success) {
        setTransactions(response.data.transactions || []);
      } else {
        setError(response.data.error || 'Failed to fetch transactions');
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleTransactionClick = (transactionId: string) => {
    if (onTransactionClick) {
      onTransactionClick(transactionId);
    } else {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.cooler.dev';
      window.open(`${appUrl}/transactions/${transactionId}`, '_blank');
    }
  };

  const openAllTransactions = () => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.cooler.dev';
    window.open(`${appUrl}/transactions`, '_blank');
  };

  return (
    <div className="relative">
      <button
        onMouseEnter={() => setShowPopover(true)}
        onMouseLeave={() => setShowPopover(false)}
        onClick={openAllTransactions}
        className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
      >
        <span>View Transactions</span>
        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
      </button>

      {showPopover && (
        <div
          onMouseEnter={() => setShowPopover(true)}
          onMouseLeave={() => setShowPopover(false)}
          className="absolute z-50 left-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4"
        >
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Recent Transactions (Last 7)
          </h4>

          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-xs text-gray-500">Loading...</p>
            </div>
          ) : error ? (
            <div className="text-center py-4">
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">No transactions found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx, index) => (
                <button
                  key={tx.id}
                  onClick={() => handleTransactionClick(tx.id)}
                  className="w-full text-left p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium text-gray-900 dark:text-white">
                          {index + 1}. {tx.id.substring(0, 8)}...
                        </span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          tx.status === 'SUCCESS' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {tx.status}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>{tx.itemCount} item{tx.itemCount !== 1 ? 's' : ''}</span>
                        <span>•</span>
                        <span>{formatDate(tx.dateCreated)}</span>
                      </div>
                    </div>
                    <ArrowTopRightOnSquareIcon className="h-4 w-4 text-gray-400" />
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={openAllTransactions}
              className="w-full text-center text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              View All Transactions →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
