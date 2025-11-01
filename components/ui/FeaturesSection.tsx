"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function FeaturesSection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8]);

  const stats = [
    { value: "10+", label: "Yıllık Deneyim" },
    { value: "500+", label: "Mutlu Müşteri" },
    { value: "15+", label: "Tekne Filosu" },
  ];

  return (
    <section
      ref={ref}
      className="relative py-32 overflow-hidden bg-gradient-to-br from-[#732531] via-[#8B3A3A] to-[#732531]"
    >
      {/* Dark Overlay for Extra Depth */}
      <div className="absolute inset-0 bg-[#732531]/40" />
      
      {/* Animated Background Overlay */}
      <motion.div
        style={{ opacity: useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 0.2, 0.2, 0]), scale }}
        className="absolute inset-0"
      >
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#A04848] rounded-full filter blur-3xl animate-pulse opacity-20" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#722E2E] rounded-full filter blur-3xl animate-pulse opacity-20" 
               style={{ animationDelay: '1s' }} />
        </div>
      </motion.div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-20"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 drop-shadow-lg">
            Neden Balık Sefası?
          </h2>
          <p className="text-white text-lg md:text-xl max-w-2xl mx-auto drop-shadow-md">
            Yıllardır İstanbul Boğazı'nda güvenilir hizmet
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{
                delay: i * 0.2,
                duration: 0.8,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="text-center"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="inline-block"
              >
                <div className="text-6xl md:text-7xl lg:text-8xl font-bold text-[#042b4a] mb-4 drop-shadow-2xl">
                  {stat.value}
                </div>
              </motion.div>
              <p className="text-white text-lg md:text-xl font-medium drop-shadow-lg">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Decorative Elements */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 1 }}
          className="mt-20 flex justify-center gap-2"
        >
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
              }}
              className="w-2 h-2 rounded-full bg-[#E8F4F8]"
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
