'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Loader2, Plus, Trash2, Youtube } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';

interface PressItem {
  id: string;
  title: string;
  youtubeUrl: string;
  order: number;
}

interface SettingsData {
  pressItems: PressItem[];
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SettingsData>({
    pressItems: [],
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const docRef = doc(db, 'settings', 'general');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setSettings(docSnap.data() as SettingsData);
      }
    } catch (error) {
      console.error('Ayarlar yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'general'), settings);
      alert('Ayarlar başarıyla kaydedildi!');
    } catch (error) {
      console.error('Kaydetme hatası:', error);
      alert('Bir hata oluştu!');
    } finally {
      setSaving(false);
    }
  };

  const addPressItem = () => {
    const newItem: PressItem = {
      id: Date.now().toString(),
      title: '',
      youtubeUrl: '',
      order: settings.pressItems.length,
    };
    setSettings({
      ...settings,
      pressItems: [...settings.pressItems, newItem],
    });
  };

  const removePressItem = (id: string) => {
    setSettings({
      ...settings,
      pressItems: settings.pressItems.filter(item => item.id !== id),
    });
  };

  const updatePressItem = (id: string, field: keyof PressItem, value: string | number) => {
    setSettings({
      ...settings,
      pressItems: settings.pressItems.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#001F3F] via-[#001529] to-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#00A9A5] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#001F3F] via-[#001529] to-black pb-24 pt-24">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.push('/admin-sefa3986')}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Ayarlar</h1>
              <p className="text-white/60 text-sm">Basında Biz ve diğer ayarları yönetin</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-[#00A9A5] hover:bg-[#008B87] text-white font-semibold rounded-xl flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Kaydet
              </>
            )}
          </button>
        </motion.div>

        {/* Basında Biz Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/10 p-6 shadow-2xl mb-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Basında Biz</h2>
              <p className="text-white/60 text-sm">YouTube videolarını ekleyin (maksimum 3 adet)</p>
            </div>
            <button
              onClick={addPressItem}
              disabled={settings.pressItems.length >= 3}
              className="px-4 py-2 bg-[#00A9A5] hover:bg-[#008B87] text-white font-semibold rounded-lg flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Ekle
            </button>
          </div>

          <div className="space-y-4">
            {settings.pressItems.length === 0 ? (
              <div className="text-center py-12 text-white/40">
                Henüz video eklenmemiş. "Ekle" butonuna tıklayarak başlayın.
              </div>
            ) : (
              settings.pressItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/5 border border-white/10 rounded-xl p-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          Başlık
                        </label>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => updatePressItem(item.id, 'title', e.target.value)}
                          placeholder="Video başlığı"
                          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:border-[#00A9A5] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
                          <Youtube className="w-4 h-4" />
                          YouTube URL
                        </label>
                        <input
                          type="url"
                          value={item.youtubeUrl}
                          onChange={(e) => updatePressItem(item.id, 'youtubeUrl', e.target.value)}
                          placeholder="https://www.youtube.com/watch?v=..."
                          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:border-[#00A9A5] focus:outline-none"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => removePressItem(item.id)}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 border-2 border-red-500/30 rounded-lg text-red-600 transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
