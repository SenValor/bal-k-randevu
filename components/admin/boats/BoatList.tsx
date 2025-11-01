'use client';

import { motion } from 'framer-motion';
import { Edit, Trash2, Users, Calendar, Anchor } from 'lucide-react';
import { Boat, toggleBoatStatus } from '@/lib/boatHelpers';
import { useState } from 'react';

interface BoatListProps {
  boats: Boat[];
  onEdit: (boat: Boat) => void;
  onDelete: (boat: Boat) => void;
}

export default function BoatList({ boats, onEdit, onDelete }: BoatListProps) {
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleToggleStatus = async (boat: Boat) => {
    setTogglingId(boat.id);
    const result = await toggleBoatStatus(boat.id, !boat.isActive);
    setTogglingId(null);

    if (!result.success) {
      alert(result.error);
    }
  };

  if (boats.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md p-12 text-center"
      >
        <div className="w-20 h-20 rounded-full bg-[#00A9A5]/10 flex items-center justify-center mx-auto mb-4">
          <Anchor className="w-10 h-10 text-[#00A9A5]" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          Henüz Tekne Eklenmedi 🌊
        </h3>
        <p className="text-white/60">
          Yeni bir tekne eklemek için yukarıdaki butonu kullanın
        </p>
      </motion.div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left py-4 px-4 text-white/80 font-semibold text-sm">
              Tekne Adı
            </th>
            <th className="text-left py-4 px-4 text-white/80 font-semibold text-sm">
              Kapasite
            </th>
            <th className="text-left py-4 px-4 text-white/80 font-semibold text-sm">
              Durum
            </th>
            <th className="text-left py-4 px-4 text-white/80 font-semibold text-sm">
              Tarih Aralığı
            </th>
            <th className="text-right py-4 px-4 text-white/80 font-semibold text-sm">
              İşlemler
            </th>
          </tr>
        </thead>
        <tbody>
          {boats.map((boat, index) => (
            <motion.tr
              key={boat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="border-b border-white/5 hover:bg-white/5 transition-colors"
            >
              {/* Tekne Adı */}
              <td className="py-4 px-4">
                <div className="flex items-center gap-3">
                  {boat.imageUrl && (
                    <img
                      src={boat.imageUrl}
                      alt={boat.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <p className="text-white font-medium">{boat.name}</p>
                    <p className="text-white/60 text-xs line-clamp-1">
                      {boat.description}
                    </p>
                  </div>
                </div>
              </td>

              {/* Kapasite */}
              <td className="py-4 px-4">
                <div className="flex items-center gap-2 text-white/80">
                  <Users className="w-4 h-4 text-[#00A9A5]" />
                  <span>{boat.capacity} kişi</span>
                </div>
              </td>

              {/* Durum Toggle */}
              <td className="py-4 px-4">
                <button
                  onClick={() => handleToggleStatus(boat)}
                  disabled={togglingId === boat.id}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full
                    transition-colors focus:outline-none focus:ring-2 focus:ring-[#00A9A5] focus:ring-offset-2
                    ${boat.isActive ? 'bg-[#00A9A5]' : 'bg-white/20'}
                    ${togglingId === boat.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${boat.isActive ? 'translate-x-6' : 'translate-x-1'}
                    `}
                  />
                </button>
                <span className="ml-2 text-xs text-white/60">
                  {boat.isActive ? 'Aktif' : 'Pasif'}
                </span>
              </td>

              {/* Tarih Aralığı */}
              <td className="py-4 px-4">
                <div className="flex items-center gap-2 text-white/80 text-sm">
                  <Calendar className="w-4 h-4 text-[#00A9A5]" />
                  <span>
                    {new Date(boat.startDate).toLocaleDateString('tr-TR')} -{' '}
                    {new Date(boat.endDate).toLocaleDateString('tr-TR')}
                  </span>
                </div>
              </td>

              {/* İşlemler */}
              <td className="py-4 px-4">
                <div className="flex items-center justify-end gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onEdit(boat)}
                    className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors"
                    title="Düzenle"
                  >
                    <Edit className="w-4 h-4" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onDelete(boat)}
                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                    title="Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
