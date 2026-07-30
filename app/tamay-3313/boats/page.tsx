'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Anchor, Loader2, ChevronLeft, Edit, Trash2, Users, Calendar } from 'lucide-react';
import { Boat, subscribeToBoats, toggleBoatStatus } from '@/lib/boatHelpers';
import BoatFormModal from '@/components/admin/boats/BoatFormModal';
import DeleteConfirmModal from '@/components/admin/boats/DeleteConfirmModal';

export default function TamayBoatsPage() {
  const router = useRouter();
  const [boats, setBoats] = useState<Boat[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedBoat, setSelectedBoat] = useState<Boat | null>(null);

  useEffect(() => {
    const unsub = subscribeToBoats(updated => {
      setBoats(updated);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleToggle = async (boat: Boat) => {
    setTogglingId(boat.id);
    await toggleBoatStatus(boat.id, !boat.isActive);
    setTogglingId(null);
  };

  const fmtDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return d; }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#001F3F] via-[#001529] to-black pb-16">
      {/* Header */}
      <div className="border-b border-white/10 px-4 py-4 flex items-center gap-3 sticky top-0 z-10 bg-[#001529]/80 backdrop-blur-md">
        <button
          onClick={() => router.push('/tamay-3313')}
          className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-white font-bold text-base">Tekne Yönetimi</h1>
          <p className="text-white/40 text-xs">Fotoğraf, bilgi ve saat ayarları</p>
        </div>
        <button
          onClick={() => { setSelectedBoat(null); setIsFormModalOpen(true); }}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#00A9A5] hover:bg-[#008985] text-white text-sm font-semibold rounded-xl transition-colors flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          Ekle
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 px-4 py-4">
        {[
          { label: 'Toplam', value: boats.length, color: 'text-white' },
          { label: 'Aktif',  value: boats.filter(b => b.isActive).length,  color: 'text-[#00A9A5]' },
          { label: 'Pasif',  value: boats.filter(b => !b.isActive).length, color: 'text-white/40' },
        ].map(s => (
          <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
            <p className="text-white/40 text-xs mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Boat cards */}
      <div className="px-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-[#00A9A5] animate-spin" />
          </div>
        ) : boats.length === 0 ? (
          <div className="text-center py-16">
            <Anchor className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/40 text-sm">Henüz tekne eklenmedi</p>
          </div>
        ) : (
          boats.map((boat, i) => (
            <motion.div
              key={boat.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
            >
              <div className="flex items-start gap-3 p-3">
                {/* Photo */}
                {boat.imageUrl ? (
                  <img
                    src={boat.imageUrl}
                    alt={boat.name}
                    className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <Anchor className="w-7 h-7 text-white/20" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-white font-bold text-sm leading-tight">{boat.name}</p>
                    {/* Active toggle */}
                    <button
                      onClick={() => handleToggle(boat)}
                      disabled={togglingId === boat.id}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full flex-shrink-0 transition-colors ${
                        boat.isActive ? 'bg-[#00A9A5]' : 'bg-white/20'
                      } ${togglingId === boat.id ? 'opacity-50' : ''}`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                        boat.isActive ? 'translate-x-4' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>

                  {boat.description && (
                    <p className="text-white/40 text-xs line-clamp-1 mb-1.5">{boat.description}</p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-white/50">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {boat.capacity} kişi
                    </span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                      boat.isActive
                        ? 'bg-green-400/10 text-green-400'
                        : 'bg-white/10 text-white/40'
                    }`}>
                      {boat.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>

                  {(boat.startDate || boat.endDate) && (
                    <div className="flex items-center gap-1 text-[10px] text-white/35 mt-1">
                      <Calendar className="w-3 h-3" />
                      {fmtDate(boat.startDate)} — {fmtDate(boat.endDate)}
                    </div>
                  )}
                </div>
              </div>

              {/* Action bar */}
              <div className="border-t border-white/8 flex">
                <button
                  onClick={() => { setSelectedBoat(boat); setIsFormModalOpen(true); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-blue-400 hover:bg-blue-500/10 transition-colors text-sm font-medium"
                >
                  <Edit className="w-4 h-4" />
                  Düzenle
                </button>
                <div className="w-px bg-white/8" />
                <button
                  onClick={() => { setSelectedBoat(boat); setIsDeleteModalOpen(true); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Sil
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <BoatFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        boat={selectedBoat}
        onSuccess={() => {}}
      />
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        boat={selectedBoat}
        onSuccess={() => {}}
      />
    </div>
  );
}
