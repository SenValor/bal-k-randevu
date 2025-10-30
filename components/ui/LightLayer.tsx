"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect } from "react";

export default function LightLayer() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth spring animation for mouse movement
  const springConfig = { damping: 25, stiffness: 150 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize mouse position to -1 to 1 range
      const xPercent = (e.clientX / window.innerWidth - 0.5) * 2;
      const yPercent = (e.clientY / window.innerHeight - 0.5) * 2;
      
      mouseX.set(xPercent * 100);
      mouseY.set(yPercent * 100);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Main Glow - Follows Mouse */}
      <motion.div
        style={{ x, y }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      >
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="w-[600px] h-[600px] rounded-full bg-gradient-radial from-teal/40 via-teal/20 to-transparent blur-3xl"
        />
      </motion.div>

      {/* Secondary Glow - Top Right */}
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
          x: [0, 50, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-gradient-radial from-teal-light/30 via-teal/15 to-transparent blur-3xl"
      />

      {/* Tertiary Glow - Bottom Left */}
      <motion.div
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.15, 0.35, 0.15],
          x: [0, -40, 0],
          y: [0, 40, 0],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
        className="absolute bottom-0 left-0 w-[450px] h-[450px] rounded-full bg-gradient-radial from-navy-light/30 via-navy/15 to-transparent blur-3xl"
      />

      {/* Lens Flare Effect */}
      <motion.div
        style={{ x: useSpring(mouseX, { damping: 30, stiffness: 100 }) }}
        className="absolute top-1/4 left-1/3"
      >
        <motion.div
          animate={{
            opacity: [0.1, 0.3, 0.1],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="w-32 h-32 rounded-full bg-white/20 blur-2xl"
        />
      </motion.div>

      {/* Small Accent Lights */}
      <motion.div
        animate={{
          opacity: [0.2, 0.6, 0.2],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
        className="absolute top-1/3 right-1/4 w-24 h-24 rounded-full bg-teal-light/30 blur-xl"
      />

      <motion.div
        animate={{
          opacity: [0.15, 0.5, 0.15],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.5,
        }}
        className="absolute bottom-1/3 left-1/4 w-20 h-20 rounded-full bg-white/25 blur-xl"
      />
    </div>
  );
}
