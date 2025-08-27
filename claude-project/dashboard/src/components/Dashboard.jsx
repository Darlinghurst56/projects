import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PinSettings from './PinSettings';

const Dashboard = () => {
  const [showPinSettings, setShowPinSettings] = useState(false);
  const { logout, user } = useAuth();

  // Load existing dashboard once authenticated
  useEffect(() => {
    // Initialize existing dashboard widgets
    if (window.initializeDashboard) {
      window.initializeDashboard();
    }
  }, []);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Auth Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-12">
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Dashboard Unlocked</span>
                {user?.isEmergency && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                    Emergency Mode
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowPinSettings(true)}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                ⚙️ Change PIN
              </button>
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-700 transition-colors duration-200"
              >
                🔒 Lock Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Existing Dashboard Content */}
      <div className="dashboard-content">
        {/* This will contain the existing dashboard.html content */}
        <iframe
          src="/dashboard.html"
          className="w-full"
          style={{ height: 'calc(100vh - 48px)' }}
          frameBorder="0"
          title="Dashboard"
        />
      </div>

      {/* PIN Settings Modal */}
      <PinSettings
        isOpen={showPinSettings}
        onClose={() => setShowPinSettings(false)}
      />
    </div>
  );
};

export default Dashboard;