"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Dock from "./Dock";
import { Home, Calendar, User, CalendarCheck, Anchor, Settings } from 'lucide-react';

export default function FloatingDock() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDockOpen, setIsDockOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // window.scrollY veya main element scroll'u kontrol et
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const mainElement = document.querySelector('main');
      const mainScrollY = mainElement?.scrollTop || 0;
      
      const totalScroll = Math.max(scrollY, mainScrollY);
      
      setIsScrolled(totalScroll > 100);
      if (totalScroll > 100) {
        setIsDockOpen(false); // Scroll olunca dock'u kapat
      }
    };

    // window scroll
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // main element scroll (ana sayfa için)
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.addEventListener('scroll', handleScroll, { passive: true });
    }
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (mainElement) {
        mainElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const items = [
    {
      icon: <Home size={20} />,
      label: "Ana Sayfa",
      onClick: () => {
        if (typeof window !== "undefined") {
          window.location.href = "/";
        }
      },
    },
    {
      icon: <Calendar size={20} />,
      label: "Rezervasyon Yap",
      onClick: () => {
        if (typeof window !== "undefined") {
          window.location.href = "/rezervasyon";
        }
      },
    },
    {
      icon: <CalendarCheck size={20} />,
      label: "Randevularım",
      onClick: () => {
        if (typeof window !== "undefined") {
          window.location.href = "/my-reservations";
        }
      },
    },
    {
      icon: <User size={20} />,
      label: "Profil",
      onClick: () => {
        if (typeof window !== "undefined") {
          window.location.href = "/profile";
        }
      },
    },
    {
      icon: <Settings size={20} />,
      label: "Ayarlar",
      onClick: () => {
        if (typeof window !== "undefined") {
          alert("Ayarlar sayfası yakında!");
        }
      },
    },
  ];

  return (
    <>
      {/* Normal Dock - Scroll olmadığında */}
      <div style={{ 
        opacity: isScrolled ? 0 : 1,
        pointerEvents: isScrolled ? 'none' : 'auto',
        transition: 'opacity 0.3s ease'
      }}>
        <Dock
          items={items}
          panelHeight={68}
          baseItemSize={50}
          magnification={70}
          distance={140}
          spring={{ mass: 0.1, stiffness: 150, damping: 12 }}
        />
      </div>

      {/* Floating Button - Scroll olduğunda */}
      <AnimatePresence>
        {isScrolled && (
          <motion.button
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.3 }}
            onClick={() => setIsDockOpen(!isDockOpen)}
            className="fixed right-4 bottom-4 w-14 h-14 rounded-full bg-gradient-to-br from-[#6B9BC3] to-[#5B8DB8] shadow-lg shadow-[#6B9BC3]/40 flex items-center justify-center text-white z-[10000] hover:scale-110 active:scale-95 transition-transform border-2 border-white/20"
          >
            {isDockOpen ? <X size={24} /> : <Menu size={24} />}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Popup Dock - Buton tıklandığında */}
      <AnimatePresence>
        {isDockOpen && isScrolled && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDockOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
            />
            
            {/* Popup Dock */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed bottom-20 right-4 z-[9999]"
            >
              <div className="bg-[#1B3A5C]/95 backdrop-blur-xl border-2 border-[#6B9BC3]/30 rounded-2xl p-4 shadow-2xl">
                <div className="flex flex-col gap-3">
                  {items.map((item, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        item.onClick();
                        setIsDockOpen(false);
                      }}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-[#6B9BC3]/15 to-[#5B8DB8]/10 border-2 border-[#6B9BC3]/30 hover:border-[#6B9BC3] hover:bg-[#6B9BC3]/25 text-white transition-all"
                    >
                      {item.icon}
                      <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
