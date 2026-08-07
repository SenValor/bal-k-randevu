'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Anchor, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Boat, subscribeToBoats } from '@/lib/boatHelpers';
import BoatList from '@/components/admin/boats/BoatList';
import BoatFormModal from '@/components/admin/boats/BoatFormModal';
import DeleteConfirmModal from '@/components/admin/boats/DeleteConfirmModal';

export default function BoatsAdminPage() {
  const router = useRouter();
  const [boats, setBoats] = useState<Boat[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedBoat, setSelectedBoat] = useState<Boat | null>(null);

  useEffect(() => {
    // Firestore'dan tekneleri gerçek zamanlı dinle
    const unsubscribe = subscribeToBoats((updatedBoats) => {
      setBoats(updatedBoats);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddNew = () => {
    setSelectedBoat(null);
    setIsFormModalOpen(true);
  };

  const handleEdit = (boat: Boat) => {
    setSelectedBoat(boat);
    setIsFormModalOpen(true);
  };

  const handleDelete = (boat: Boat) => {
    setSelectedBoat(boat);
    setIsDeleteModalOpen(true);
  };

  const handleFormSuccess = () => {
    // Modal kapanacak, liste otomatik güncellenecek (onSnapshot sayesinde)
  };

  const handleDeleteSuccess = () => {
    // Modal kapanacak, liste otomatik güncellenecek
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#001F3F] via-[#001529] to-black pb-24 pt-24">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-r from-[#00A9A5]/10 to-transparent" />
        <div className="container mx-auto px-4 py-6 md:py-12 relative">
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
            className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-[#00A9A5] to-[#008B87] flex items-center justify-center shrink-0">
                <Anchor className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-4xl font-bold text-white mb-0.5 md:mb-2">
                  Tekne Ayarları
                </h1>
                <p className="text-white/60 text-sm md:text-lg">
                  Tekneleri yönetin ve düzenleyin
                </p>
              </div>
            </div>

            {/* Add New Button */}
            <motion.button
              onClick={handleAddNew}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2.5 md:px-6 md:py-3 bg-gradient-to-r from-[#00A9A5] to-[#008B87] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#00A9A5]/30 transition-all flex items-center gap-2 self-start sm:self-auto"
            >
              <Plus className="w-5 h-5" />
              Yeni Tekne Ekle
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
              <p className="text-white/60 text-sm mb-1">Toplam Tekne</p>
              <p className="text-3xl font-bold text-white">{boats.length}</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm mb-1">Aktif Tekneler</p>
              <p className="text-3xl font-bold text-[#00A9A5]">
                {boats.filter((b) => b.isActive).length}
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm mb-1">Pasif Tekneler</p>
              <p className="text-3xl font-bold text-white/40">
                {boats.filter((b) => !b.isActive).length}
              </p>
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[#00A9A5] animate-spin" />
            </div>
          ) : (
            /* Boat List */
            <BoatList
              boats={boats}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </motion.div>
      </div>

      {/* Form Modal */}
      <BoatFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        boat={selectedBoat}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        boat={selectedBoat}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
