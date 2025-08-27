import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const HeaderNav = ({ 
  user, 
  authMethod, 
  isAuthenticated,
  isGuest,
  systemStatus, 
  onLogout, 
  widgets, 
  activeWidgets, 
  onToggleWidget 
}) => {
  const navigate = useNavigate();
  const [showWidgetMenu, setShowWidgetMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-400';
      case 'warning':
        return 'bg-yellow-400';
      case 'error':
        return 'bg-red-400';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200" data-testid="header-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                </svg>
              </div>
              <span className="ml-2 text-xl font-semibold text-gray-900">Family Hub</span>
            </div>
            
            {systemStatus && (
              <div className="ml-6 flex items-center space-x-2">
                <div className={`h-2 w-2 rounded-full ${getStatusColor(systemStatus.overall)}`}></div>
                <span className="text-sm text-gray-600">System Health</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {/* Widget Toggle Menu */}
            <div className="relative">
              <button
                onClick={() => setShowWidgetMenu(!showWidgetMenu)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              
              {showWidgetMenu && (
                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b">
                      Toggle Widgets
                    </div>
                    {widgets.map(widget => (
                      <button
                        key={widget.id}
                        onClick={() => onToggleWidget(widget.id)}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <input
                          type="checkbox"
                          checked={activeWidgets.includes(widget.id)}
                          onChange={() => {}}
                          className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        {widget.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Authentication Menu */}
            <div className="relative">
              {isAuthenticated ? (
                <>
                  {/* Authenticated User Menu */}
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                    data-testid="user-menu"
                  >
                    <div className="h-6 w-6 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {user?.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                  </button>
                  
                  {showUserMenu && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                      <div className="py-1">
                        <div className="px-4 py-2 text-sm text-gray-700 border-b">
                          <div className="font-medium">{user?.name || 'User'}</div>
                          <div className="text-gray-500">via {authMethod}</div>
                        </div>
                        <button
                          onClick={onLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Guest Mode Login Button */}
                  <button
                    onClick={() => navigate('/login')}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    data-testid="login-button"
                  >
                    Sign In
                  </button>
                  
                  {/* Guest Status Indicator */}
                  <div className="ml-3 flex items-center">
                    <div className="h-6 w-6 bg-gray-400 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-white">G</span>
                    </div>
                    <span className="ml-2 text-sm text-gray-500">Guest Mode</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};