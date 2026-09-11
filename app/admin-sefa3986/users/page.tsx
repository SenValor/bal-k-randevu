'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Search, X, Phone, Mail, User, Pencil, Check, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebaseClient';

interface UserDoc {
  id: string;
  uid?: string;
  name?: string;
  email?: string;
  phone?: string;
  createdAt?: string;
}

async function apiCall(body: object) {
  const token = await auth.currentUser?.getIdToken();
  return fetch('/api/admin/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  }).then(r => r.json());
}

export default function UsersPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editPhone, setEditPhone] = useState('');
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim().length < 2) return;
    setLoading(true);
    setError('');
    setUsers([]);
    setEditId(null);
    try {
      const json = await apiCall({ action: 'search', search });
      if (json.success) {
        setUsers(json.users);
        if (json.users.length === 0) setError('Sonuç bulunamadı.');
      } else {
        setError(json.error || 'Arama başarısız.');
      }
    } catch {
      setError('Sunucu hatası.');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (u: UserDoc) => {
    setEditId(u.id);
    setEditPhone(u.phone || '');
    setEditName(u.name || '');
    setSavedId(null);
  };

  const cancelEdit = () => {
    setEditId(null);
  };

  const handleSave = async (u: UserDoc) => {
    setSaving(true);
    try {
      const json = await apiCall({
        action: 'update',
        uid: u.id,
        phone: editPhone,
        name: editName,
      });
      if (json.success) {
        setUsers(prev =>
          prev.map(x => x.id === u.id ? { ...x, phone: editPhone, name: editName } : x)
        );
        setSavedId(u.id);
        setEditId(null);
        setTimeout(() => setSavedId(null), 2000);
      } else {
        alert('Güncelleme başarısız: ' + (json.error || ''));
      }
    } catch {
      alert('Sunucu hatası.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#001F3F] via-[#001529] to-black pb-16 pt-16">
      {/* Header */}
      <div className="border-b border-white/10 px-4 py-4 flex items-center gap-3 sticky top-0 z-10 bg-[#001529]/90 backdrop-blur-md mt-4">
        <button
          onClick={() => router.push('/admin-sefa3986')}
          className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div>
          <h1 className="text-white font-bold text-base">Kullanıcı Yönetimi</h1>
          <p className="text-white/40 text-[11px]">Ad, e-posta veya telefon ile ara</p>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Search form */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setError(''); }}
              placeholder="İsim, e-posta veya telefon..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-9 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#00A9A5]/50"
              autoFocus
            />
            {search && (
              <button type="button" onClick={() => { setSearch(''); setUsers([]); setError(''); }} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-white/40" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || search.trim().length < 2}
            className="px-4 py-3 bg-[#00A9A5] hover:bg-[#008985] disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Ara
          </button>
        </form>

        {/* Error */}
        {error && (
          <p className="text-white/40 text-sm text-center py-4">{error}</p>
        )}

        {/* Results */}
        <div className="space-y-2">
          <AnimatePresence>
            {users.map(u => {
              const isEditing = editId === u.id;
              const justSaved = savedId === u.id;

              return (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
                >
                  {/* View mode */}
                  {!isEditing ? (
                    <div className="p-4 flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#00A9A5]/20 border border-[#00A9A5]/30 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-[#00A9A5]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-white font-semibold text-sm truncate">{u.name || '—'}</p>
                          {justSaved && (
                            <span className="text-green-400 text-[10px] flex items-center gap-0.5">
                              <Check className="w-3 h-3" /> Kaydedildi
                            </span>
                          )}
                        </div>
                        <div className="mt-1 space-y-0.5">
                          <p className="text-white/40 text-xs flex items-center gap-1.5">
                            <Mail className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{u.email || '—'}</span>
                          </p>
                          <p className="text-white/40 text-xs flex items-center gap-1.5">
                            <Phone className="w-3 h-3 flex-shrink-0" />
                            {u.phone || <span className="text-red-400/60">Telefon yok</span>}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => startEdit(u)}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5 text-white/50" />
                      </button>
                    </div>
                  ) : (
                    /* Edit mode */
                    <div className="p-4 space-y-3">
                      <p className="text-white/50 text-xs font-medium uppercase tracking-wide">Düzenle — {u.email}</p>
                      <div className="space-y-2">
                        <div>
                          <label className="text-white/30 text-[11px] mb-1 block">Ad Soyad</label>
                          <input
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00A9A5]/50"
                          />
                        </div>
                        <div>
                          <label className="text-white/30 text-[11px] mb-1 block">Telefon</label>
                          <input
                            value={editPhone}
                            onChange={e => setEditPhone(e.target.value)}
                            inputMode="tel"
                            className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00A9A5]/50"
                            placeholder="05XXXXXXXXX"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSave(u)}
                          disabled={saving}
                          className="flex-1 py-2.5 bg-[#00A9A5] hover:bg-[#008985] disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          Kaydet
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 rounded-xl text-sm transition-colors"
                        >
                          İptal
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
