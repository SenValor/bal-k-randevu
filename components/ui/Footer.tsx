'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Facebook, Instagram, Twitter } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [aboutText, setAboutText] = useState('İstanbul Boğazı\'nda unutulmaz balık avı deneyimleri ve tekne turları. Profesyonel ekibimiz ve modern teknelerimizle hizmetinizdeyiz.');

  useEffect(() => {
    const fetchAboutText = async () => {
      try {
        const docRef = doc(db, 'settings', 'about');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.description) {
            setAboutText(data.description);
          }
        }
      } catch (error) {
        console.error('Hakkımızda metni yükleme hatası:', error);
      }
    };

    fetchAboutText();
  }, []);

  const footerLinks = {
    hizmetler: [
      { label: 'Tekne Kiralama', href: '/rezervasyon' },
      { label: 'Balık Avı Turu', href: '/rezervasyon' },
      { label: 'Grup Rezervasyon', href: '/rezervasyon' },
      { label: 'Özel Organizasyon', href: '/iletisim' },
      { label: 'Rezervasyon Sorgula', href: '/rezervasyon-sorgula' },
    ],
    kurumsal: [
      { label: 'Hakkımızda', href: '/hakkimizda' },
      { label: 'Galeri', href: '/galeri' },
      { label: 'İletişim', href: '/iletisim' },
      { label: 'Sıkça Sorulan Sorular', href: '/sss' },
      { label: 'Gizlilik Politikası', href: '/privacy-policy' },
      { label: 'Kullanım Koşulları', href: '/terms-of-service' },
      { label: 'Veri Silme', href: '/data-deletion' },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: 'https://www.facebook.com/p/Balık-Sefası-100083362669925/', label: 'Facebook' },
    { icon: Instagram, href: 'https://www.instagram.com/balik.sefasi/', label: 'Instagram' },
  ];

  return (
    <footer className="relative bg-gradient-to-b from-[#E8F4F8] via-[#D5E9F0] to-[#F5FAFB] border-t border-[#6B9BC3]/20 pt-32">
      {/* Decorative Wave */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#6B9BC3] to-transparent" />
      
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-16">
        {/* Main Footer Content - 2x2 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
          
          {/* Sol Üst: Brand Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="relative w-16 h-16">
                <Image
                  src="/logo.png"
                  alt="Balık Sefası Logo"
                  width={64}
                  height={64}
                  className="object-contain rounded-full shadow-lg shadow-[#6B9BC3]/30"
                />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[#0D2847]">Balık Sefası</h3>
                <p className="text-[#8B3A3A] text-sm font-semibold">İstanbul Boğazı</p>
              </div>
            </div>
            <p className="text-[#1B3A5C]/70 mb-6 leading-relaxed">
              {aboutText}
            </p>
          </motion.div>

          {/* Sağ Üst: Hizmetler & Kurumsal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-2 gap-8"
          >
            {/* Hizmetler */}
            <div>
              <h4 className="text-[#0D2847] font-bold text-lg mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-[#6B9BC3] rounded-full" />
                Hizmetlerimiz
              </h4>
              <ul className="space-y-3">
                {footerLinks.hizmetler.map((link, index) => (
                  <li key={index}>
                    <Link 
                      href={link.href}
                      className="text-[#1B3A5C]/70 hover:text-[#6B9BC3] transition-colors flex items-center gap-2 group text-sm"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#6B9BC3]/30 group-hover:bg-[#6B9BC3] transition-colors" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Kurumsal */}
            <div>
              <h4 className="text-[#0D2847] font-bold text-lg mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-[#8B3A3A] rounded-full" />
                Kurumsal
              </h4>
              <ul className="space-y-3">
                {footerLinks.kurumsal.map((link, index) => (
                  <li key={index}>
                    <Link 
                      href={link.href}
                      className="text-[#1B3A5C]/70 hover:text-[#8B3A3A] transition-colors flex items-center gap-2 group text-sm"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8B3A3A]/30 group-hover:bg-[#8B3A3A] transition-colors" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#6B9BC3]/30 to-transparent mb-8" />

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col md:flex-row items-center justify-between gap-6"
        >
          {/* Copyright */}
          <p className="text-[#1B3A5C]/60 text-sm text-center md:text-left">
            © {currentYear} Balık Sefası. Tüm hakları saklıdır.
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            {socialLinks.map((social, index) => (
              <motion.a
                key={index}
                href={social.href}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="w-10 h-10 rounded-lg bg-[#6B9BC3]/10 hover:bg-[#6B9BC3]/20 border border-[#6B9BC3]/30 hover:border-[#6B9BC3] flex items-center justify-center text-[#1B3A5C]/70 hover:text-[#6B9BC3] transition-all"
                aria-label={social.label}
              >
                <social.icon className="w-5 h-5" />
              </motion.a>
            ))}
          </div>

          {/* Made with Love */}
          <p className="text-[#1B3A5C]/60 text-sm flex items-center gap-2">
            Made with <span className="text-[#8B3A3A] animate-pulse">❤️</span> in Istanbul
          </p>
        </motion.div>
      </div>

      {/* Bottom Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-[#6B9BC3]/50 to-transparent" />
    </footer>
  );
}
