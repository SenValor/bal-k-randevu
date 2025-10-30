'use client';

import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
}

class ChromeErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Chrome Error Boundary yakaladı:', error, errorInfo);
    
    // Chrome'a özel hata analizi
    if (error.message?.includes('Firebase') || 
        error.message?.includes('permission') ||
        error.message?.includes('Missing or insufficient permissions')) {
      
      console.warn('🔍 Chrome Firebase hatası tespit edildi:', {
        userAgent: navigator.userAgent,
        isChrome: navigator.userAgent.includes('Chrome'),
        error: error.message,
        stack: error.stack
      });
      
      // Chrome için özel retry mekanizması
      setTimeout(() => {
        console.log('🔄 Chrome hatası sonrası otomatik yenileme deneniyor...');
        this.setState({ hasError: false });
      }, 3000);
    }
    
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-200 p-6 text-center">
            <div className="text-6xl mb-4">🔧</div>
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              Bağlantı Sorunu
            </h2>
            <p className="text-slate-600 mb-6">
              Chrome tarayıcısında geçici bir sorun oluştu. Sistem otomatik olarak düzeltmeye çalışıyor...
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                🔄 Sayfayı Yenile
              </button>
              
              <button
                onClick={() => this.setState({ hasError: false })}
                className="w-full bg-gray-100 hover:bg-gray-200 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                ↩️ Tekrar Dene
              </button>
            </div>
            
            <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800">
                💡 <strong>İpucu:</strong> Chrome'da sorun devam ederse, sayfayı yenileyip tekrar deneyin.
              </p>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500">
                  Geliştirici Detayları
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ChromeErrorBoundary;
