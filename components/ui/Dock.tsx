"use client";

import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { useState, useRef, ReactNode } from "react";
import "./Dock.css";

interface DockItem {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
}

interface DockProps {
  items: DockItem[];
  panelHeight?: number;
  baseItemSize?: number;
  magnification?: number;
  distance?: number;
  spring?: {
    mass?: number;
    stiffness?: number;
    damping?: number;
  };
}

export default function Dock({
  items,
  panelHeight = 68,
  baseItemSize = 50,
  magnification = 70,
  distance = 140,
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
}: DockProps) {
  const mouseX = useMotionValue(Infinity);

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className="dock-container"
      style={{ height: panelHeight }}
    >
      <div className="dock-panel">
        {items.map((item, i) => (
          <DockIcon
            key={i}
            mouseX={mouseX}
            item={item}
            baseSize={baseItemSize}
            magnification={magnification}
            distance={distance}
            spring={spring}
          />
        ))}
      </div>
    </motion.div>
  );
}

interface DockIconProps {
  mouseX: any;
  item: DockItem;
  baseSize: number;
  magnification: number;
  distance: number;
  spring: {
    mass?: number;
    stiffness?: number;
    damping?: number;
  };
}

function DockIcon({
  mouseX,
  item,
  baseSize,
  magnification,
  distance,
  spring: springConfig,
}: DockIconProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const distanceCalc = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distanceCalc, [-distance, 0, distance], [baseSize, magnification, baseSize]);
  const width = useSpring(widthSync, springConfig);

  return (
    <div className="dock-icon-wrapper">
      <motion.button
        ref={ref}
        style={{ width, height: width }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={item.onClick}
        className={`dock-icon ${item.className || ""}`}
        whileTap={{ scale: 0.9 }}
      >
        {item.icon}
      </motion.button>

      {/* Tooltip Label */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="dock-tooltip"
          >
            {item.label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
