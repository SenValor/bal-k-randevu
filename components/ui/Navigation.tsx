'use client';

import { motion } from 'framer-motion';
import { Home, Calendar, UserCircle } from 'lucide-react';
import { useState } from 'react';

type NavItem = {
  id: string;
  label: string;
  icon: typeof Home;
};

const navItems: NavItem[] = [
  { id: 'home', label: 'Ana Sayfa', icon: Home },
  { id: 'reservations', label: 'Rezervasyonlarım', icon: Calendar },
  { id: 'profile', label: 'Profil', icon: UserCircle },
];

export default function Navigation() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg"
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-around h-20">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <motion.button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center justify-center space-y-1 relative px-6 py-2"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-teal/10 rounded-2xl"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Icon
                  className={`w-6 h-6 relative z-10 transition-colors ${
                    isActive ? 'text-teal' : 'text-gray-400'
                  }`}
                />
                <span
                  className={`text-xs font-medium relative z-10 transition-colors ${
                    isActive ? 'text-teal' : 'text-gray-400'
                  }`}
                >
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
}
