'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

const APP_STORE_URL = 'https://apps.apple.com/tr/app/bal%C4%B1k-sefas%C4%B1/id6745787870';
const APK_URL = '/baliksefasi.apk'; // APK'yı /public klasörüne koy

const features = [
  { icon: '🎣', text: 'Online rezervasyon' },
  { icon: '📍', text: 'Kalkış noktası haritası' },
  { icon: '🌤️', text: 'Anlık hava durumu' },
  { icon: '🔔', text: 'Anlık bildirimler' },
];

export default function AppDownloadSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#001428] via-[#002244] to-[#001835] py-20 px-4">
      {/* Dekoratif arka plan */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#00A9A5]/10 rounded-full filter blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#0066CC]/10 rounded-full filter blur-3xl" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Üst rozet */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex justify-center mb-10"
        >
          <div className="flex items-center gap-2 bg-[#00A9A5]/15 border border-[#00A9A5]/30 text-[#00A9A5] text-xs font-bold tracking-widest uppercase px-5 py-2 rounded-full">
            <span className="w-2 h-2 bg-[#00A9A5] rounded-full animate-pulse" />
            Uygulamamız Yayında
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Sol: Yazılar + butonlar */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="flex flex-col gap-8"
          >
            <div>
              <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">
                Balık Sefası<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00A9A5] to-[#6B9BC3]">
                  Cebinizde
                </span>
              </h2>
              <p className="text-white/60 text-lg leading-relaxed">
                Rezervasyon yapın, tekne filosumuzu keşfedin, anlık hava durumunu takip edin. Tüm bunlar tek uygulamada.
              </p>
            </div>

            {/* Özellikler */}
            <div className="grid grid-cols-2 gap-3">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                >
                  <span className="text-xl">{f.icon}</span>
                  <span className="text-white/80 text-sm font-medium">{f.text}</span>
                </motion.div>
              ))}
            </div>

            {/* İndirme butonları */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* App Store */}
              <motion.a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-4 bg-white text-[#001428] px-6 py-4 rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-shadow group"
              >
                <svg className="w-8 h-8 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <div>
                  <div className="text-xs text-[#001428]/60 leading-none mb-0.5">İndir</div>
                  <div className="text-base font-bold leading-none">App Store</div>
                </div>
              </motion.a>

              {/* Android APK */}
              <motion.a
                href={APK_URL}
                download
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-4 bg-[#00A9A5] text-white px-6 py-4 rounded-2xl font-semibold shadow-xl hover:shadow-[#00A9A5]/40 hover:shadow-2xl transition-shadow group"
              >
                <svg className="w-8 h-8 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.523 15.341a.95.95 0 0 1-.95.95H7.427a.95.95 0 0 1-.95-.95V8.66a.95.95 0 0 1 .95-.95h9.146a.95.95 0 0 1 .95.95v6.681zm-1.376-8.568L17.5 4.5l-1.374 2.273H7.874L6.5 4.5l1.353 2.273H4.5v15h15V6.773h-3.353zM9.5 4.123c0-.345.28-.623.625-.623s.625.278.625.623-.28.623-.625.623S9.5 4.468 9.5 4.123zm4.25 0c0-.345.28-.623.625-.623s.625.278.625.623-.28.623-.625.623-.625-.278-.625-.623z"/>
                </svg>
                <div>
                  <div className="text-xs text-white/70 leading-none mb-0.5">Android APK</div>
                  <div className="text-base font-bold leading-none">Direkt İndir</div>
                </div>
              </motion.a>
            </div>

            <p className="text-white/30 text-xs">
              Android APK kurulum için: Ayarlar → Güvenlik → Bilinmeyen kaynaklara izin ver
            </p>
          </motion.div>

          {/* Sağ: Telefon mockup */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="flex justify-center"
          >
            <div className="relative">
              {/* Glow */}
              <div className="absolute inset-0 bg-[#00A9A5]/20 rounded-[3rem] filter blur-3xl scale-110" />

              {/* Telefon çerçevesi */}
              <div className="relative w-[260px] bg-[#0A1628] border-2 border-white/10 rounded-[3rem] p-3 shadow-2xl">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#0A1628] border-b-2 border-x-2 border-white/10 rounded-b-2xl z-10" />

                {/* Ekran içeriği */}
                <div className="bg-[#001428] rounded-[2.5rem] overflow-hidden aspect-[9/19.5]">
                  <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-6">
                    <Image
                      src="/logo.png"
                      alt="Balık Sefası"
                      width={100}
                      height={100}
                      className="rounded-full border-2 border-[#00A9A5]/30"
                    />
                    <div className="text-center">
                      <div className="text-white font-bold text-base">Balık Sefası</div>
                      <div className="text-[#00A9A5] text-xs mt-1">Tekne Turu & Rezervasyon</div>
                    </div>
                    <div className="w-full space-y-2 mt-2">
                      {['Tekneler', 'Rezervasyon', 'Hava Durumu'].map((item) => (
                        <div key={item} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 flex items-center justify-between">
                          <span className="text-white/70 text-xs">{item}</span>
                          <div className="w-4 h-4 rounded-full bg-[#00A9A5]/20 border border-[#00A9A5]/40" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Rating rozeti */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                className="absolute -right-6 top-16 bg-white rounded-2xl px-4 py-3 shadow-xl"
              >
                <div className="text-yellow-500 text-xs font-bold">★★★★★</div>
                <div className="text-[#001428] text-xs font-semibold mt-0.5">App Store</div>
              </motion.div>

              {/* İndirme rozeti */}
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut', delay: 0.5 }}
                className="absolute -left-8 bottom-20 bg-[#00A9A5] rounded-2xl px-4 py-3 shadow-xl"
              >
                <div className="text-white text-xs font-bold">Ücretsiz</div>
                <div className="text-white/80 text-xs mt-0.5">İndir & Kullan</div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
