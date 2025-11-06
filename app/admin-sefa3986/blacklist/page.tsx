'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import { UserX, Plus, Trash2, Phone, User, Calendar, AlertCircle } from 'lucide-react';

interface BlacklistEntry {
  id: string;
  phone: string;
  name: string;
  reason: string;
  addedAt: string;
  addedBy: string;
}

export default function BlacklistPage() {
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEntry, setNewEntry] = useState({
    phone: '',
    name: '',
    reason: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Kara listeyi yükle
  const fetchBlacklist = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'blacklist'), orderBy('addedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const entries: BlacklistEntry[] = [];
      querySnapshot.forEach((doc) => {
        entries.push({
          id: doc.id,
          ...doc.data(),
        } as BlacklistEntry);
      });
      
      setBlacklist(entries);
    } catch (error) {
      console.error('Kara liste yüklenirken hata:', error);
      alert('Kara liste yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlacklist();
  }, []);

  // Kara listeye ekle
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEntry.phone || !newEntry.name) {
      alert('Telefon ve isim alanları zorunludur');
      return;
    }

    // Telefon numarasını temizle (sadece rakamlar)
    const cleanPhone = newEntry.phone.replace(/\D/g, '');
    
    if (cleanPhone.length < 10) {
      alert('Geçerli bir telefon numarası giriniz (en az 10 hane)');
      return;
    }

    console.log('📝 Kara listeye eklenecek telefon (AYNEN):', cleanPhone);

    try {
      setSubmitting(true);
      
      // AYNEN KAYDET - 0 ile başlıyorsa 0 ile, başlamıyorsa öyle kaydet
      await addDoc(collection(db, 'blacklist'), {
        phone: cleanPhone,
        name: newEntry.name.trim(),
        reason: newEntry.reason.trim() || 'Belirtilmemiş',
        addedAt: new Date().toISOString(),
        addedBy: 'admin',
      });

      alert('✅ Kara listeye eklendi: ' + cleanPhone);
      setNewEntry({ phone: '', name: '', reason: '' });
      setShowAddModal(false);
      fetchBlacklist();
    } catch (error) {
      console.error('Kara listeye eklenirken hata:', error);
      alert('❌ Eklenirken bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  // Kara listeden çıkar
  const handleRemove = async (id: string, name: string) => {
    if (!confirm(`${name} kişisini kara listeden çıkarmak istediğinize emin misiniz?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'blacklist', id));
      alert('✅ Kara listeden çıkarıldı');
      fetchBlacklist();
    } catch (error) {
      console.error('Kara listeden çıkarılırken hata:', error);
      alert('❌ Çıkarılırken bir hata oluştu');
    }
  };

  // Telefon numarasını formatla
  const formatPhone = (phone: string) => {
    if (phone.startsWith('0') && phone.length === 11) {
      return `(${phone.slice(0, 4)}) ${phone.slice(4, 7)} ${phone.slice(7, 9)} ${phone.slice(9)}`;
    } else if (phone.length === 10) {
      return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)} ${phone.slice(6, 8)} ${phone.slice(8)}`;
    }
    return phone;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#001F3F] via-[#001529] to-black pb-12 pt-20">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent" />
        <div className="container mx-auto px-4 py-8 relative">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                <UserX className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">
                  Kara Liste Yönetimi
                </h1>
                <p className="text-white/60 text-sm">
                  Rezervasyon yapamayacak kullanıcıları yönetin
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-white font-semibold mb-1">Önemli Bilgi</h3>
            <p className="text-white/70 text-sm mb-2">
              Kara listeye eklenen telefon numaraları ile rezervasyon yapılamaz. 
              Kullanıcı rezervasyon yapmaya çalıştığında otomatik olarak engellenecektir.
            </p>
            <p className="text-yellow-400 text-sm font-medium">
              💡 İpucu: Telefonu müşterinin girdiği şekilde ekleyin (0555... veya 555...)
            </p>
          </div>
        </motion.div>

        {/* Add Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6"
        >
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:from-red-600 hover:to-red-700 transition-all"
          >
            <Plus className="w-5 h-5" />
            Kara Listeye Ekle
          </button>
        </motion.div>

        {/* Blacklist Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4 animate-spin" />
            <p className="text-white/60">Yükleniyor...</p>
          </div>
        ) : blacklist.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-xl p-12 text-center"
          >
            <UserX className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Kara liste boş</h3>
            <p className="text-white/60">
              Henüz kara listeye eklenmiş kullanıcı bulunmuyor
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        İsim
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Telefon
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                      Sebep
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Eklenme Tarihi
                      </div>
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-white">
                      İşlem
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {blacklist.map((entry, index) => (
                    <motion.tr
                      key={entry.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 text-white font-medium">
                        {entry.name}
                      </td>
                      <td className="px-6 py-4 text-white/80 font-mono">
                        {formatPhone(entry.phone)}
                      </td>
                      <td className="px-6 py-4 text-white/70 text-sm">
                        {entry.reason}
                      </td>
                      <td className="px-6 py-4 text-white/60 text-sm">
                        {new Date(entry.addedAt).toLocaleDateString('tr-TR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleRemove(entry.id, entry.name)}
                          className="text-red-400 hover:text-red-300 transition-colors p-2 hover:bg-red-500/10 rounded-lg"
                          title="Kara listeden çıkar"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-6 bg-white/5 border border-white/10 rounded-xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm mb-1">Toplam Kara Liste</p>
              <p className="text-3xl font-bold text-red-400">{blacklist.length}</p>
            </div>
            <UserX className="w-12 h-12 text-red-400/30" />
          </div>
        </motion.div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#001F3F] border border-white/20 rounded-2xl p-6 max-w-md w-full"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Kara Listeye Ekle</h2>
                <p className="text-white/60 text-sm">Yeni kullanıcı ekleyin</p>
              </div>
            </div>

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Telefon Numarası *
                </label>
                <input
                  type="tel"
                  value={newEntry.phone}
                  onChange={(e) => setNewEntry({ ...newEntry, phone: e.target.value })}
                  placeholder="05551234567 veya 5551234567"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/50"
                  required
                />
                <p className="text-white/40 text-xs mt-1">
                  Müşterinin girdiği şekilde yazın (0555... veya 555...)
                </p>
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  İsim Soyisim *
                </label>
                <input
                  type="text"
                  value={newEntry.name}
                  onChange={(e) => setNewEntry({ ...newEntry, name: e.target.value })}
                  placeholder="Ahmet Yılmaz"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/50"
                  required
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Sebep (Opsiyonel)
                </label>
                <textarea
                  value={newEntry.reason}
                  onChange={(e) => setNewEntry({ ...newEntry, reason: e.target.value })}
                  placeholder="Örn: Randevuya gelmedi, iptal etti..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/50 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewEntry({ phone: '', name: '', reason: '' });
                  }}
                  className="flex-1 bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl font-semibold hover:bg-white/10 transition-all"
                  disabled={submitting}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-3 rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? 'Ekleniyor...' : 'Ekle'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
