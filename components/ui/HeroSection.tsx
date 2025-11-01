"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import ReservationButton from "./ReservationButton";

export default function HeroSection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Apple tarzı parallax efektleri
  const yText = useTransform(scrollYProgress, [0, 1], [0, -250]);
  const opacityText = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const yBg = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 0.5, 0.2]);

  return (
    <section
      ref={ref}
      className="relative h-[120vh] flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Background Image with Parallax */}
      <motion.div
        style={{ y: yBg, scale }}
        className="absolute inset-0 bg-gradient-to-br from-navy-dark via-navy to-navy-light"
      >
        <motion.div
          style={{ opacity }}
          className="absolute inset-0"
        >
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1559827260-dc66d52bef19?q=80&w=2070&auto=format&fit=crop)',
            }}
          />
        </motion.div>
        {/* Darker Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-navy-dark/90 via-navy/70 to-navy-dark/90" />
      </motion.div>

      {/* Hero Content with Scroll Animation */}
      <motion.div
        style={{ y: yText, opacity: opacityText }}
        className="relative z-10 text-center px-5 max-w-4xl mx-auto"
      >
        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold text-white drop-shadow-2xl leading-tight"
        >
          İstanbul Boğazı'nda
          <br />
          <span className="text-teal-light">Unutulmaz Anlar</span>
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="text-white/90 text-lg md:text-xl lg:text-2xl mt-6 mb-10 drop-shadow-lg"
        >
          Tekne kiralama ve balık avı turlarıyla denizin tadını çıkarın
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <ReservationButton size="lg" />
        </motion.div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        style={{ opacity: useTransform(scrollYProgress, [0, 0.2], [1, 0]) }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-6 h-10 border-2 border-white/50 rounded-full flex items-start justify-center p-2"
        >
          <motion.div className="w-1.5 h-1.5 bg-white/80 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}
