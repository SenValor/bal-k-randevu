"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Menu, X, Home, Calendar, Image, Mail, Info } from "lucide-react";

interface MenuItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

export default function GlassMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems: MenuItem[] = [
    { icon: Home, label: "Ana Sayfa", href: "/" },
    { icon: Calendar, label: "Rezervasyon Yap", href: "/rezervasyon" },
    { icon: Image, label: "Galeri", href: "/galeri" },
    { icon: Mail, label: "İletişim", href: "/iletisim" },
    { icon: Info, label: "Hakkımızda", href: "/hakkimizda" },
  ];

  return (
    <>
      {/* Hamburger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="relative z-[9999] w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-6 h-6 text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Menu className="w-6 h-6 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Menu Overlay & Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
            />

            {/* Menu Panel - Mobile (Bottom Sheet) */}
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 120,
                damping: 15,
              }}
              className="block md:hidden fixed bottom-0 left-0 right-0 h-[85vh] bg-gradient-to-b from-gray-900/95 to-black/95 backdrop-blur-2xl rounded-t-3xl border-t border-white/10 z-[9998] overflow-hidden"
            >
              {/* Handle Bar */}
              <div className="flex justify-center pt-4 pb-8">
                <div className="w-12 h-1.5 bg-white/30 rounded-full" />
              </div>

              {/* Menu Items */}
              <nav className="px-8 space-y-2">
                {menuItems.map((item, index) => (
                  <motion.a
                    key={item.label}
                    href={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: index * 0.1,
                      type: "spring",
                      stiffness: 120,
                      damping: 15,
                    }}
                    className="flex items-center gap-4 px-6 py-5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal/20 to-teal-dark/20 flex items-center justify-center group-hover:from-teal/30 group-hover:to-teal-dark/30 transition-all">
                      <item.icon className="w-6 h-6 text-teal" />
                    </div>
                    <span className="text-2xl font-semibold text-white group-hover:text-teal transition-colors">
                      {item.label}
                    </span>
                  </motion.a>
                ))}
              </nav>

              {/* Footer */}
              <div className="absolute bottom-8 left-0 right-0 px-8">
                <div className="text-center text-sm text-white/50">
                  © 2024 Balık Sefası
                </div>
              </div>
            </motion.div>

            {/* Menu Panel - Desktop (Top Right) */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: -20 }}
              transition={{
                type: "spring",
                stiffness: 120,
                damping: 15,
              }}
              className="hidden md:block fixed top-20 right-6 w-[340px] bg-gradient-to-b from-gray-900/95 to-black/95 backdrop-blur-2xl rounded-3xl border border-white/10 z-[9998] overflow-hidden shadow-2xl"
            >
              {/* Menu Items */}
              <nav className="p-6 space-y-2">
                {menuItems.map((item, index) => (
                  <motion.a
                    key={item.label}
                    href={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: index * 0.08,
                      type: "spring",
                      stiffness: 120,
                      damping: 15,
                    }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group"
                    whileHover={{ scale: 1.05, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal/20 to-teal-dark/20 flex items-center justify-center group-hover:from-teal/30 group-hover:to-teal-dark/30 transition-all">
                      <item.icon className="w-5 h-5 text-teal" />
                    </div>
                    <span className="text-lg font-medium text-white group-hover:text-teal transition-colors">
                      {item.label}
                    </span>
                  </motion.a>
                ))}
              </nav>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-white/10">
                <div className="text-center text-xs text-white/50">
                  © 2024 Balık Sefası
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
