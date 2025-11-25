import React, { useState, useEffect } from 'react';
import { Lock, RefreshCw } from 'lucide-react';

interface PinLockProps {
  expectedPin?: string;
  onSuccess: (pin: string) => void;
  onReset?: () => void;
  isSetup?: boolean;
  loginError?: boolean;
  onClearLoginError?: () => void;
}

const PinLock: React.FC<PinLockProps> = ({ 
  expectedPin, 
  onSuccess, 
  onReset, 
  isSetup = false,
  loginError = false,
  onClearLoginError
}) => {
  const [pin, setPin] = useState('');
  const [internalError, setInternalError] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleNumClick = (num: number) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
      setInternalError(false);
      if (onClearLoginError) onClearLoginError();
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setInternalError(false);
    if (onClearLoginError) onClearLoginError();
  };

  // Handle external login error from parent
  useEffect(() => {
    if (loginError) {
      setInternalError(true);
      const timer = setTimeout(() => {
        setPin('');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loginError]);

  useEffect(() => {
    if (pin.length === 4) {
      if (isSetup) {
        onSuccess(pin);
      } else {
        // If we have an expected PIN (resume session), validate locally
        if (expectedPin) {
          if (pin === expectedPin) {
            onSuccess(pin);
          } else {
            setInternalError(true);
            setTimeout(() => setPin(''), 500);
          }
        } else {
          // If no expected PIN (login from cold start), delegate to parent to decrypt/validate
          onSuccess(pin);
        }
      }
    }
  }, [pin, expectedPin, isSetup, onSuccess]);

  if (showResetConfirm) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FFF0F3] dark:bg-gray-900 p-6 text-center">
        <div className="p-4 bg-red-100 rounded-full mb-4">
          <RefreshCw className="text-red-500 w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Reset Application?</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-xs">
          This will permanently delete all your data and settings. You will need to complete onboarding again.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button 
            onClick={onReset}
            className="w-full py-3 bg-red-500 text-white rounded-xl font-bold shadow-md"
          >
            Yes, Reset Everything
          </button>
          <button 
            onClick={() => setShowResetConfirm(false)}
            className="w-full py-3 text-gray-500 font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  const isError = internalError || loginError;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#FFF0F3] dark:bg-gray-900 p-6 transition-colors">
      <div className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-full shadow-sm">
        <Lock className="w-8 h-8 text-[#E84C7C]" />
      </div>
      
      <h2 className="text-2xl font-bold text-[#2D2D2D] dark:text-white mb-2">
        {isSetup ? 'Create a PIN' : 'Welcome Back'}
      </h2>
      <p className="text-gray-500 dark:text-gray-400 mb-8">
        {isSetup ? 'Secure your personal data' : 'Enter your PIN to access KIMI'}
      </p>

      {/* Dots */}
      <div className="flex gap-4 mb-12">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-all duration-300 ${
              i < pin.length 
                ? isError ? 'bg-red-500' : 'bg-[#E84C7C]' 
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
          />
        ))}
      </div>

      {/* Number Pad */}
      <div className="grid grid-cols-3 gap-6 w-full max-w-xs mb-8">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleNumClick(num)}
            className="w-16 h-16 rounded-full bg-white dark:bg-gray-800 text-xl font-semibold text-gray-700 dark:text-gray-200 shadow-sm active:bg-gray-50 dark:active:bg-gray-700 active:scale-95 transition-all flex items-center justify-center mx-auto"
          >
            {num}
          </button>
        ))}
        <div /> {/* Spacer */}
        <button
          onClick={() => handleNumClick(0)}
          className="w-16 h-16 rounded-full bg-white dark:bg-gray-800 text-xl font-semibold text-gray-700 dark:text-gray-200 shadow-sm active:bg-gray-50 dark:active:bg-gray-700 active:scale-95 transition-all flex items-center justify-center mx-auto"
        >
          0
        </button>
        <button
          onClick={handleDelete}
          className="w-16 h-16 rounded-full text-sm font-semibold text-gray-500 dark:text-gray-400 flex items-center justify-center mx-auto active:scale-95 transition-all"
        >
          Del
        </button>
      </div>

      {/* Forgot PIN Link */}
      {!isSetup && onReset && (
        <button 
          onClick={() => setShowResetConfirm(true)}
          className="text-sm text-gray-400 dark:text-gray-500 underline decoration-dotted hover:text-[#E84C7C] transition-colors"
        >
          Forgot PIN? / Reset App
        </button>
      )}
    </div>
  );
};

export default PinLock;