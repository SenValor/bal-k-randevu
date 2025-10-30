'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { User, Phone, Mail, Lock, Loader2 } from 'lucide-react';
import { registerUser } from '@/lib/authHelpers';
import { useAuth } from '@/context/AuthContext';

interface RegisterFormProps {
  onSubmit: () => void;
}

export default function RegisterForm({ onSubmit }: RegisterFormProps) {
  const { refreshUserData } = useAuth();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Basic validation
    if (!form.name || !form.phone || !form.email || !form.password) {
      setError('Lütfen tüm alanları doldurun');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError('Geçerli bir e-posta adresi girin');
      return;
    }

    // Phone validation (basic Turkish phone format)
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(form.phone.replace(/\s/g, ''))) {
      setError('Geçerli bir telefon numarası girin (10-11 rakam)');
      return;
    }

    // Password validation
    if (form.password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır');
      return;
    }

    setLoading(true);

    try {
      // Firebase authentication
      const result = await registerUser(
        form.name,
        form.email,
        form.password,
        form.phone
      );

      if (result.success) {
        console.log('Kayıt başarılı:', result.user);
        // Kullanıcı verilerini yenile
        await refreshUserData();
        onSubmit();
      } else {
        setError(result.error || 'Kayıt sırasında bir hata oluştu');
      }
    } catch (err) {
      console.error('Kayıt hatası:', err);
      setError('Beklenmeyen bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const inputVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
        >
          {error}
        </motion.div>
      )}

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.1,
            },
          },
        }}
        className="space-y-4"
      >
        {/* Name Input */}
        <motion.div variants={inputVariants} className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
            <User className="w-5 h-5" />
          </div>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Ad Soyad"
            disabled={loading}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/40 focus:border-[#00A9A5] focus:bg-white/10 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </motion.div>

        {/* Phone Input */}
        <motion.div variants={inputVariants} className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
            <Phone className="w-5 h-5" />
          </div>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Telefon Numarası"
            disabled={loading}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/40 focus:border-[#00A9A5] focus:bg-white/10 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </motion.div>

        {/* Email Input */}
        <motion.div variants={inputVariants} className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
            <Mail className="w-5 h-5" />
          </div>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="E-posta"
            disabled={loading}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/40 focus:border-[#00A9A5] focus:bg-white/10 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </motion.div>

        {/* Password Input */}
        <motion.div variants={inputVariants} className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
            <Lock className="w-5 h-5" />
          </div>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Şifre"
            disabled={loading}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/40 focus:border-[#00A9A5] focus:bg-white/10 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </motion.div>

        {/* Submit Button */}
        <motion.button
          variants={inputVariants}
          type="submit"
          disabled={loading}
          whileHover={!loading ? { scale: 1.02 } : {}}
          whileTap={!loading ? { scale: 0.97 } : {}}
          className="w-full py-4 mt-2 bg-gradient-to-r from-[#00A9A5] to-[#008B87] text-white font-bold rounded-2xl shadow-lg shadow-[#00A9A5]/30 hover:shadow-xl hover:shadow-[#00A9A5]/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Kayıt Yapılıyor...</span>
            </>
          ) : (
            'Kayıt Ol ve Devam Et'
          )}
        </motion.button>
      </motion.div>
    </form>
  );
}
