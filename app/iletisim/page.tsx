'use client';

import { motion } from 'framer-motion';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function IletisimPage() {

  const contactInfo = [
    {
      icon: Phone,
      title: 'Telefon',
      content: '+90 531 089 25 37',
      href: 'tel:+905310892537',
    },
    {
      icon: Mail,
      title: 'E-posta',
      content: 'iletisimbaliksefasi@gmail.com',
      href: 'mailto:iletisimbaliksefasi@gmail.com',
    },
    {
      icon: MapPin,
      title: 'Adres',
      content: 'Eyüp Odabaşı Sporcular Parkı, Yenimahalle Mah. Yeni Mahalle Cd, 34450 Sarıyer/İstanbul',
      href: 'https://maps.app.goo.gl/CDDsJdyxKzt8KkVr8',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E8F4F8] via-[#D5E9F0] to-[#F5FAFB] pt-24">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-[#0D2847] mb-4">
            İletişim
          </h1>
          <p className="text-xl text-[#6B9BC3] font-medium">
            Bizimle iletişime geçin
          </p>
        </motion.div>

        {/* Contact Info Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
          {contactInfo.map((info, index) => (
            <motion.a
              key={index}
              href={info.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/90 backdrop-blur-xl border-2 border-[#6B9BC3]/30 rounded-2xl p-6 hover:border-[#6B9BC3] hover:bg-[#6B9BC3]/5 transition-all group shadow-md"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-[#6B9BC3]/20 rounded-full flex items-center justify-center mb-4 group-hover:bg-[#6B9BC3]/30 transition-colors">
                  <info.icon className="w-8 h-8 text-[#6B9BC3]" />
                </div>
                <h3 className="text-[#0D2847] font-semibold text-lg mb-2">
                  {info.title}
                </h3>
                <p className="text-[#1B3A5C]/70">
                  {info.content}
                </p>
              </div>
            </motion.a>
          ))}
        </div>

        {/* Map Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="max-w-5xl mx-auto mt-16"
        >
          <div className="bg-white/90 backdrop-blur-xl border-2 border-[#6B9BC3]/30 rounded-3xl p-4 overflow-hidden shadow-xl">
            <div className="aspect-video rounded-2xl overflow-hidden">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3005.3947537896847!2d29.024416776538894!3d41.16322097133178!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14cab5f8a5f8a5f8%3A0x5f8a5f8a5f8a5f8a!2sEy%C3%BCp%20Odaba%C5%9F%C4%B1%20Sporcular%20Park%C4%B1!5e0!3m2!1str!2str!4v1730415000000!5m2!1str!2str"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Balık Sefası - Eyüp Odabaşı Sporcular Parkı"
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="border-t border-[#6B9BC3]/20 bg-white/80 backdrop-blur-md py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-white/60">
          <p className="text-[#1B3A5C]/70">© 2024 Balık Sefası. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </div>
  );
}
