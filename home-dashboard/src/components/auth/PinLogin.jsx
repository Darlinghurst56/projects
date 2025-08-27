import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export const PinLogin = () => {
  const { login, isLoading } = useAuth();
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!pin || !name.trim()) {
      setError('Please enter both PIN and your name');
      return;
    }

    if (pin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }

    try {
      await login({ pin, name: name.trim() }, 'pin');
    } catch (error) {
      setError(error.message || 'PIN authentication failed');
    }
  };

  const handlePinChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    setPin(value);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
          <svg
            className="h-6 w-6 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          Family PIN Access
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          Enter your family PIN and name to access the dashboard
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Your Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="pin" className="block text-sm font-medium text-gray-700">
            Family PIN
          </label>
          <input
            id="pin"
            type="password"
            value={pin}
            onChange={handlePinChange}
            placeholder="Enter your PIN"
            maxLength="6"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base text-center tracking-wider font-mono"
            disabled={isLoading}
          />
          <p className="mt-1 text-xs text-gray-500">
            Enter your 4-6 digit family PIN
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <span className="block sm:inline text-sm">{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !pin || !name.trim()}
          className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Signing In...
            </>
          ) : (
            'Sign In with PIN'
          )}
        </button>
      </form>

      <div className="text-xs text-gray-500 text-center">
        <p>Safe for children and family members</p>
        <p>PIN access provides limited dashboard features</p>
      </div>
    </div>
  );
};