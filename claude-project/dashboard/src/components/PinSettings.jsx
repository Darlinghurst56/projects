import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const PinSettings = ({ isOpen, onClose }) => {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState(1); // 1: current, 2: new, 3: confirm
  const { changePin, isLoading } = useAuth();

  const handlePinInput = (digit, field) => {
    if (field === 'current' && currentPin.length < 6) {
      setCurrentPin(prev => prev + digit);
    } else if (field === 'new' && newPin.length < 6) {
      setNewPin(prev => prev + digit);
    } else if (field === 'confirm' && confirmNewPin.length < 6) {
      setConfirmNewPin(prev => prev + digit);
    }
    setError('');
    setSuccess('');
  };

  const handleBackspace = (field) => {
    if (field === 'current') {
      setCurrentPin(prev => prev.slice(0, -1));
    } else if (field === 'new') {
      setNewPin(prev => prev.slice(0, -1));
    } else if (field === 'confirm') {
      setConfirmNewPin(prev => prev.slice(0, -1));
    }
    setError('');
    setSuccess('');
  };

  const handleClear = (field) => {
    if (field === 'current') {
      setCurrentPin('');
    } else if (field === 'new') {
      setNewPin('');
    } else if (field === 'confirm') {
      setConfirmNewPin('');
    }
    setError('');
    setSuccess('');
  };

  const handleNext = () => {
    if (step === 1) {
      if (currentPin.length < 4) {
        setError('Please enter your current PIN');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (newPin.length < 4) {
        setError('New PIN must be at least 4 digits');
        return;
      }
      if (newPin === currentPin) {
        setError('New PIN must be different from current PIN');
        return;
      }
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    if (confirmNewPin.length < 4) {
      setError('Please confirm your new PIN');
      return;
    }

    if (newPin !== confirmNewPin) {
      setError('New PINs do not match');
      setConfirmNewPin('');
      return;
    }

    const result = await changePin(currentPin, newPin);
    
    if (result.success) {
      setSuccess('PIN changed successfully!');
      setTimeout(() => {
        handleClose();
      }, 2000);
    } else {
      setError(result.error);
      if (result.error.includes('Current PIN')) {
        setStep(1);
        setCurrentPin('');
        setNewPin('');
        setConfirmNewPin('');
      }
    }
  };

  const handleClose = () => {
    setCurrentPin('');
    setNewPin('');
    setConfirmNewPin('');
    setError('');
    setSuccess('');
    setStep(1);
    onClose();
  };

  const getCurrentPin = () => {
    if (step === 1) return currentPin;
    if (step === 2) return newPin;
    if (step === 3) return confirmNewPin;
    return '';
  };

  const getCurrentField = () => {
    if (step === 1) return 'current';
    if (step === 2) return 'new';
    if (step === 3) return 'confirm';
    return '';
  };

  const getTitle = () => {
    if (step === 1) return 'Enter Current PIN';
    if (step === 2) return 'Enter New PIN';
    if (step === 3) return 'Confirm New PIN';
    return '';
  };

  const keypadNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Change PIN</h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-6">
          {[1, 2, 3].map((stepNum) => (
            <React.Fragment key={stepNum}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  stepNum <= step
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {stepNum}
              </div>
              {stepNum < 3 && (
                <div
                  className={`w-8 h-1 mx-1 ${
                    stepNum < step ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{getTitle()}</h3>
          <p className="text-gray-600 text-sm">
            {step === 1 && 'Enter your current PIN to continue'}
            {step === 2 && 'Choose a new PIN (4-6 digits)'}
            {step === 3 && 'Re-enter your new PIN to confirm'}
          </p>
        </div>

        {/* PIN Display */}
        <div className="flex justify-center space-x-2 mb-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`w-10 h-10 border-2 rounded-lg flex items-center justify-center text-lg font-bold ${
                i < getCurrentPin().length
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 bg-gray-50'
              }`}
            >
              {i < getCurrentPin().length ? '•' : ''}
            </div>
          ))}
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-700 text-sm text-center">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <p className="text-green-700 text-sm text-center">{success}</p>
          </div>
        )}

        {/* Number Keypad */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {keypadNumbers.slice(0, 9).map((number) => (
            <button
              key={number}
              type="button"
              onClick={() => handlePinInput(number.toString(), getCurrentField())}
              disabled={isLoading}
              className="h-10 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 
                       rounded-lg text-lg font-semibold transition-colors duration-200 
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {number}
            </button>
          ))}
          
          {/* Bottom row */}
          <button
            type="button"
            onClick={() => handleClear(getCurrentField())}
            disabled={isLoading}
            className="h-10 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 
                     rounded-lg text-xs font-semibold transition-colors duration-200 
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Clear
          </button>
          
          <button
            type="button"
            onClick={() => handlePinInput('0', getCurrentField())}
            disabled={isLoading}
            className="h-10 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 
                     rounded-lg text-lg font-semibold transition-colors duration-200 
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            0
          </button>
          
          <button
            type="button"
            onClick={() => handleBackspace(getCurrentField())}
            disabled={isLoading}
            className="h-10 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 
                     rounded-lg text-xs font-semibold transition-colors duration-200 
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            ⌫
          </button>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={getCurrentPin().length < 4 || isLoading}
              className="w-full h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 
                       text-white font-semibold rounded-lg transition-colors duration-200 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={getCurrentPin().length < 4 || isLoading}
              className="w-full h-10 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500 
                       text-white font-semibold rounded-lg transition-colors duration-200 
                       focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Updating...
                </div>
              ) : (
                'Change PIN'
              )}
            </button>
          )}

          {step > 1 && (
            <button
              onClick={() => {
                if (step === 2) {
                  setStep(1);
                  setNewPin('');
                } else if (step === 3) {
                  setStep(2);
                  setConfirmNewPin('');
                }
              }}
              disabled={isLoading}
              className="w-full h-10 text-gray-600 hover:text-gray-800 transition-colors duration-200"
            >
              ← Back
            </button>
          )}

          <button
            onClick={handleClose}
            disabled={isLoading}
            className="w-full h-10 text-gray-600 hover:text-gray-800 transition-colors duration-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default PinSettings;