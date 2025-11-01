'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Compass, Loader2, Edit, Trash2, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Tour, subscribeToTours, toggleTourStatus, deleteTour } from '@/lib/tourHelpers';
import TourFormModal from '@/components/admin/tours/TourFormModal';

export default function ToursAdminPage() {
  const router = useRouter();
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);

  useEffect(() => {
    // Firestore'dan turları gerçek zamanlı dinle
    const unsubscribe = subscribeToTours((updatedTours) => {
      setTours(updatedTours);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleToggleStatus = async (tour: Tour) => {
    setTogglingId(tour.id);
    const result = await toggleTourStatus(tour.id, !tour.isActive);
    setTogglingId(null);

    if (!result.success) {
      alert(result.error);
    }
  };

  const handleDelete = async (tour: Tour) => {
    if (!confirm(`"${tour.name}" turunu silmek istediğinize emin misiniz?`)) {
      return;
    }

    const result = await deleteTour(tour.id);
    if (!result.success) {
      alert(result.error);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      normal: 'Normal Tur',
      private: 'Özel Tur',
      fishingSwimming: 'Balık Avı & Yüzme',
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      normal: 'bg-blue-500/20 text-blue-400',
      private: 'bg-purple-500/20 text-purple-400',
      fishingSwimming: 'bg-green-500/20 text-green-400',
    };
    return colors[category] || 'bg-gray-500/20 text-gray-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#001F3F] via-[#001529] to-black pb-24 pt-24">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-r from-[#00A9A5]/10 to-transparent" />
        <div className="container mx-auto px-4 py-12 relative">
          <button
            onClick={() => router.push('/admin-sefa3986')}
            className="mb-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all flex items-center gap-2"
          >
            ← Geri
          </button>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00A9A5] to-[#008B87] flex items-center justify-center">
                <Compass className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                  Tur Yönetimi
                </h1>
                <p className="text-white/60 text-lg">
                  Turları yönetin ve düzenleyin
                </p>
              </div>
            </div>

            {/* Add New Button */}
            <motion.button
              onClick={() => {
                setSelectedTour(null);
                setIsFormModalOpen(true);
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-gradient-to-r from-[#00A9A5] to-[#008B87] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#00A9A5]/30 transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Yeni Tur Ekle
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md p-6"
        >
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm mb-1">Toplam Tur</p>
              <p className="text-3xl font-bold text-white">{tours.length}</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm mb-1">Aktif Turlar</p>
              <p className="text-3xl font-bold text-[#00A9A5]">
                {tours.filter((t) => t.isActive).length}
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm mb-1">Pasif Turlar</p>
              <p className="text-3xl font-bold text-white/40">
                {tours.filter((t) => !t.isActive).length}
              </p>
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[#00A9A5] animate-spin" />
            </div>
          ) : tours.length === 0 ? (
            /* Empty State */
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-[#00A9A5]/10 flex items-center justify-center mx-auto mb-4">
                <Compass className="w-10 h-10 text-[#00A9A5]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Henüz Tur Eklenmedi 🧭
              </h3>
              <p className="text-white/60">
                Yeni bir tur eklemek için yukarıdaki butonu kullanın
              </p>
            </div>
          ) : (
            /* Tours Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tours.map((tour, index) => (
                <motion.div
                  key={tour.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition-all"
                >
                  {/* Content */}
                  <div className="p-6">
                    {/* Category Badge */}
                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-3 ${getCategoryColor(tour.category)}`}>
                      {getCategoryLabel(tour.category)}
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2">{tour.name}</h3>
                    <p className="text-white/60 text-sm mb-4 line-clamp-2">
                      {tour.description}
                    </p>

                    {/* Price */}
                    <div className="text-[#00A9A5] font-bold text-2xl mb-4">
                      ₺{tour.price}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      {/* Toggle */}
                      <button
                        onClick={() => handleToggleStatus(tour)}
                        disabled={togglingId === tour.id}
                        className={`
                          relative inline-flex h-6 w-11 items-center rounded-full
                          transition-colors focus:outline-none
                          ${tour.isActive ? 'bg-[#00A9A5]' : 'bg-white/20'}
                          ${togglingId === tour.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                      >
                        <span
                          className={`
                            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                            ${tour.isActive ? 'translate-x-6' : 'translate-x-1'}
                          `}
                        />
                      </button>

                      {/* Edit & Delete */}
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setSelectedTour(tour);
                            setIsFormModalOpen(true);
                          }}
                          className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDelete(tour)}
                          className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Tour Form Modal */}
      <TourFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        tour={selectedTour}
        onSuccess={() => {
          // Modal kapanacak, liste otomatik güncellenecek
        }}
      />
    </div>
  );
}
