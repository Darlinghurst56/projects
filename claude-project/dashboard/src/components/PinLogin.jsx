import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const PinLogin = () => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [rememberDevice, setRememberDevice] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(null);
  const { login, isLoading, isPinConfigured, isDeviceRemembered, emergencyBypass } = useAuth();

  const MAX_ATTEMPTS = 5;
  const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

  useEffect(() => {
    // Check if device is remembered
    setRememberDevice(isDeviceRemembered());
    
    // Check for lockout
    const lockoutData = localStorage.getItem('pin_lockout');
    if (lockoutData) {
      const { until } = JSON.parse(lockoutData);
      if (Date.now() < until) {
        setLockedUntil(until);
      } else {
        localStorage.removeItem('pin_lockout');
      }
    }
  }, [isDeviceRemembered]);

  useEffect(() => {
    if (lockedUntil) {
      const timer = setInterval(() => {
        if (Date.now() >= lockedUntil) {
          setLockedUntil(null);
          setAttempts(0);
          localStorage.removeItem('pin_lockout');
          clearInterval(timer);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [lockedUntil]);

  const handlePinInput = (digit) => {
    if (pin.length < 6 && !lockedUntil) {
      setPin(prev => prev + digit);
      setError('');
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (lockedUntil) {
      setError('Account is temporarily locked. Please wait.');
      return;
    }

    if (pin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }

    const result = await login(pin, rememberDevice);
    
    if (result.success) {
      setPin('');
      setError('');
      setAttempts(0);
      localStorage.removeItem('pin_lockout');
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setPin('');
      setError(result.error);

      if (newAttempts >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCKOUT_DURATION;
        setLockedUntil(until);
        localStorage.setItem('pin_lockout', JSON.stringify({ until }));
        setError(`Too many failed attempts. Account locked for 15 minutes.`);
      }
    }
  };

  const formatTimeRemaining = () => {
    if (!lockedUntil) return '';
    const remaining = Math.ceil((lockedUntil - Date.now()) / 1000 / 60);
    return `${remaining} minute${remaining !== 1 ? 's' : ''}`;
  };

  const handleEmergencyBypass = () => {
    if (window.confirm('Are you sure you want to use emergency bypass? This should only be used in development.')) {
      emergencyBypass();
    }
  };

  if (!isPinConfigured()) {
    return <PinSetup />;
  }

  const keypadNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0-6v2m-4 0a4 4 0 118 0" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Access</h1>
          <p className="text-gray-600">Enter your PIN to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* PIN Display */}
          <div className="relative">
            <div className="flex justify-center space-x-2 mb-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={`w-12 h-12 border-2 rounded-lg flex items-center justify-center text-xl font-bold ${
                    i < pin.length
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  {i < pin.length ? '•' : ''}
                </div>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm text-center">{error}</p>
              {lockedUntil && (
                <p className="text-red-600 text-xs text-center mt-1">
                  Time remaining: {formatTimeRemaining()}
                </p>
              )}
            </div>
          )}

          {/* Attempts Warning */}
          {attempts > 0 && attempts < MAX_ATTEMPTS && !lockedUntil && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-yellow-700 text-sm text-center">
                {MAX_ATTEMPTS - attempts} attempt{MAX_ATTEMPTS - attempts !== 1 ? 's' : ''} remaining
              </p>
            </div>
          )}

          {/* Number Keypad */}
          <div className="grid grid-cols-3 gap-3">
            {keypadNumbers.slice(0, 9).map((number) => (
              <button
                key={number}
                type="button"
                onClick={() => handlePinInput(number.toString())}
                disabled={lockedUntil || isLoading}
                className="h-12 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 
                         rounded-lg text-lg font-semibold transition-colors duration-200 
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {number}
              </button>
            ))}
            
            {/* Bottom row */}
            <button
              type="button"
              onClick={handleClear}
              disabled={lockedUntil || isLoading}
              className="h-12 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 
                       rounded-lg text-sm font-semibold transition-colors duration-200 
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Clear
            </button>
            
            <button
              type="button"
              onClick={() => handlePinInput('0')}
              disabled={lockedUntil || isLoading}
              className="h-12 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 
                       rounded-lg text-lg font-semibold transition-colors duration-200 
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              0
            </button>
            
            <button
              type="button"
              onClick={handleBackspace}
              disabled={lockedUntil || isLoading}
              className="h-12 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 
                       rounded-lg text-sm font-semibold transition-colors duration-200 
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              ⌫
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={pin.length < 4 || lockedUntil || isLoading}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 
                     text-white font-semibold rounded-lg transition-colors duration-200 
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Verifying...
              </div>
            ) : lockedUntil ? (
              'Account Locked'
            ) : (
              'Unlock Dashboard'
            )}
          </button>

          {/* Remember Device */}
          <div className="flex items-center justify-center">
            <label className="flex items-center text-sm text-gray-600">
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={lockedUntil || isLoading}
              />
              Remember this device
            </label>
          </div>

          {/* Emergency Bypass (Development Only) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-center">
              <button
                type="button"
                onClick={handleEmergencyBypass}
                className="text-xs text-gray-400 hover:text-gray-600 underline"
              >
                Emergency Bypass (Dev)
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

// PIN Setup Component
const PinSetup = () => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const { setupPin, isLoading } = useAuth();

  const handlePinInput = (digit) => {
    if (step === 1 && pin.length < 6) {
      setPin(prev => prev + digit);
      setError('');
    } else if (step === 2 && confirmPin.length < 6) {
      setConfirmPin(prev => prev + digit);
      setError('');
    }
  };

  const handleBackspace = () => {
    if (step === 1) {
      setPin(prev => prev.slice(0, -1));
    } else {
      setConfirmPin(prev => prev.slice(0, -1));
    }
    setError('');
  };

  const handleClear = () => {
    if (step === 1) {
      setPin('');
    } else {
      setConfirmPin('');
    }
    setError('');
  };

  const handleNext = () => {
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (confirmPin.length < 4) {
      setError('Please confirm your PIN');
      return;
    }

    if (pin !== confirmPin) {
      setError('PINs do not match');
      setConfirmPin('');
      return;
    }

    const result = await setupPin(pin);
    if (!result.success) {
      setError(result.error);
    }
  };

  const currentPin = step === 1 ? pin : confirmPin;
  const keypadNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Set Up Your PIN</h1>
          <p className="text-gray-600">
            {step === 1 ? 'Create a secure PIN (4-6 digits)' : 'Confirm your PIN'}
          </p>
        </div>

        <form onSubmit={step === 1 ? (e) => { e.preventDefault(); handleNext(); } : handleSubmit} className="space-y-6">
          {/* PIN Display */}
          <div className="flex justify-center space-x-2 mb-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`w-12 h-12 border-2 rounded-lg flex items-center justify-center text-xl font-bold ${
                  i < currentPin.length
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 bg-gray-50'
                }`}
              >
                {i < currentPin.length ? '•' : ''}
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Number Keypad */}
          <div className="grid grid-cols-3 gap-3">
            {keypadNumbers.slice(0, 9).map((number) => (
              <button
                key={number}
                type="button"
                onClick={() => handlePinInput(number.toString())}
                disabled={isLoading}
                className="h-12 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 
                         rounded-lg text-lg font-semibold transition-colors duration-200 
                         focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {number}
              </button>
            ))}
            
            {/* Bottom row */}
            <button
              type="button"
              onClick={handleClear}
              disabled={isLoading}
              className="h-12 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 
                       rounded-lg text-sm font-semibold transition-colors duration-200 
                       focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Clear
            </button>
            
            <button
              type="button"
              onClick={() => handlePinInput('0')}
              disabled={isLoading}
              className="h-12 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 
                       rounded-lg text-lg font-semibold transition-colors duration-200 
                       focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              0
            </button>
            
            <button
              type="button"
              onClick={handleBackspace}
              disabled={isLoading}
              className="h-12 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 
                       rounded-lg text-sm font-semibold transition-colors duration-200 
                       focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              ⌫
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={currentPin.length < 4 || isLoading}
            className="w-full h-12 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500 
                     text-white font-semibold rounded-lg transition-colors duration-200 
                     focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Setting up...
              </div>
            ) : step === 1 ? (
              'Next'
            ) : (
              'Create PIN'
            )}
          </button>

          {step === 2 && (
            <button
              type="button"
              onClick={() => { setStep(1); setConfirmPin(''); setError(''); }}
              className="w-full h-10 text-gray-600 hover:text-gray-800 transition-colors duration-200"
            >
              ← Back
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default PinLogin;