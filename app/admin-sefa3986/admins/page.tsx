'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { collection, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebaseClient';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Shield, Plus, UserCheck, UserX, RefreshCw, Eye, EyeOff, Trash2 } from 'lucide-react';
import PinGate from '@/components/admin/PinGate';

interface AdminDoc {
  email: string;
  name: string;
  active: boolean;
  createdAt: string;
}

export default function AdminsPage() {
  const router = useRouter();
  const [admins, setAdmins] = useState<AdminDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'admins'));
      setAdmins(snap.docs.map(d => ({ email: d.id, ...d.data() } as AdminDoc)));
    } catch {
      alert('❌ Liste yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAdmins(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      alert('Ad soyad, email ve şifre zorunludur.');
      return;
    }
    if (newPassword.length < 6) {
      alert('Şifre en az 6 karakter olmalıdır.');
      return;
    }

    setSaving(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Oturum bulunamadı.');

      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.trim(),
          password: newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Sunucu hatası');

      alert(`✅ ${newName.trim()} başarıyla eklendi. Giriş bilgileri:\nEmail: ${newEmail.trim()}\nŞifre: ${newPassword}`);
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setShowForm(false);
      fetchAdmins();
    } catch (err: any) {
      alert(`❌ ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (email: string, current: boolean) => {
    const label = current ? 'pasif' : 'aktif';
    if (!confirm(`${email} adresini ${label} yapmak istediğinize emin misiniz?`)) return;
    try {
      await updateDoc(doc(db, 'admins', email), { active: !current });
      fetchAdmins();
    } catch {
      alert('❌ Güncellenemedi.');
    }
  };

  const handleDelete = async (email: string, name: string) => {
    if (!confirm(`${name} (${email}) adlı admini kalıcı olarak silmek istediğinize emin misiniz?\n\nFirebase Auth hesabı silinmez, sadece panel erişimi kaldırılır.`)) return;
    try {
      await deleteDoc(doc(db, 'admins', email));
      fetchAdmins();
    } catch {
      alert('❌ Silinemedi.');
    }
  };

  return (
    <PinGate>
    <div className="min-h-screen bg-gradient-to-b from-[#001F3F] via-[#001529] to-black pb-16 pt-20">
      <div className="container mx-auto px-4 max-w-2xl">
        <button
          onClick={() => router.push('/admin-sefa3986')}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Geri
        </button>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#00A9A5] to-teal-600 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Yönetimi</h1>
              <p className="text-white/50 text-sm">Panele erişimi olan kullanıcılar</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchAdmins}
              className="p-2 bg-white/5 border border-white/10 rounded-xl text-white/60 hover:text-white transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowForm(v => !v)}
              className="flex items-center gap-2 px-3 py-2 bg-[#00A9A5]/20 border border-[#00A9A5]/40 hover:bg-[#00A9A5]/30 text-[#00A9A5] rounded-xl text-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Admin Ekle
            </button>
          </div>
        </div>

        {/* Ekleme formu */}
        {showForm && (
          <motion.form
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleAdd}
            className="bg-white/5 border border-[#00A9A5]/30 rounded-xl p-4 mb-4 space-y-3"
          >
            <h3 className="text-white font-medium text-sm">Yeni Admin</h3>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Ad Soyad"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#00A9A5]"
              />
              <input
                type="email"
                placeholder="Email adresi"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#00A9A5]"
              />
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Şifre (en az 6 karakter)"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 pr-10 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#00A9A5]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-white/30 text-xs">
              Firebase Auth'da hesap oluşturulur. Şifreyi admine iletin — isterse /profile'dan değiştirebilir.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => { setShowForm(false); setNewName(''); setNewEmail(''); setNewPassword(''); }}
                className="px-3 py-2 text-white/50 hover:text-white text-sm transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-[#00A9A5] hover:bg-[#008B87] text-white text-sm rounded-xl transition-colors disabled:opacity-50"
              >
                {saving ? 'Oluşturuluyor...' : 'Oluştur ve Ekle'}
              </button>
            </div>
          </motion.form>
        )}

        {/* Admin listesi */}
        <div className="space-y-2">
          {loading ? (
            <div className="text-center text-white/40 py-12">Yükleniyor...</div>
          ) : admins.length === 0 ? (
            <div className="text-center text-white/40 py-12">
              <p>Henüz admin eklenmemiş.</p>
              <p className="text-xs mt-1">Mevcut adminler (baliksefasi33, bukre) bootstrap listesinden yetkilendiriliyor.</p>
            </div>
          ) : (
            admins.map((admin, i) => (
              <motion.div
                key={admin.email}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center justify-between p-4 rounded-xl border ${
                  admin.active
                    ? 'bg-white/5 border-white/10'
                    : 'bg-white/2 border-white/5 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                    admin.active ? 'bg-[#00A9A5]/20 text-[#00A9A5]' : 'bg-white/5 text-white/30'
                  }`}>
                    {admin.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm">{admin.name}</div>
                    <div className="text-white/40 text-xs">{admin.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    admin.active
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {admin.active ? 'Aktif' : 'Pasif'}
                  </span>
                  <button
                    onClick={() => toggleActive(admin.email, admin.active)}
                    className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                    title={admin.active ? 'Pasif yap' : 'Aktif yap'}
                  >
                    {admin.active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(admin.email, admin.name)}
                    className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        <p className="text-white/25 text-xs text-center mt-6">
          Pasif adminler panele giremez. Silme yerine pasife almak önerilir.
        </p>
      </div>
    </div>
    </PinGate>
  );
}
