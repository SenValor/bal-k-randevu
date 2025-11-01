'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, ReactNode } from 'react';

interface SlideInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  distance?: number;
  direction?: 'left' | 'right';
  className?: string;
}

export default function SlideIn({ 
  children, 
  delay = 0, 
  duration = 0.6,
  distance = 30,
  direction = 'left',
  className = '' 
}: SlideInProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  
  const xValue = direction === 'left' ? -distance : distance;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: xValue }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: xValue }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
