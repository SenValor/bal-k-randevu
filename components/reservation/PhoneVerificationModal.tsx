'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, CheckCircle, AlertCircle, MessageCircle } from 'lucide-react';
import { sendVerificationCode, verifyCode, incrementAttempts } from '@/lib/phoneVerification';

interface PhoneVerificationModalProps {
  isOpen: boolean;
  phoneNumber: string;
  onVerified: () => void;
  onCancel: () => void;
}

export default function PhoneVerificationModal({
  isOpen,
  phoneNumber,
  onVerified,
  onCancel,
}: PhoneVerificationModalProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // İlk açılışta kodu gönder
  useEffect(() => {
    if (isOpen) {
      handleSendCode();
    }
  }, [isOpen]);

  // Geri sayım
  useEffect(() => {
    if (countdown > 0 && !canResend) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  // Kod gönder
  const handleSendCode = async () => {
    setSending(true);
    setError('');
    
    const result = await sendVerificationCode(phoneNumber);
    
    if (result.success) {
      setCountdown(60);
      setCanResend(false);
    } else {
      setError(result.error || 'Kod gönderilemedi');
    }
    
    setSending(false);
  };

  // Kodu doğrula
  const handleVerify = async () => {
    if (code.length !== 6) {
      setError('6 haneli kodu girin');
      return;
    }
    
    setLoading(true);
    setError('');
    
    const result = await verifyCode(phoneNumber, code);
    
    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        onVerified();
      }, 1000);
    } else {
      setError(result.error || 'Kod hatalı');
      await incrementAttempts(phoneNumber, code);
      setCode('');
    }
    
    setLoading(false);
  };

  // Enter tuşu ile doğrula
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && code.length === 6) {
      handleVerify();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6"
        >
          {/* Close Button */}
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-[#6B9BC3] to-[#5B8DB8] rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-[#0D2847] mb-2">
              Telefon Doğrulama
            </h2>
            <p className="text-[#1B3A5C]/70">
              <span className="font-semibold">{phoneNumber}</span> numarasına WhatsApp ile gönderilen 6 haneli kodu girin
            </p>
          </div>

          {/* Success State */}
          {success && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex flex-col items-center justify-center py-8"
            >
              <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
              <p className="text-lg font-semibold text-green-600">
                Doğrulama Başarılı!
              </p>
            </motion.div>
          )}

          {/* Input State */}
          {!success && (
            <>
              {/* Code Input */}
              <div className="mb-6">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setCode(value);
                    setError('');
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder="000000"
                  className="w-full text-center text-3xl font-bold tracking-[0.5em] py-4 px-6 border-2 border-[#6B9BC3]/30 rounded-xl focus:border-[#6B9BC3] focus:outline-none transition-colors"
                  disabled={loading || sending}
                  autoFocus
                />
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg"
                >
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-600">{error}</p>
                </motion.div>
              )}

              {/* Verify Button */}
              <button
                onClick={handleVerify}
                disabled={code.length !== 6 || loading}
                className="w-full py-3 px-6 bg-gradient-to-r from-[#6B9BC3] to-[#5B8DB8] hover:from-[#7FADD1] hover:to-[#6B9BC3] text-white font-semibold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all mb-4"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Doğrulanıyor...
                  </span>
                ) : (
                  'Doğrula'
                )}
              </button>

              {/* Resend Button */}
              <button
                onClick={handleSendCode}
                disabled={!canResend || sending}
                className="w-full py-2 text-sm text-[#6B9BC3] hover:text-[#5B8DB8] font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {sending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Gönderiliyor...
                  </span>
                ) : canResend ? (
                  'Tekrar Gönder'
                ) : (
                  `Tekrar gönder (${countdown}s)`
                )}
              </button>

              {/* Help Text */}
              <p className="text-xs text-center text-[#1B3A5C]/50 mt-4">
                Kod 5 dakika içinde geçerlidir. WhatsApp mesajınızı kontrol edin.
              </p>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
