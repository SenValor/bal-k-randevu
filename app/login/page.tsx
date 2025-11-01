'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, signup } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password, name, phone);
      }
      
      // URL'den redirect parametresini kontrol et
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect') || '/';
      router.push(redirect);
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#D5E9F0] via-[#C5D9E8] to-[#E8F4F8] flex items-center justify-center p-4 pt-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border-2 border-[#6B9BC3]/40 p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#6B9BC3] to-[#5B8DB8] flex items-center justify-center shadow-lg shadow-[#6B9BC3]/40"
            >
              {isLogin ? (
                <LogIn className="w-10 h-10 text-white" />
              ) : (
                <UserPlus className="w-10 h-10 text-white" />
              )}
            </motion.div>
            <h1 className="text-3xl font-bold text-[#0D2847] mb-2">
              {isLogin ? 'Hoş Geldiniz' : 'Kayıt Olun'}
            </h1>
            <p className="text-[#1B3A5C]/70">
              {isLogin
                ? 'Hesabınıza giriş yapın'
                : 'Yeni bir hesap oluşturun'}
            </p>
          </div>

          {/* Toggle */}
          <div className="flex gap-2 mb-6 p-1 bg-[#6B9BC3]/10 rounded-xl">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 rounded-lg font-medium transition-all ${
                isLogin
                  ? 'bg-gradient-to-r from-[#8B3A3A] to-[#722E2E] text-white shadow-lg'
                  : 'text-[#1B3A5C]/70 hover:text-[#0D2847]'
              }`}
            >
              Giriş Yap
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 rounded-lg font-medium transition-all ${
                !isLogin
                  ? 'bg-gradient-to-r from-[#8B3A3A] to-[#722E2E] text-white shadow-lg'
                  : 'text-[#1B3A5C]/70 hover:text-[#0D2847]'
              }`}
            >
              Kayıt Ol
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name (only for signup) */}
            {!isLogin && (
              <>
                <div>
                  <label className="block text-[#1B3A5C] text-sm font-medium mb-2">
                    Ad Soyad
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="Adınız Soyadınız"
                      className="w-full px-4 py-3 pl-11 bg-white/60 border-2 border-[#6B9BC3]/30 rounded-xl text-[#0D2847] placeholder-[#1B3A5C]/40 focus:border-[#6B9BC3] focus:outline-none transition-all"
                    />
                    <UserPlus className="absolute left-3.5 top-3.5 w-5 h-5 text-[#6B9BC3]" />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[#1B3A5C] text-sm font-medium mb-2">
                    Telefon Numarası
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      placeholder="0531 089 25 37"
                      className="w-full px-4 py-3 pl-11 bg-white/60 border-2 border-[#6B9BC3]/30 rounded-xl text-[#0D2847] placeholder-[#1B3A5C]/40 focus:border-[#6B9BC3] focus:outline-none transition-all"
                    />
                    <svg className="absolute left-3.5 top-3.5 w-5 h-5 text-[#6B9BC3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label className="block text-[#1B3A5C] text-sm font-medium mb-2">
                E-posta
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="ornek@email.com"
                  className="w-full px-4 py-3 pl-11 bg-white/60 border-2 border-[#6B9BC3]/30 rounded-xl text-[#0D2847] placeholder-[#1B3A5C]/40 focus:border-[#6B9BC3] focus:outline-none transition-all"
                />
                <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-[#6B9BC3]" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[#1B3A5C] text-sm font-medium mb-2">
                Şifre
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pl-11 pr-11 bg-white/60 border-2 border-[#6B9BC3]/30 rounded-xl text-[#0D2847] placeholder-[#1B3A5C]/40 focus:border-[#6B9BC3] focus:outline-none transition-all"
                />
                <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-[#6B9BC3]" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-[#6B9BC3] hover:text-[#5B8DB8] transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 bg-gradient-to-r from-[#8B3A3A] to-[#722E2E] hover:from-[#A04848] hover:to-[#8B3A3A] text-white font-semibold rounded-xl shadow-lg shadow-[#8B3A3A]/30 hover:shadow-[#8B3A3A]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Yükleniyor...
                </span>
              ) : (
                <span>{isLogin ? 'Giriş Yap' : 'Kayıt Ol'}</span>
              )}
            </motion.button>
          </form>

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-[#1B3A5C]/70 hover:text-[#0D2847] text-sm transition-colors font-medium"
            >
              ← Ana Sayfaya Dön
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
