"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export default function GlassCard({ 
  children, 
  className = "",
  delay = 0 
}: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ scale: 1.02, y: -5 }}
      className={`
        relative overflow-hidden
        backdrop-blur-xl bg-white/5
        border border-white/10
        rounded-3xl
        shadow-2xl shadow-black/20
        ${className}
      `}
    >
      {/* Glass shine effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
      
      {/* Animated border glow */}
      <motion.div
        animate={{
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute inset-0 rounded-3xl border border-teal/20"
      />

      {/* Content */}
      <div className="relative z-10 p-8">
        {children}
      </div>

      {/* Bottom glow */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal/50 to-transparent" />
    </motion.div>
  );
}

// Variant for smaller cards
export function GlassCardSmall({ 
  children, 
  className = "",
  delay = 0 
}: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ scale: 1.05 }}
      className={`
        relative overflow-hidden
        backdrop-blur-lg bg-white/5
        border border-white/10
        rounded-2xl
        shadow-xl shadow-black/10
        ${className}
      `}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" />
      <div className="relative z-10 p-4">
        {children}
      </div>
    </motion.div>
  );
}
