"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ReservationButton from "./ReservationButton";
import LightLayer from "./LightLayer";
import GlassCard from "./GlassCard";
import ParticlesLayer from "./ParticlesLayer";
import WavesGrid from "./WavesGrid";
import FishingAnimation from "./FishingAnimation";

export default function HeroCinematic() {
  const ref = useRef(null);
  const router = useRouter();
  const [showFishing, setShowFishing] = useState(false);
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const [targetPage, setTargetPage] = useState<string>('');

  const handleReservationClick = () => {
    setTargetPage('/rezervasyon');
    setShowFishing(true);
  };

  const handlePressClick = () => {
    const pressSection = document.getElementById('basinda-biz');
    if (pressSection) {
      pressSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleGalleryClick = () => {
    const gallerySection = document.getElementById('galeri');
    if (gallerySection) {
      gallerySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleAboutClick = () => {
    const servicesSection = document.getElementById('hizmetler');
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleContactClick = () => {
    const contactSection = document.getElementById('iletisim');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleFaqClick = () => {
    setTargetPage('/sss');
    setShowFishing(true);
  };

  const handleFishingCatch = () => {
    setShowFishing(false);
    if (targetPage) {
      router.push(targetPage);
    }
  };

  // Vision Pro tarzı katmanlı derinlik
  const scaleTitle = useTransform(scrollYProgress, [0, 0.5], [1, 1.2]);
  const yTitle = useTransform(scrollYProgress, [0, 1], [0, -300]);
  const opacityTitle = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  
  const ySubtitle = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const opacitySubtitle = useTransform(scrollYProgress, [0, 0.4], [1, 0]);
  
  const yButton = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const opacityButton = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  // Arka plan katmanları - farklı hızlarda
  const yBg1 = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const yBg2 = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const yBg3 = useTransform(scrollYProgress, [0, 1], [0, 100]);
  
  const scaleBg = useTransform(scrollYProgress, [0, 1], [1, 1.3]);
  const opacityBg = useTransform(scrollYProgress, [0, 0.5, 1], [0.9, 0.6, 0.3]);

  return (
    <section
      ref={ref}
      className="relative h-screen w-full overflow-hidden"
    >
      {/* Olta Animasyonu */}
      {showFishing && <FishingAnimation onCatch={handleFishingCatch} targetPage={targetPage} />}
      
      {/* Arka Plan Katmanları - 3 Derinlik Seviyesi */}
      
      {/* Layer 1 - En uzak (en yavaş) */}
      <motion.div
        style={{ y: yBg1, scale: scaleBg }}
        className="absolute inset-0 z-0"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#E8F4F8] via-[#D5E9F0] to-[#6B9BC3]" />
      </motion.div>

      {/* Layer 2 - Orta (orta hız) */}
      <motion.div
        style={{ y: yBg2, opacity: opacityBg }}
        className="absolute inset-0 z-10"
      >
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
          style={{
            backgroundImage: 'url(/header.png)',
          }}
        />
      </motion.div>

      {/* Layer 3 - Ön (en hızlı) - Dekoratif elementler */}
      <motion.div
        style={{ y: yBg3 }}
        className="absolute inset-0 z-20 pointer-events-none"
      >
        <div className="absolute top-20 left-10 w-64 h-64 bg-[#6B9BC3]/20 rounded-full filter blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#8B3A3A]/20 rounded-full filter blur-3xl" />
      </motion.div>

      {/* Light Layer - Işık parlaması efekti */}
      <div className="absolute inset-0 z-25">
        <LightLayer />
      </div>

      {/* Particles Layer - Süzülen partiküller */}
      <div className="absolute inset-0 z-26">
        <ParticlesLayer />
      </div>

      {/* Waves Grid - Deniz dalgaları grid efekti */}
      <div className="absolute inset-0 z-27 pointer-events-none">
        <WavesGrid 
          direction="diagonal"
          speed={0.3}
          borderColor="rgba(0, 169, 165, 0.12)"
          squareSize={80}
          hoverFillColor="rgba(0, 169, 165, 0.08)"
        />
      </div>

      {/* İçerik Katmanı */}
      <div className="absolute inset-0 flex items-center justify-center z-30">
        <div className="text-center px-5 max-w-5xl mx-auto">
          
          {/* Modern Glass Card Container */}
          <motion.div>
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative max-w-4xl mx-auto"
            >
              {/* Gradient Border */}
              <div className="absolute -inset-[1px] bg-gradient-to-r from-[#00A9A5] via-[#008B87] to-[#00A9A5] rounded-[2rem] opacity-50 blur-sm" />
              
              {/* Glass Card */}
              <div className="relative bg-white/80 backdrop-blur-2xl rounded-[2rem] border border-[#6B9BC3]/30 shadow-2xl p-8 md:p-12 lg:p-16">
                {/* Decorative Corner Elements */}
                <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-[#6B9BC3] rounded-tl-2xl opacity-50" />
                <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-[#6B9BC3] rounded-br-2xl opacity-50" />
                
                {/* Ana Başlık */}
                <motion.h1
                  initial={{ opacity: 0, y: 100, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    duration: 1.2, 
                    ease: [0.22, 1, 0.36, 1],
                    delay: 0.5 
                  }}
                  className="text-5xl md:text-6xl lg:text-7xl font-bold text-[#0D2847] leading-tight tracking-tight"
                  style={{
                    textShadow: '0 2px 10px rgba(107, 155, 195, 0.2)'
                  }}
                >
                  Balık Sefası
                </motion.h1>

                {/* Alt Başlık */}
                <motion.div>
                  <motion.p
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      duration: 1, 
                      ease: [0.22, 1, 0.36, 1],
                      delay: 0.7 
                    }}
                    className="text-base md:text-lg lg:text-xl text-[#1B3A5C]/80 mt-4 mb-8 font-light leading-relaxed"
                  >
                    İstanbul Boğazı'nda yeni nesil balık avı deneyimi
                  </motion.p>
                </motion.div>

                {/* Butonlar */}
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 max-w-6xl mx-auto"
                >
                  {/* SSS Butonu */}
                  <motion.button
                    onClick={handleFaqClick}
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    whileHover={{ scale: 1.05, boxShadow: "0 20px 60px rgba(107, 155, 195, 0.3)" }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ 
                      duration: 0.8, 
                      ease: [0.22, 1, 0.36, 1],
                      delay: 0.8 
                    }}
                    className="group relative px-4 py-3 text-sm font-semibold rounded-xl bg-[#6B9BC3]/10 backdrop-blur-md border-2 border-[#6B9BC3]/30 text-[#1B3A5C] hover:bg-[#6B9BC3]/20 transition-all duration-500 overflow-hidden"
                  >
                    <span className="relative z-10 flex flex-col items-center justify-center gap-1">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs text-center leading-tight">Sıkça Sorulan Sorular</span>
                    </span>
                  </motion.button>

                  {/* Basında Biz Butonu */}
                  <motion.button
                    onClick={handlePressClick}
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    whileHover={{ scale: 1.05, boxShadow: "0 20px 60px rgba(107, 155, 195, 0.3)" }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ 
                      duration: 0.8, 
                      ease: [0.22, 1, 0.36, 1],
                      delay: 0.85 
                    }}
                    className="group relative px-4 py-3 text-sm font-semibold rounded-xl bg-[#6B9BC3]/10 backdrop-blur-md border-2 border-[#6B9BC3]/30 text-[#1B3A5C] hover:bg-[#6B9BC3]/20 transition-all duration-500 overflow-hidden"
                  >
                    <span className="relative z-10 flex flex-col items-center justify-center gap-1">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                      <span className="text-xs">Basında Biz</span>
                    </span>
                  </motion.button>

                  {/* Rezervasyon Butonu (Ana) - Tam Genişlik */}
                  <motion.button
                    onClick={handleReservationClick}
                    initial={{ opacity: 0, y: 30, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    whileHover={{ scale: 1.05, boxShadow: "0 20px 60px rgba(107, 155, 195, 0.6)" }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ 
                      duration: 0.8, 
                      ease: [0.22, 1, 0.36, 1],
                      delay: 1.0 
                    }}
                    className="group relative col-span-1 sm:col-span-2 lg:col-span-6 px-10 py-5 text-xl font-bold rounded-2xl bg-gradient-to-r from-[#6B9BC3] via-[#7FADD1] to-[#6B9BC3] text-white shadow-2xl shadow-[#6B9BC3]/50 hover:shadow-[#6B9BC3]/70 transition-all duration-500 overflow-hidden"
                  >
                    {/* Animated Background */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-[#5B8DB8] via-[#6B9BC3] to-[#5B8DB8]"
                      initial={{ x: '-100%' }}
                      whileHover={{ x: '100%' }}
                      transition={{ duration: 0.6, ease: "easeInOut" }}
                    />
                    
                    {/* Shimmer Effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      animate={{ x: ['-200%', '200%'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    />
                    
                    {/* Content */}
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="tracking-wide">Rezervasyon Yap</span>
                      <motion.svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </motion.svg>
                    </span>
                    
                    {/* Glow Border */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#6B9BC3] via-white to-[#6B9BC3] rounded-2xl opacity-0 group-hover:opacity-100 blur-lg transition-opacity duration-500 -z-10" />
                  </motion.button>

                  {/* Galeri Butonu */}
                  <motion.button
                    onClick={handleGalleryClick}
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    whileHover={{ scale: 1.05, boxShadow: "0 20px 60px rgba(107, 155, 195, 0.3)" }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ 
                      duration: 0.8, 
                      ease: [0.22, 1, 0.36, 1],
                      delay: 0.9 
                    }}
                    className="group relative px-4 py-3 text-sm font-semibold rounded-xl bg-[#6B9BC3]/10 backdrop-blur-md border-2 border-[#6B9BC3]/30 text-[#1B3A5C] hover:bg-[#6B9BC3]/20 transition-all duration-500 overflow-hidden"
                  >
                    <span className="relative z-10 flex flex-col items-center justify-center gap-1">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs">Galeri</span>
                    </span>
                  </motion.button>

                  {/* Hakkımızda Butonu */}
                  <motion.button
                    onClick={handleAboutClick}
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    whileHover={{ scale: 1.05, boxShadow: "0 20px 60px rgba(107, 155, 195, 0.3)" }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ 
                      duration: 0.8, 
                      ease: [0.22, 1, 0.36, 1],
                      delay: 1.15 
                    }}
                    className="group relative px-4 py-3 text-sm font-semibold rounded-xl bg-[#6B9BC3]/10 backdrop-blur-md border-2 border-[#6B9BC3]/30 text-[#1B3A5C] hover:bg-[#6B9BC3]/20 transition-all duration-500 overflow-hidden"
                  >
                    <span className="relative z-10 flex flex-col items-center justify-center gap-1">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs">Hakkımızda</span>
                    </span>
                  </motion.button>

                  {/* İletişim Butonu */}
                  <motion.button
                    onClick={handleContactClick}
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    whileHover={{ scale: 1.05, boxShadow: "0 20px 60px rgba(107, 155, 195, 0.3)" }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ 
                      duration: 0.8, 
                      ease: [0.22, 1, 0.36, 1],
                      delay: 1.2 
                    }}
                    className="group relative px-4 py-3 text-sm font-semibold rounded-xl bg-[#6B9BC3]/10 backdrop-blur-md border-2 border-[#6B9BC3]/30 text-[#1B3A5C] hover:bg-[#6B9BC3]/20 transition-all duration-500 overflow-hidden"
                  >
                    <span className="relative z-10 flex flex-col items-center justify-center gap-1">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs">İletişim</span>
                    </span>
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>

          {/* Dekoratif Alt Metin */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 1 }}
            style={{ opacity: useTransform(scrollYProgress, [0, 0.2], [1, 0]) }}
            className="mt-16 text-[#1B3A5C]/60 text-sm"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              Aşağı kaydırın
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Progress Indicator */}
      <motion.div
        style={{ scaleX: scrollYProgress }}
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal via-teal-light to-teal origin-left z-50"
      />
    </section>
  );
}
