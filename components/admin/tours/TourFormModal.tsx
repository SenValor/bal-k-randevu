'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Plus, Trash2, Compass } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Tour, TourFormData, addTour, updateTour } from '@/lib/tourHelpers';

interface TourFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  tour: Tour | null;
  onSuccess: () => void;
}

export default function TourFormModal({
  isOpen,
  onClose,
  tour,
  onSuccess,
}: TourFormModalProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<TourFormData>({
    name: '',
    name_en: '',
    description: '',
    description_en: '',
    price: 0,
    includes: [],
    includes_en: [],
    excludes: [],
    excludes_en: [],
    highlights: [],
    highlights_en: [],
    category: 'normal-with-equipment',
    isActive: true,
  });

  // Geçici input değerleri (TR)
  const [includeInput, setIncludeInput] = useState('');
  const [excludeInput, setExcludeInput] = useState('');
  const [highlightInput, setHighlightInput] = useState('');

  // Geçici input değerleri (EN)
  const [includeInputEn, setIncludeInputEn] = useState('');
  const [excludeInputEn, setExcludeInputEn] = useState('');
  const [highlightInputEn, setHighlightInputEn] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && tour) {
      // Düzenleme modu
      setFormData({
        name: tour.name,
        name_en: tour.name_en || '',
        description: tour.description,
        description_en: tour.description_en || '',
        price: tour.price,
        includes: tour.includes,
        includes_en: tour.includes_en || [],
        excludes: tour.excludes,
        excludes_en: tour.excludes_en || [],
        highlights: tour.highlights,
        highlights_en: tour.highlights_en || [],
        category: tour.category,
        isActive: tour.isActive,
      });
    } else if (isOpen) {
      // Yeni ekleme modu - formu sıfırla
      setFormData({
        name: '',
        name_en: '',
        description: '',
        description_en: '',
        price: 0,
        includes: [],
        includes_en: [],
        excludes: [],
        excludes_en: [],
        highlights: [],
        highlights_en: [],
        category: 'normal-with-equipment',
        isActive: true,
      });
    }
    setError('');
    setIncludeInput('');
    setExcludeInput('');
    setHighlightInput('');
    setIncludeInputEn('');
    setExcludeInputEn('');
    setHighlightInputEn('');
  }, [isOpen, tour]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name.trim()) {
      setError('Tur adı gereklidir');
      return;
    }

    if (formData.price < 0) {
      setError('Fiyat 0 veya daha büyük olmalıdır');
      return;
    }

    setLoading(true);

    try {
      let result;
      if (tour) {
        // Güncelleme
        result = await updateTour(tour.id, formData);
      } else {
        // Yeni ekleme
        result = await addTour(formData);
      }

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.error || 'Bir hata oluştu');
      }
    } catch (err) {
      setError('Beklenmeyen bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Dahil olan hizmetler (TR)
  const handleAddInclude = () => {
    if (includeInput.trim()) {
      setFormData({ ...formData, includes: [...formData.includes, includeInput.trim()] });
      setIncludeInput('');
    }
  };
  const handleRemoveInclude = (index: number) => {
    setFormData({ ...formData, includes: formData.includes.filter((_, i) => i !== index) });
  };

  // Dahil olan hizmetler (EN)
  const handleAddIncludeEn = () => {
    if (includeInputEn.trim()) {
      setFormData({ ...formData, includes_en: [...(formData.includes_en || []), includeInputEn.trim()] });
      setIncludeInputEn('');
    }
  };
  const handleRemoveIncludeEn = (index: number) => {
    setFormData({ ...formData, includes_en: (formData.includes_en || []).filter((_, i) => i !== index) });
  };

  // Dahil olmayan hizmetler (TR)
  const handleAddExclude = () => {
    if (excludeInput.trim()) {
      setFormData({ ...formData, excludes: [...formData.excludes, excludeInput.trim()] });
      setExcludeInput('');
    }
  };
  const handleRemoveExclude = (index: number) => {
    setFormData({ ...formData, excludes: formData.excludes.filter((_, i) => i !== index) });
  };

  // Dahil olmayan hizmetler (EN)
  const handleAddExcludeEn = () => {
    if (excludeInputEn.trim()) {
      setFormData({ ...formData, excludes_en: [...(formData.excludes_en || []), excludeInputEn.trim()] });
      setExcludeInputEn('');
    }
  };
  const handleRemoveExcludeEn = (index: number) => {
    setFormData({ ...formData, excludes_en: (formData.excludes_en || []).filter((_, i) => i !== index) });
  };

  // Öne çıkan özellikler (TR)
  const handleAddHighlight = () => {
    if (highlightInput.trim()) {
      setFormData({ ...formData, highlights: [...formData.highlights, highlightInput.trim()] });
      setHighlightInput('');
    }
  };
  const handleRemoveHighlight = (index: number) => {
    setFormData({ ...formData, highlights: formData.highlights.filter((_, i) => i !== index) });
  };

  // Öne çıkan özellikler (EN)
  const handleAddHighlightEn = () => {
    if (highlightInputEn.trim()) {
      setFormData({ ...formData, highlights_en: [...(formData.highlights_en || []), highlightInputEn.trim()] });
      setHighlightInputEn('');
    }
  };
  const handleRemoveHighlightEn = (index: number) => {
    setFormData({ ...formData, highlights_en: (formData.highlights_en || []).filter((_, i) => i !== index) });
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-[90%] md:w-[800px] max-h-[90vh] overflow-y-auto bg-gradient-to-b from-[#001F3F]/95 to-black/95 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-2xl"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              disabled={loading}
              className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full disabled:opacity-50 z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                  <Compass className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">
                  {tour ? 'Tur Düzenle' : 'Yeni Tur Ekle'}
                </h2>
              </div>
              <p className="text-white/60 text-sm">
                Tur bilgilerini doldurun
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Tur Adı */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Tur Adı 🇹🇷 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={loading}
                    placeholder="Örn: Boğaz Turu"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:border-emerald-500 focus:bg-white/10 outline-none transition-all disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Tour Name 🇬🇧 <span className="text-white/40 font-normal">(opsiyonel)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name_en}
                    onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                    disabled={loading}
                    placeholder="E.g.: Bosphorus Tour"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:border-emerald-500 focus:bg-white/10 outline-none transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Açıklama */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Açıklama 🇹🇷 *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    disabled={loading}
                    placeholder="Tur hakkında detaylı açıklama..."
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:border-emerald-500 focus:bg-white/10 outline-none transition-all disabled:opacity-50 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Description 🇬🇧 <span className="text-white/40 font-normal">(opsiyonel)</span>
                  </label>
                  <textarea
                    value={formData.description_en}
                    onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                    disabled={loading}
                    placeholder="Detailed description about the tour..."
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:border-emerald-500 focus:bg-white/10 outline-none transition-all disabled:opacity-50 resize-none"
                  />
                </div>
              </div>

              {/* Fiyat */}
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Fiyat (₺) *
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                  disabled={loading}
                  min="0"
                  placeholder="2500"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:border-emerald-500 focus:bg-white/10 outline-none transition-all disabled:opacity-50"
                />
              </div>

              {/* Kategori */}
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Kategori
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  disabled={loading}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:bg-white/10 outline-none transition-all disabled:opacity-50"
                >
                  <option value="normal-with-equipment">🐟 Normal Tur (Ekipmanlı)</option>
                  <option value="normal-without-equipment">🎣 Normal Tur (Ekipmansız)</option>
                  <option value="private">⭐ Özel Tur</option>
                </select>
              </div>

              {/* Dahil Olan Hizmetler */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Dahil Olan Hizmetler 🇹🇷
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={includeInput}
                      onChange={(e) => setIncludeInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddInclude())}
                      disabled={loading}
                      placeholder="Örn: Profesyonel rehber"
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/40 focus:border-emerald-500 focus:bg-white/10 outline-none transition-all disabled:opacity-50"
                    />
                    <button type="button" onClick={handleAddInclude} disabled={loading || !includeInput.trim()} className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formData.includes.map((item, index) => (
                      <div key={index} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                        <span className="flex-1 text-white text-sm">✓ {item}</span>
                        <button type="button" onClick={() => handleRemoveInclude(index)} disabled={loading} className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                    {formData.includes.length === 0 && <p className="text-white/40 text-sm text-center py-2">Henüz eklenmedi</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    What's Included 🇬🇧 <span className="text-white/40 font-normal">(opsiyonel)</span>
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={includeInputEn}
                      onChange={(e) => setIncludeInputEn(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddIncludeEn())}
                      disabled={loading}
                      placeholder="E.g.: Professional guide"
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/40 focus:border-emerald-500 focus:bg-white/10 outline-none transition-all disabled:opacity-50"
                    />
                    <button type="button" onClick={handleAddIncludeEn} disabled={loading || !includeInputEn.trim()} className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(formData.includes_en || []).map((item, index) => (
                      <div key={index} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                        <span className="flex-1 text-white text-sm">✓ {item}</span>
                        <button type="button" onClick={() => handleRemoveIncludeEn(index)} disabled={loading} className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                    {(formData.includes_en || []).length === 0 && <p className="text-white/40 text-sm text-center py-2">Not added yet</p>}
                  </div>
                </div>
              </div>

              {/* Dahil Olmayan Hizmetler */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Dahil Olmayan Hizmetler 🇹🇷
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={excludeInput}
                      onChange={(e) => setExcludeInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddExclude())}
                      disabled={loading}
                      placeholder="Örn: Öğle yemeği"
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/40 focus:border-emerald-500 focus:bg-white/10 outline-none transition-all disabled:opacity-50"
                    />
                    <button type="button" onClick={handleAddExclude} disabled={loading || !excludeInput.trim()} className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formData.excludes.map((item, index) => (
                      <div key={index} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                        <span className="flex-1 text-white text-sm">✗ {item}</span>
                        <button type="button" onClick={() => handleRemoveExclude(index)} disabled={loading} className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                    {formData.excludes.length === 0 && <p className="text-white/40 text-sm text-center py-2">Henüz eklenmedi</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Not Included 🇬🇧 <span className="text-white/40 font-normal">(opsiyonel)</span>
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={excludeInputEn}
                      onChange={(e) => setExcludeInputEn(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddExcludeEn())}
                      disabled={loading}
                      placeholder="E.g.: Lunch"
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/40 focus:border-emerald-500 focus:bg-white/10 outline-none transition-all disabled:opacity-50"
                    />
                    <button type="button" onClick={handleAddExcludeEn} disabled={loading || !excludeInputEn.trim()} className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(formData.excludes_en || []).map((item, index) => (
                      <div key={index} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                        <span className="flex-1 text-white text-sm">✗ {item}</span>
                        <button type="button" onClick={() => handleRemoveExcludeEn(index)} disabled={loading} className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                    {(formData.excludes_en || []).length === 0 && <p className="text-white/40 text-sm text-center py-2">Not added yet</p>}
                  </div>
                </div>
              </div>

              {/* Öne Çıkan Özellikler */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Öne Çıkan Özellikler 🇹🇷
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={highlightInput}
                      onChange={(e) => setHighlightInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddHighlight())}
                      disabled={loading}
                      placeholder="Örn: Boğaz Köprüsü"
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/40 focus:border-emerald-500 focus:bg-white/10 outline-none transition-all disabled:opacity-50"
                    />
                    <button type="button" onClick={handleAddHighlight} disabled={loading || !highlightInput.trim()} className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formData.highlights.map((item, index) => (
                      <div key={index} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                        <span className="flex-1 text-white text-sm">⭐ {item}</span>
                        <button type="button" onClick={() => handleRemoveHighlight(index)} disabled={loading} className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                    {formData.highlights.length === 0 && <p className="text-white/40 text-sm text-center py-2">Henüz eklenmedi</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Highlights 🇬🇧 <span className="text-white/40 font-normal">(opsiyonel)</span>
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={highlightInputEn}
                      onChange={(e) => setHighlightInputEn(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddHighlightEn())}
                      disabled={loading}
                      placeholder="E.g.: Bosphorus Bridge"
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/40 focus:border-emerald-500 focus:bg-white/10 outline-none transition-all disabled:opacity-50"
                    />
                    <button type="button" onClick={handleAddHighlightEn} disabled={loading || !highlightInputEn.trim()} className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(formData.highlights_en || []).map((item, index) => (
                      <div key={index} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                        <span className="flex-1 text-white text-sm">⭐ {item}</span>
                        <button type="button" onClick={() => handleRemoveHighlightEn(index)} disabled={loading} className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                    {(formData.highlights_en || []).length === 0 && <p className="text-white/40 text-sm text-center py-2">Not added yet</p>}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <motion.button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  whileHover={!loading ? { scale: 1.02 } : {}}
                  whileTap={!loading ? { scale: 0.98 } : {}}
                  className="flex-1 py-3 bg-white/5 border border-white/10 text-white/80 font-semibold rounded-xl hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  İptal
                </motion.button>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={!loading ? { scale: 1.02 } : {}}
                  whileTap={!loading ? { scale: 0.98 } : {}}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{tour ? 'Güncelleniyor...' : 'Ekleniyor...'}</span>
                    </>
                  ) : (
                    tour ? 'Güncelle' : 'Ekle'
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
