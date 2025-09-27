'use client';

import React from 'react';

interface ChromeLoadingSpinnerProps {
  message?: string;
  showRetry?: boolean;
  onRetry?: () => void;
}

const ChromeLoadingSpinner: React.FC<ChromeLoadingSpinnerProps> = ({ 
  message = "Yükleniyor...", 
  showRetry = false,
  onRetry 
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      {/* Chrome-optimized spinner */}
      <div className="relative">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
        <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-r-blue-300 rounded-full animate-spin" 
             style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
      </div>
      
      {/* Loading message */}
      <div className="text-center">
        <p className="text-slate-600 font-medium">{message}</p>
        <p className="text-sm text-slate-400 mt-1">
          Chrome için optimize ediliyor...
        </p>
      </div>
      
      {/* Retry button for Chrome issues */}
      {showRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          🔄 Tekrar Dene
        </button>
      )}
      
      {/* Chrome-specific tips */}
      <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg max-w-md">
        <p className="text-xs text-blue-800 text-center">
          💡 <strong>Chrome İpucu:</strong> Yavaş yüklenme durumunda sayfayı yenileyin
        </p>
      </div>
    </div>
  );
};

export default ChromeLoadingSpinner;
