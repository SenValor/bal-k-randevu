'use client';

import { motion } from 'framer-motion';
import { Anchor, Users, FileText, Clock, BarChart3, Calendar, Compass, Image, HelpCircle, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();

  const menuItems = [
    {
      id: 'add-reservation',
      title: 'Rezervasyon Takvimi',
      description: 'Aylık rezervasyon durumunu görüntüleyin',
      icon: Clock,
      color: 'from-indigo-500 to-indigo-600',
      path: '/admin-sefa3986/add-reservation',
      available: true,
    },
    {
      id: 'reservations',
      title: 'Randevu Yönetimi',
      description: 'Tüm randevuları görüntüle ve yönet',
      icon: Calendar,
      color: 'from-blue-500 to-blue-600',
      path: '/admin-sefa3986/reservations',
      available: true,
    },
    {
      id: 'pending',
      title: 'Bekleyen Randevular',
      description: 'Onay bekleyen randevular',
      icon: Clock,
      color: 'from-yellow-500 to-yellow-600',
      path: '/admin-sefa3986/pending',
      available: true,
    },
    {
      id: 'boats',
      title: 'Tekne Yönetimi',
      description: 'Tekneleri yönet, saat ayarları',
      icon: Anchor,
      color: 'from-cyan-500 to-cyan-600',
      path: '/admin-sefa3986/boats',
      available: true,
    },
    {
      id: 'tour-management',
      title: 'Tur Yönetimi',
      description: 'Turları ekle, düzenle ve yönet',
      icon: Compass,
      color: 'from-teal-500 to-teal-600',
      path: '/admin-sefa3986/tours',
      available: true,
    },
    {
      id: 'tours',
      title: 'Onaylı Randevular',
      description: 'Onaylanmış randevular',
      icon: Compass,
      color: 'from-green-500 to-green-600',
      path: '/admin-sefa3986/tours',
      available: false,
    },
    {
      id: 'about',
      title: 'Hakkımızda Düzenle',
      description: 'Soru-cevap içeriklerini düzenle',
      icon: FileText,
      color: 'from-emerald-500 to-emerald-600',
      path: '/admin-sefa3986/about',
      available: true,
    },
    {
      id: 'faq',
      title: 'SSS Yönetimi',
      description: 'Sıkça sorulan soruları yönet',
      icon: HelpCircle,
      color: 'from-indigo-500 to-indigo-600',
      path: '/admin-sefa3986/faq',
      available: true,
    },
    {
      id: 'gallery',
      title: 'Fotoğraf Yönetimi',
      description: 'Website fotoğraflarını yönet',
      icon: Image,
      color: 'from-purple-500 to-purple-600',
      path: '/admin-sefa3986/gallery',
      available: true,
    },
    {
      id: 'analytics',
      title: 'Kara Liste',
      description: 'Gelmeyen müşterileri yönet',
      icon: BarChart3,
      color: 'from-red-500 to-red-600',
      path: '/admin-sefa3986/analytics',
      available: false,
    },
    {
      id: 'settings',
      title: 'Ayarlar',
      description: 'Basında Biz ve diğer ayarlar',
      icon: Settings,
      color: 'from-gray-500 to-gray-600',
      path: '/admin-sefa3986/settings',
      available: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#001F3F] via-[#001529] to-black pb-12 pt-20">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-r from-[#00A9A5]/10 to-transparent" />
        <div className="container mx-auto px-4 py-6 relative">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
              Admin Dashboard
            </h1>
            <p className="text-white/60 text-sm">
              Balık Sefası Yönetim Paneli
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-4">
        {/* Welcome Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-r from-[#00A9A5]/20 to-[#008B87]/20 border border-[#00A9A5]/30 rounded-xl backdrop-blur-md p-4 mb-4"
        >
          <h2 className="text-lg font-bold text-white mb-1">
            Hoş Geldiniz! 👋
          </h2>
          <p className="text-white/80 text-sm">
            Yönetim paneline hoş geldiniz. Aşağıdaki menülerden işlemlerinizi gerçekleştirebilirsiniz.
          </p>
        </motion.div>

        {/* Menu Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <button
                  onClick={() => {
                    if (item.available) {
                      router.push(item.path);
                    }
                  }}
                  disabled={!item.available}
                  className={`
                    w-full text-left p-3 rounded-xl border transition-all
                    ${
                      item.available
                        ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 cursor-pointer'
                        : 'bg-white/5 border-white/5 opacity-50 cursor-not-allowed'
                    }
                  `}
                >
                  {/* Icon */}
                  <div
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center mb-2`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-1">
                    {item.title}
                    {!item.available && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full">
                        Yakında
                      </span>
                    )}
                  </h3>

                  {/* Description */}
                  <p className="text-white/60 text-xs line-clamp-2">
                    {item.description}
                  </p>

                  {/* Arrow */}
                  {item.available && (
                    <div className="mt-2 flex items-center gap-1 text-[#00A9A5] text-xs font-medium">
                      Yönet
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-4 bg-white/5 border border-white/10 rounded-xl backdrop-blur-md p-4"
        >
          <h3 className="text-sm font-bold text-white mb-3">Hızlı Bilgiler</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-[#00A9A5]">-</p>
              <p className="text-white/60 text-xs mt-0.5">Toplam Tekne</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">-</p>
              <p className="text-white/60 text-xs mt-0.5">Kullanıcı</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">-</p>
              <p className="text-white/60 text-xs mt-0.5">Rezervasyon</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-400">-</p>
              <p className="text-white/60 text-xs mt-0.5">Bugün</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
