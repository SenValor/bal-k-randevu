'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Compass, Loader2, Edit, Trash2, ChevronLeft } from 'lucide-react';
import { Tour, subscribeToTours, toggleTourStatus, deleteTour } from '@/lib/tourHelpers';
import TourFormModal from '@/components/admin/tours/TourFormModal';

export default function TamayToursPage() {
  const router = useRouter();
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);

  useEffect(() => {
    const unsub = subscribeToTours((updated) => {
      setTours(updated);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleToggle = async (tour: Tour) => {
    setTogglingId(tour.id);
    await toggleTourStatus(tour.id, !tour.isActive);
    setTogglingId(null);
  };

  const handleDelete = async (tour: Tour) => {
    if (!confirm(`"${tour.name}" turunu silmek istediğinize emin misiniz?`)) return;
    await deleteTour(tour.id);
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
    <div className="min-h-screen bg-gradient-to-b from-[#001F3F] via-[#001529] to-black pb-16">
      {/* Header */}
      <div className="border-b border-white/10 px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => router.push('/tamay-3313')}
          className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors flex-shrink-0"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-white font-bold text-base">Tur Yönetimi</h1>
          <p className="text-white/40 text-xs">Turları düzenle ve yönet</p>
        </div>
        <button
          onClick={() => { setSelectedTour(null); setIsFormModalOpen(true); }}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#00A9A5] hover:bg-[#008985] text-white text-sm font-medium rounded-xl transition-colors flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          Ekle
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 px-4 py-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
          <p className="text-white/40 text-xs mb-1">Toplam</p>
          <p className="text-2xl font-bold text-white">{tours.length}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
          <p className="text-white/40 text-xs mb-1">Aktif</p>
          <p className="text-2xl font-bold text-[#00A9A5]">{tours.filter((t) => t.isActive).length}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
          <p className="text-white/40 text-xs mb-1">Pasif</p>
          <p className="text-2xl font-bold text-white/40">{tours.filter((t) => !t.isActive).length}</p>
        </div>
      </div>

      {/* Tours */}
      <div className="px-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-[#00A9A5] animate-spin" />
          </div>
        ) : tours.length === 0 ? (
          <div className="text-center py-16">
            <Compass className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/40">Henüz tur eklenmedi</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tours.map((tour, index) => (
              <motion.div
                key={tour.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-2 ${getCategoryColor(tour.category)}`}>
                      {getCategoryLabel(tour.category)}
                    </div>
                    <p className="text-white font-semibold text-base">{tour.name}</p>
                    <p className="text-white/50 text-sm mt-0.5 line-clamp-2">{tour.description}</p>
                    <p className="text-[#00A9A5] font-bold text-lg mt-2">₺{tour.price}</p>
                  </div>

                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {/* Toggle */}
                    <button
                      onClick={() => handleToggle(tour)}
                      disabled={togglingId === tour.id}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        tour.isActive ? 'bg-[#00A9A5]' : 'bg-white/20'
                      } ${togglingId === tour.id ? 'opacity-50' : ''}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        tour.isActive ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>

                    {/* Actions */}
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => { setSelectedTour(tour); setIsFormModalOpen(true); }}
                        className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(tour)}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <TourFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        tour={selectedTour}
        onSuccess={() => {}}
      />
    </div>
  );
}
