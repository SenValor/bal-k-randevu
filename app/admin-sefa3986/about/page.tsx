'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';

interface AboutContent {
  title: string;
  subtitle: string;
  description: string;
  mission: string;
  vision: string;
  values: string[];
}

export default function AdminAboutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState<AboutContent>({
    title: 'Hakkımızda',
    subtitle: 'İstanbul Boğazı\'nda Balık Avı Deneyimi',
    description: '',
    mission: '',
    vision: '',
    values: ['', '', ''],
  });

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const docRef = doc(db, 'settings', 'about');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setContent(docSnap.data() as AboutContent);
      }
    } catch (error) {
      console.error('İçerik yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'about'), content);
      alert('İçerik başarıyla kaydedildi! ✅');
    } catch (error) {
      console.error('Kaydetme hatası:', error);
      alert('Bir hata oluştu!');
    } finally {
      setSaving(false);
    }
  };

  const updateValue = (index: number, value: string) => {
    const newValues = [...content.values];
    newValues[index] = value;
    setContent({ ...content, values: newValues });
  };

  const addValue = () => {
    setContent({ ...content, values: [...content.values, ''] });
  };

  const removeValue = (index: number) => {
    const newValues = content.values.filter((_, i) => i !== index);
    setContent({ ...content, values: newValues });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#001F3F] via-[#001529] to-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#00A9A5] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#001F3F] via-[#001529] to-black pb-24 pt-20">
      {/* Header */}
      <div className="border-b border-white/10 bg-white/5 backdrop-blur-md sticky top-20 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin-sefa3986')}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-white" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Hakkımızda Düzenle</h1>
                <p className="text-white/60 text-sm">Hakkımızda sayfası içeriğini yönetin</p>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#00A9A5] to-[#008B87] hover:from-[#008B87] hover:to-[#00A9A5] text-white font-semibold rounded-xl transition-all disabled:opacity-50"
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
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Başlık */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-6"
          >
            <label className="block text-white font-semibold mb-2">Başlık</label>
            <input
              type="text"
              value={content.title}
              onChange={(e) => setContent({ ...content, title: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:border-[#00A9A5] focus:outline-none"
              placeholder="Hakkımızda"
            />
          </motion.div>

          {/* Alt Başlık */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-6"
          >
            <label className="block text-white font-semibold mb-2">Alt Başlık</label>
            <input
              type="text"
              value={content.subtitle}
              onChange={(e) => setContent({ ...content, subtitle: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:border-[#00A9A5] focus:outline-none"
              placeholder="İstanbul Boğazı'nda Balık Avı Deneyimi"
            />
          </motion.div>

          {/* Açıklama */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-6"
          >
            <label className="block text-white font-semibold mb-2">Açıklama</label>
            <textarea
              value={content.description}
              onChange={(e) => setContent({ ...content, description: e.target.value })}
              rows={6}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:border-[#00A9A5] focus:outline-none resize-none"
              placeholder="Şirket hakkında genel bilgi..."
            />
          </motion.div>

          {/* Misyon */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-6"
          >
            <label className="block text-white font-semibold mb-2">Misyonumuz</label>
            <textarea
              value={content.mission}
              onChange={(e) => setContent({ ...content, mission: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:border-[#00A9A5] focus:outline-none resize-none"
              placeholder="Misyonumuz..."
            />
          </motion.div>

          {/* Vizyon */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-6"
          >
            <label className="block text-white font-semibold mb-2">Vizyonumuz</label>
            <textarea
              value={content.vision}
              onChange={(e) => setContent({ ...content, vision: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:border-[#00A9A5] focus:outline-none resize-none"
              placeholder="Vizyonumuz..."
            />
          </motion.div>

          {/* Değerlerimiz */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <label className="block text-white font-semibold">Değerlerimiz</label>
              <button
                onClick={addValue}
                className="px-4 py-2 bg-[#00A9A5]/20 hover:bg-[#00A9A5]/30 text-[#00A9A5] rounded-lg transition-colors text-sm font-medium"
              >
                + Değer Ekle
              </button>
            </div>
            <div className="space-y-3">
              {content.values.map((value, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => updateValue(index, e.target.value)}
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:border-[#00A9A5] focus:outline-none"
                    placeholder={`Değer ${index + 1}`}
                  />
                  {content.values.length > 1 && (
                    <button
                      onClick={() => removeValue(index)}
                      className="px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-colors"
                    >
                      Sil
                    </button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
