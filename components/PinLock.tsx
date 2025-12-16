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
        if (expectedPin) {
          if (pin === expectedPin) {
            onSuccess(pin);
          } else {
            setInternalError(true);
            setTimeout(() => setPin(''), 500);
          }
        } else {
          onSuccess(pin);
        }
      }
    }
  }, [pin, expectedPin, isSetup, onSuccess]);

  if (showResetConfirm) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <div className="p-4 neu-pressed rounded-full mb-6 text-red-500">
          <RefreshCw className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Reset Application?</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-xs">
          This will permanently delete all your data and settings. You will need to complete onboarding again.
        </p>
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button 
            onClick={onReset}
            className="neu-btn w-full py-4 text-red-500 border-red-200"
          >
            Yes, Reset Everything
          </button>
          <button 
            onClick={() => setShowResetConfirm(false)}
            className="neu-flat w-full py-4 text-gray-500 font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  const isError = internalError || loginError;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 transition-colors">
      <div className="mb-8 p-6 neu-flat rounded-full">
        <Lock className="w-8 h-8 text-[#E84C7C]" />
      </div>
      
      <h2 className="text-2xl font-bold text-[#2D2D2D] dark:text-white mb-2">
        {isSetup ? 'Create a PIN' : 'Welcome Back'}
      </h2>
      <p className={`mb-8 transition-colors ${isError ? 'text-red-500 font-bold' : 'text-gray-500 dark:text-gray-400'}`}>
        {isError ? 'Wrong PIN entered' : (isSetup ? 'Secure your personal data' : 'Enter your PIN to access KIMI')}
      </p>

      {/* Dots */}
      <div className="flex gap-6 mb-12">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-all duration-300 ${
              i < pin.length 
                ? isError ? 'bg-red-500 shadow-md' : 'neu-active bg-[#E84C7C] scale-110' 
                : 'neu-pressed'
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
            className="neu-btn-round w-16 h-16 text-2xl font-semibold"
          >
            {num}
          </button>
        ))}
        <div /> {/* Spacer */}
        <button
          onClick={() => handleNumClick(0)}
          className="neu-btn-round w-16 h-16 text-2xl font-semibold"
        >
          0
        </button>
        <button
          onClick={handleDelete}
          className="w-16 h-16 flex items-center justify-center font-bold text-gray-500 active:scale-95 transition-all"
        >
          Del
        </button>
      </div>

      {/* Forgot PIN Link */}
      {!isSetup && onReset && (
        <button 
          onClick={() => setShowResetConfirm(true)}
          className="text-xs text-gray-400 dark:text-gray-500 underline decoration-dotted hover:text-[#E84C7C] transition-colors"
        >
          Forgot PIN? / Reset App
        </button>
      )}
    </div>
  );
};

export default PinLock;