import React, { useState } from 'react';
import { Trash2, AlertTriangle, RefreshCw } from 'lucide-react';
import { api } from '../utils/localStorage';

const DataReset = () => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await api.resetAllData();
      alert('All data has been reset successfully!');
      setShowConfirmation(false);
    } catch (error) {
      alert('Error resetting data. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Data Management</h1>

      <div className="max-w-2xl mx-auto">
        {/* Warning Card */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
            <h2 className="text-xl font-semibold text-red-800">Danger Zone</h2>
          </div>
          <p className="text-red-700 mb-4">
            This action will permanently delete all your data including:
          </p>
          <ul className="list-disc list-inside text-red-700 space-y-1 mb-6">
            <li>All deals and transactions</li>
            <li>All suppliers information</li>
            <li>All buyers information</li>
            <li>All calculation history</li>
            <li>All reports and analytics data</li>
          </ul>
          <p className="text-red-700 font-medium">
            This action cannot be undone. Please make sure you have backed up any important data before proceeding.
          </p>
        </div>

        {/* Reset Button */}
        {!showConfirmation ? (
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <Trash2 className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Reset All Data</h3>
            <p className="text-gray-600 mb-6">
              Click the button below to permanently delete all data from the application.
            </p>
            <button
              onClick={() => setShowConfirmation(true)}
              className="bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 flex items-center mx-auto"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              Reset All Data
            </button>
          </div>
        ) : (
          /* Confirmation Dialog */
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-center mb-6">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Are you absolutely sure?</h3>
              <p className="text-gray-600">
                This will permanently delete all your deals, suppliers, buyers, and related data.
                This action cannot be undone.
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-md mb-6">
              <p className="text-sm text-gray-700 mb-2">
                Please type <strong>DELETE ALL DATA</strong> to confirm:
              </p>
              <input
                type="text"
                placeholder="Type DELETE ALL DATA"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                id="confirmationInput"
              />
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowConfirmation(false)}
                className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700"
                disabled={isResetting}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const input = document.getElementById('confirmationInput');
                  if (input.value === 'DELETE ALL DATA') {
                    handleReset();
                  } else {
                    alert('Please type "DELETE ALL DATA" exactly to confirm.');
                  }
                }}
                disabled={isResetting}
                className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 flex items-center disabled:opacity-50"
              >
                {isResetting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete All Data
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Information Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Data Storage Information</h3>
          <p className="text-blue-700 text-sm">
            All your data is stored locally in your browser's localStorage. This means:
          </p>
          <ul className="list-disc list-inside text-blue-700 text-sm mt-2 space-y-1">
            <li>Data is only accessible from this browser on this device</li>
            <li>Clearing browser data will also remove your deals</li>
            <li>Data is not synchronized across devices</li>
            <li>Consider exporting important data regularly as backup</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DataReset;