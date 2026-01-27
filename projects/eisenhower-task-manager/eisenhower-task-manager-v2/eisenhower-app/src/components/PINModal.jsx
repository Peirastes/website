import React, { useState } from 'react';
import { Lock, AlertCircle } from 'lucide-react';

/**
 * PIN Protection Modal
 * Provides courtesy lock screen - NOT a security feature
 * PIN is hardcoded and visible in source
 * Session-based unlock (clears on tab close)
 */
export const PINModal = ({ onUnlock }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  const CORRECT_PIN = '1234';
  const MAX_ATTEMPTS = 5;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (pin === CORRECT_PIN) {
      sessionStorage.setItem('eisenhower-unlocked', 'true');
      setError('');
      onUnlock();
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setError('Incorrect PIN. Try again.');
      setPin('');

      if (newAttempts >= MAX_ATTEMPTS) {
        setError(`Too many attempts. Please refresh the page and try again.`);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-3 rounded-full">
              <Lock className="text-white" size={28} />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-indigo-900 bg-clip-text text-transparent">
            Eisenhower Task Manager
          </h1>
          <p className="text-slate-600 text-sm font-medium">
            Enter PIN to access
          </p>
        </div>

        {/* PIN Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError('');
              }}
              onKeyDown={handleKeyDown}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-center text-2xl font-mono tracking-widest transition-all"
              placeholder="••••"
              autoFocus
              disabled={attempts >= MAX_ATTEMPTS}
              maxLength="4"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Attempt Counter */}
          {attempts > 0 && attempts < MAX_ATTEMPTS && (
            <p className="text-xs text-slate-500 text-center">
              Attempt {attempts} of {MAX_ATTEMPTS}
            </p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={attempts >= MAX_ATTEMPTS || pin.length !== 4}
            className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-3 rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all shadow-lg shadow-indigo-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {attempts >= MAX_ATTEMPTS ? 'Locked - Refresh to try again' : 'Unlock'}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center text-xs text-slate-500 space-y-2 border-t border-slate-200 pt-4">
          <p>🔐 Session-based protection</p>
          <p>PIN clears when you close this tab</p>
        </div>
      </div>
    </div>
  );
};
