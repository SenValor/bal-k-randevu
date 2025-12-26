'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import HeroCinematic from '@/components/ui/HeroCinematic';
import Services from '@/components/ui/Services';
import PressSection from '@/components/ui/PressSection';
import FeaturesSection from '@/components/ui/FeaturesSection';
import Footer from '@/components/ui/Footer';
import NewYear2026Banner from '@/components/seasonal/NewYear2026Banner';

export default function Home() {
  const [galleryItems, setGalleryItems] = useState<any[]>([]);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        console.log('🔍 Firebase\'den galeri çekiliyor...');
        const querySnapshot = await getDocs(collection(db, 'gallery'));
        console.log('📦 Döküman sayısı:', querySnapshot.size);
        
        if (!querySnapshot.empty) {
          const items = querySnapshot.docs.map(doc => ({
            image: doc.data().image,
            text: doc.data().text,
            order: doc.data().order
          }));
          items.sort((a: any, b: any) => a.order - b.order);
          console.log('✅ Galeri yüklendi:', items);
          setGalleryItems(items as any);
        } else {
          console.log('⚠️ Firebase\'de görsel yok!');
        }
      } catch (error) {
        console.error('❌ Galeri yükleme hatası:', error);
      }
    };
    
    fetchGallery();
  }, []);

  return (
    <main className="overflow-x-hidden bg-[#E8F4F8] snap-y snap-mandatory h-screen overflow-y-scroll">
      {/* 🎊 2026 YILBAŞI TEMASı - Hafif ve Performanslı */}
      <NewYear2026Banner />

      {/* Hero Section - Full Screen */}
      <section className="snap-start h-screen">
        <HeroCinematic />
      </section>
      
      {/* Press Section - Full Screen */}
      <section id="basinda-biz" className="snap-start min-h-screen">
        <PressSection />
      </section>

      {/* Gallery Section - Full Screen */}
      <section id="galeri" className="snap-start min-h-screen relative overflow-hidden bg-gradient-to-b from-[#0D2847] via-[#1B3A5C] to-[#0D2847] py-20">
        <div className="container mx-auto px-4 relative z-10">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <motion.span 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-block text-[#6B9BC3] text-sm font-semibold tracking-[0.2em] uppercase mb-4"
            >
              Anılarımız
            </motion.span>
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Görsellerimiz
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#6B9BC3] to-transparent mx-auto mb-6" />
            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto">
              Denizde yaşadığımız unutulmaz anlardan özel kareler
            </p>
          </motion.div>

          {/* Gallery Grid */}
          {galleryItems.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 border-4 border-[#6B9BC3] border-t-transparent rounded-full mx-auto mb-4 animate-spin" />
              <p className="text-white/60 text-lg">Görseller yükleniyor...</p>
            </div>
          ) : (
            <>
              {/* Desktop: Grid Layout */}
              <div className="hidden md:grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
                {galleryItems.slice(0, 6).map((item, index) => (
                  <Link href="/galeri" key={index}>
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1, duration: 0.6 }}
                      whileHover={{ y: -8 }}
                      className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer bg-white backdrop-blur-sm border border-[#6B9BC3]/30 hover:border-[#6B9BC3] transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-[#6B9BC3]/30"
                    >
                      <Image
                        src={item.image}
                        alt={item.text}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                          <div className="w-12 h-0.5 bg-[#6B9BC3] mb-3" />
                          <h3 className="text-white font-bold text-lg mb-1">
                            {item.text}
                          </h3>
                          <p className="text-white/60 text-sm">Detayları gör</p>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>

              {/* Mobile: Horizontal Scroll */}
              <div className="md:hidden mb-12">
                <div className="overflow-x-auto scrollbar-hide pb-6 -mx-4 px-4">
                  <div className="flex gap-4 w-max">
                    {galleryItems.map((item, index) => (
                      <Link href="/galeri" key={index}>
                        <motion.div
                          initial={{ opacity: 0, x: 30 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.1, duration: 0.5 }}
                          className="group relative w-[280px] h-[280px] rounded-2xl overflow-hidden cursor-pointer bg-white backdrop-blur-sm border border-[#6B9BC3]/30 active:border-[#6B9BC3] transition-all duration-300 shadow-xl flex-shrink-0"
                        >
                          <Image
                            src={item.image}
                            alt={item.text}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                            <div className="absolute bottom-0 left-0 right-0 p-5">
                              <div className="w-10 h-0.5 bg-[#6B9BC3] mb-2" />
                              <h3 className="text-white font-bold text-base mb-1">
                                {item.text}
                              </h3>
                              <p className="text-white/60 text-xs">Detayları gör</p>
                            </div>
                          </div>
                        </motion.div>
                      </Link>
                    ))}
                  </div>
                </div>
                {/* Mobile Scroll Indicator */}
                <div className="flex justify-center">
                  <div className="flex items-center gap-2 text-white/60 text-sm">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                    <span>Kaydırın</span>
                  </div>
                </div>
              </div>

              {/* View All Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 }}
                className="text-center"
              >
                <Link
                  href="/galeri"
                  className="inline-flex items-center gap-3 bg-gradient-to-r from-[#6B9BC3] to-[#5B8DB8] hover:from-[#7FADD1] hover:to-[#6B9BC3] text-white font-semibold px-8 py-4 rounded-full shadow-lg hover:shadow-xl hover:shadow-[#6B9BC3]/30 transition-all duration-300 group"
                >
                  <span>Tüm Görselleri Gör</span>
                  <svg 
                    className="w-5 h-5 group-hover:translate-x-1 transition-transform" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </motion.div>
            </>
          )}
        </div>

        {/* Background Decoration */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-[#6B9BC3]/10 rounded-full filter blur-3xl" />
        <div className="absolute bottom-20 left-10 w-72 h-72 bg-[#6B9BC3]/10 rounded-full filter blur-3xl" />
      </section>

      {/* Services Section - Full Screen */}
      <section id="hizmetler" className="snap-start min-h-screen">
        <Services />
      </section>

      {/* Features Section - Full Screen */}
      <section id="hakkimizda" className="snap-start min-h-screen">
        <FeaturesSection />
      </section>

      {/* Footer */}
      <section id="iletisim" className="snap-start min-h-screen">
        <Footer />
      </section>
    </main>
  );
}
