'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Calendar, Anchor, Compass, LogOut, Ship } from 'lucide-react';

const CARDS = [
  {
    title: 'Rezervasyonlar',
    description: 'Tarih ve tekne bazlı rezervasyonları görüntüle',
    icon: Calendar,
    color: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
    iconColor: 'text-blue-400',
    path: '/tamay-3313/reservations',
    emoji: '📅',
  },
  {
    title: 'Tekneler',
    description: 'Tekne ekle, düzenle, fotoğraf ve bilgi güncelle',
    icon: Anchor,
    color: 'from-[#00A9A5]/20 to-teal-600/10 border-[#00A9A5]/30',
    iconColor: 'text-[#00A9A5]',
    path: '/tamay-3313/boats',
    emoji: '⚓',
  },
  {
    title: 'Turlar',
    description: 'Tur ekle ve düzenle',
    icon: Compass,
    color: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
    iconColor: 'text-purple-400',
    path: '/tamay-3313/tours',
    emoji: '🧭',
  },
];

export default function TamayDashboard() {
  const router = useRouter();

  const handleLogout = () => {
    sessionStorage.removeItem('tamay_auth');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#001F3F] via-[#001529] to-black">
      {/* Header */}
      <div className="border-b border-white/10 px-5 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00A9A5]/20 border border-[#00A9A5]/30 flex items-center justify-center">
            <Ship className="w-5 h-5 text-[#00A9A5]" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">Balık Sefası</h1>
            <p className="text-white/40 text-xs">Tamay — Personel Paneli</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/60 hover:text-white text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Çıkış
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-10">
        <p className="text-white/50 text-sm mb-8 text-center">Ne yapmak istiyorsunuz?</p>

        <div className="space-y-4">
          {CARDS.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.button
                key={card.path}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                onClick={() => router.push(card.path)}
                className={`w-full bg-gradient-to-r ${card.color} border rounded-2xl p-5 flex items-center gap-4 hover:scale-[1.01] active:scale-[0.99] transition-transform text-left`}
              >
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
                <div>
                  <p className="text-white font-semibold text-base">{card.emoji} {card.title}</p>
                  <p className="text-white/50 text-sm mt-0.5">{card.description}</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
