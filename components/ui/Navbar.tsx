'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Phone, Calendar, User, LogOut, Search } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleReservationClick = () => {
    // Her durumda rezervasyon sayfasına git
    // Sayfa kendi auth kontrolünü yapacak
    router.push('/rezervasyon');
  };

  const navLinks = [
    { href: '/', label: 'Ana Sayfa' },
    { href: '/rezervasyon', label: 'Rezervasyon' },
    { href: '/galeri', label: 'Galeri' },
    { href: '/hakkimizda', label: 'Hakkımızda' },
    { href: '/iletisim', label: 'İletişim' },
    { href: '/sss', label: 'SSS' },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? 'bg-[#1B3A5C]/95 backdrop-blur-xl shadow-2xl border-b border-[#6B9BC3]/20'
            : 'bg-gradient-to-b from-black/40 to-transparent backdrop-blur-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative w-12 h-12"
              >
                <Image
                  src="/logo.png"
                  alt="Balık Sefası Logo"
                  width={48}
                  height={48}
                  className="object-contain rounded-full shadow-lg shadow-[#6B9BC3]/30 group-hover:shadow-[#6B9BC3]/50 transition-all"
                  priority
                />
              </motion.div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-white tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  Balık Sefası
                </span>
                <span className="text-xs text-[#6B9BC3] font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  İstanbul Boğazı
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative text-white/80 hover:text-white font-medium transition-colors group"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#6B9BC3] to-[#5B8DB8] group-hover:w-full transition-all duration-300" />
                </Link>
              ))}
            </div>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-4">
              {/* Rezervasyon Sorgula */}
              <motion.button
                onClick={() => router.push('/rezervasyon-sorgula')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00A9A5]/10 hover:bg-[#00A9A5]/20 border border-[#00A9A5]/30 hover:border-[#00A9A5]/50 text-[#00A9A5] transition-all"
              >
                <Search className="w-4 h-4" />
                <span className="text-sm font-medium">Rezervasyon Sorgula</span>
              </motion.button>

              {/* Phone */}
              <motion.a
                href="tel:+905551234567"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#00A9A5]/50 text-white transition-all"
              >
                <Phone className="w-4 h-4" />
                <span className="text-sm font-medium">0555 123 45 67</span>
              </motion.a>

              {user ? (
                <>
                  {/* User Profile */}
                  <motion.button
                    onClick={() => router.push('/profile')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#6B9BC3]/50 text-white transition-all"
                  >
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium">Profilim</span>
                  </motion.button>

                  {/* Logout */}
                  <motion.button
                    onClick={handleLogout}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 text-red-400 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-medium">Çıkış</span>
                  </motion.button>
                </>
              ) : (
                <>
                  {/* Login */}
                  <motion.button
                    onClick={() => router.push('/login')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#6B9BC3]/50 text-white font-medium transition-all"
                  >
                    Giriş Yap
                  </motion.button>

                  {/* CTA Button */}
                  <motion.button
                    onClick={handleReservationClick}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#8B3A3A] to-[#722E2E] hover:from-[#A04848] hover:to-[#8B3A3A] text-white font-semibold shadow-lg shadow-[#8B3A3A]/30 hover:shadow-[#8B3A3A]/50 transition-all"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Rezervasyon Yap</span>
                  </motion.button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed top-20 left-0 right-0 z-40 lg:hidden bg-[#E8F4F8]/98 backdrop-blur-xl border-b border-[#6B9BC3]/30 shadow-2xl"
          >
            <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
              {/* Mobile Nav Links */}
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-4 py-3 rounded-xl bg-white hover:bg-[#6B9BC3]/10 border-2 border-[#6B9BC3]/30 hover:border-[#6B9BC3] text-[#0D2847] font-medium transition-all"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}

              {/* Mobile Actions */}
              <div className="pt-4 border-t border-[#6B9BC3]/30 space-y-3">
                {/* Rezervasyon Sorgula */}
                <button
                  onClick={() => {
                    router.push('/rezervasyon-sorgula');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#00A9A5]/10 hover:bg-[#00A9A5]/20 border-2 border-[#00A9A5]/50 text-[#00A9A5] font-semibold transition-all"
                >
                  <Search className="w-4 h-4" />
                  <span>Rezervasyon Sorgula</span>
                </button>

                <a
                  href="tel:+905551234567"
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white hover:bg-[#6B9BC3]/10 border-2 border-[#6B9BC3]/30 text-[#0D2847] font-medium transition-all"
                >
                  <Phone className="w-4 h-4" />
                  <span>0555 123 45 67</span>
                </a>

                {user ? (
                  <>
                    <button
                      onClick={() => {
                        router.push('/profile');
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white hover:bg-[#6B9BC3]/10 border-2 border-[#6B9BC3]/30 text-[#0D2847] font-medium transition-all"
                    >
                      <User className="w-4 h-4" />
                      <span>Profilim</span>
                    </button>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border-2 border-red-500/50 text-red-600 font-medium transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Çıkış Yap</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        router.push('/login');
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full px-4 py-3 rounded-xl bg-white hover:bg-[#6B9BC3]/10 border-2 border-[#6B9BC3]/30 text-[#0D2847] font-medium transition-all"
                    >
                      Giriş Yap
                    </button>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleReservationClick();
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#8B3A3A] to-[#722E2E] text-white font-semibold shadow-lg shadow-[#8B3A3A]/30 transition-all"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Rezervasyon Yap</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
