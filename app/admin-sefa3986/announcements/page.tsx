'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Megaphone, Plus, Trash2, ArrowLeft,
  CheckCircle, XCircle, Loader2, Bell, Image as ImageIcon, X
} from 'lucide-react';
import {
  collection, addDoc, deleteDoc, doc,
  onSnapshot, orderBy, query, updateDoc,
  getDocs, where,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebaseClient';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Announcement {
  id: string;
  title: string;
  body: string;
  emoji: string;
  imageUrl?: string;
  storagePath?: string;
  isActive: boolean;
  createdAt: string;
}

const EMOJI_OPTIONS = ['📢', '⚓', '🎣', '🐟', '🌊', '⛵', '🎉', '⚠️', '🔔', '💡'];

export default function AnnouncementsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [emoji, setEmoji] = useState('📢');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [pushStatus, setPushStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  useEffect(() => {
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement)));
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Maksimum 5MB dosya yükleyebilirsiniz.'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const resetForm = () => {
    setTitle(''); setBody(''); setEmoji('📢');
    clearImage(); setShowForm(false);
  };

  const sendPushToAll = async (notifTitle: string, notifBody: string, emoji: string) => {
    try {
      setPushStatus('sending');
      const snap = await getDocs(
        query(collection(db, 'users'), where('expoPushToken', '!=', null))
      );
      const tokens: string[] = snap.docs
        .map(d => (d.data() as any).expoPushToken as string)
        .filter(t => t && t.startsWith('ExponentPushToken'));

      if (tokens.length === 0) { setPushStatus('done'); return; }

      const messages = tokens.map(to => ({
        to,
        title: `${emoji} ${notifTitle}`,
        body: notifBody,
        sound: 'default',
        data: { type: 'announcement' },
      }));

      // Expo Push API max 100 per request
      const CHUNK = 100;
      for (let i = 0; i < messages.length; i += CHUNK) {
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate',
          },
          body: JSON.stringify(messages.slice(i, i + CHUNK)),
        });
      }
      setPushStatus('done');
      setTimeout(() => setPushStatus('idle'), 3000);
    } catch {
      setPushStatus('error');
      setTimeout(() => setPushStatus('idle'), 4000);
    }
  };

  const handleAdd = async () => {
    if (!title.trim() || !body.trim()) { alert('Başlık ve içerik zorunludur.'); return; }
    setSaving(true);
    try {
      let imageUrl: string | undefined;
      let storagePath: string | undefined;

      if (imageFile) {
        setUploadProgress(true);
        const path = `announcements/${Date.now()}_${imageFile.name}`;
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
        storagePath = path;
        setUploadProgress(false);
      }

      await addDoc(collection(db, 'announcements'), {
        title: title.trim(),
        body: body.trim(),
        emoji,
        ...(imageUrl && { imageUrl, storagePath }),
        isActive: true,
        createdAt: new Date().toISOString(),
      });

      resetForm();
      // Send push notifications to all users after saving
      await sendPushToAll(title.trim(), body.trim(), emoji);
    } finally {
      setSaving(false);
      setUploadProgress(false);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    await updateDoc(doc(db, 'announcements', id), { isActive: !current });
  };

  const handleDelete = async (ann: Announcement) => {
    if (!confirm('Bu duyuruyu silmek istediğinize emin misiniz?')) return;
    if (ann.storagePath) {
      try { await deleteObject(ref(storage, ann.storagePath)); } catch {}
    }
    await deleteDoc(doc(db, 'announcements', ann.id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#001F3F] via-[#001529] to-black pb-16 pt-20">
      {/* Header */}
      {/* Push notification status toast */}
      {pushStatus !== 'idle' && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium shadow-lg transition-all ${
          pushStatus === 'sending' ? 'bg-blue-500/20 border-blue-500/40 text-blue-300' :
          pushStatus === 'done'    ? 'bg-green-500/20 border-green-500/40 text-green-300' :
                                     'bg-red-500/20 border-red-500/40 text-red-300'
        }`}>
          {pushStatus === 'sending' && <Loader2 className="w-4 h-4 animate-spin" />}
          {pushStatus === 'done'    && <CheckCircle className="w-4 h-4" />}
          {pushStatus === 'error'   && <XCircle className="w-4 h-4" />}
          {pushStatus === 'sending' ? 'Bildirimler gönderiliyor...' :
           pushStatus === 'done'    ? 'Tüm kullanıcılara bildirim gönderildi ✓' :
                                      'Bildirim gönderilemedi'}
        </div>
      )}

      <div className="container mx-auto px-4 mb-6">
        <button
          onClick={() => router.push('/admin-sefa3986')}
          className="flex items-center gap-2 text-white/60 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Geri</span>
        </button>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Duyurular</h1>
              <p className="text-white/50 text-xs">Mobil uygulamada görünen duyurular</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-300 rounded-xl transition-all text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Yeni Duyuru
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 space-y-4">

        {/* Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4"
            >
              <h2 className="text-white font-bold text-base flex items-center gap-2">
                <Bell className="w-4 h-4 text-orange-400" />
                Yeni Duyuru Ekle
              </h2>

              {/* Emoji */}
              <div>
                <label className="text-white/50 text-xs font-medium mb-2 block">Emoji</label>
                <div className="flex gap-2 flex-wrap">
                  {EMOJI_OPTIONS.map((e) => (
                    <button key={e} onClick={() => setEmoji(e)}
                      className={`w-10 h-10 rounded-xl text-xl transition-all ${emoji === e ? 'bg-orange-500/30 border-2 border-orange-500 scale-110' : 'bg-white/5 border border-white/10 hover:bg-white/10'}`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Başlık */}
              <div>
                <label className="text-white/50 text-xs font-medium mb-1 block">Başlık</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="Örn: Bayram Tatili Duyurusu"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-orange-500/50" />
              </div>

              {/* İçerik */}
              <div>
                <label className="text-white/50 text-xs font-medium mb-1 block">İçerik</label>
                <textarea value={body} onChange={(e) => setBody(e.target.value)}
                  placeholder="Duyuru detayını yazın..." rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-orange-500/50 resize-none" />
              </div>

              {/* Fotoğraf */}
              <div>
                <label className="text-white/50 text-xs font-medium mb-2 block">Fotoğraf (İsteğe Bağlı)</label>
                {imagePreview ? (
                  <div className="relative rounded-xl overflow-hidden h-40">
                    <Image src={imagePreview} alt="preview" fill className="object-cover" />
                    <button onClick={clearImage}
                      className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition-colors">
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => fileInputRef.current?.click()}
                    className="w-full h-28 rounded-xl border-2 border-dashed border-white/15 hover:border-orange-500/40 flex flex-col items-center justify-center gap-2 transition-colors">
                    <ImageIcon className="w-6 h-6 text-white/30" />
                    <span className="text-white/40 text-xs">Fotoğraf seç (max 5MB)</span>
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
              </div>

              {/* Önizleme */}
              {(title || body) && (
                <div className="bg-[#00A9A5]/10 border border-[#00A9A5]/25 rounded-xl overflow-hidden">
                  {imagePreview && (
                    <div className="relative h-32">
                      <Image src={imagePreview} alt="preview" fill className="object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </div>
                  )}
                  <div className="p-4">
                    <p className="text-xs text-white/40 mb-2 font-medium uppercase tracking-wider">Mobil Önizleme</p>
                    <div className="flex gap-3 items-start">
                      <span className="text-xl">{emoji}</span>
                      <div>
                        <p className="text-[#4DD9D5] text-sm font-bold">{title || 'Başlık...'}</p>
                        <p className="text-white/60 text-xs leading-relaxed mt-0.5">{body || 'İçerik...'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button onClick={resetForm}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white text-sm transition-colors">
                  İptal
                </button>
                <button onClick={handleAdd} disabled={saving || !title.trim() || !body.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-300 text-sm font-medium transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                  {saving
                    ? <><Loader2 className="w-4 h-4 animate-spin" />{uploadProgress ? 'Yükleniyor...' : 'Kaydediliyor...'}</>
                    : pushStatus === 'sending'
                      ? <><Loader2 className="w-4 h-4 animate-spin" />Bildirim gönderiliyor...</>
                      : <><Plus className="w-4 h-4" />Yayınla</>}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Liste */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-20 text-white/30">
            <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Henüz duyuru yok</p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((ann) => (
              <motion.div key={ann.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl border overflow-hidden transition-all ${ann.isActive ? 'bg-white/5 border-white/10' : 'bg-white/[0.02] border-white/5 opacity-50'}`}>

                {/* Fotoğraf */}
                {ann.imageUrl && (
                  <div className="relative h-36">
                    <Image src={ann.imageUrl} alt={ann.title} fill className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  </div>
                )}

                <div className="flex items-start gap-4 p-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-xl flex-shrink-0">
                    {ann.emoji}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white font-bold text-sm truncate">{ann.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${ann.isActive ? 'bg-green-500/15 border-green-500/30 text-green-400' : 'bg-white/5 border-white/10 text-white/30'}`}>
                        {ann.isActive ? 'Yayında' : 'Gizli'}
                      </span>
                    </div>
                    <p className="text-white/50 text-xs leading-relaxed line-clamp-2">{ann.body}</p>
                    <p className="text-white/20 text-xs mt-1">
                      {new Date(ann.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    <button onClick={() => toggleActive(ann.id, ann.isActive)}
                      title={ann.isActive ? 'Gizle' : 'Yayınla'}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all bg-white/5 hover:bg-white/10 border border-white/10">
                      {ann.isActive ? <XCircle className="w-4 h-4 text-yellow-400" /> : <CheckCircle className="w-4 h-4 text-green-400" />}
                    </button>
                    <button onClick={() => handleDelete(ann)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all bg-red-500/5 hover:bg-red-500/20 border border-red-500/20">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
