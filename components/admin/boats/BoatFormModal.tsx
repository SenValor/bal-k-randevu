'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Plus, Trash2, Anchor, Image as ImageIcon, Upload, Fish, Calendar, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Boat, BoatFormData, addBoat, updateBoat, TimeSlot, ScheduledTimeSlots } from '@/lib/boatHelpers';
import { storage } from '@/lib/firebaseClient';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface BoatFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  boat: Boat | null;
  onSuccess: () => void;
}

export default function BoatFormModal({
  isOpen,
  onClose,
  boat,
  onSuccess,
}: BoatFormModalProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');

  const [formData, setFormData] = useState<BoatFormData>({
    name: '',
    code: '',
    description: '',
    mapsLink: '',
    capacity: 10,
    imageUrl: '',
    seatLayout: 'single',
    tourTypes: {
      normal: true,
      private: false,
      fishingSwimming: false,
    },
    startDate: '',
    endDate: '',
    timeSlots: [],
    scheduledTimeSlots: [],
    isActive: true,
    ribbonText: '',
    isRibbonActive: false,
    ribbonColor: 'red',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && boat) {
      // Düzenleme modu
      setFormData({
        name: boat.name,
        code: boat.code || '',
        description: boat.description,
        mapsLink: boat.mapsLink || '',
        capacity: boat.capacity,
        imageUrl: boat.imageUrl,
        seatLayout: boat.seatLayout,
        tourTypes: boat.tourTypes,
        startDate: boat.startDate,
        endDate: boat.endDate,
        timeSlots: boat.timeSlots,
        scheduledTimeSlots: boat.scheduledTimeSlots || [],
        isActive: boat.isActive,
        ribbonText: boat.ribbonText || '',
        isRibbonActive: boat.isRibbonActive || false,
        ribbonColor: boat.ribbonColor || 'red',
      });
    } else if (isOpen) {
      // Yeni ekleme modu - formu sıfırla
      setFormData({
        name: '',
        code: '',
        description: '',
        mapsLink: '',
        capacity: 10,
        imageUrl: '',
        seatLayout: 'single',
        tourTypes: {
          normal: true,
          private: false,
          fishingSwimming: false,
        },
        startDate: '',
        endDate: '',
        timeSlots: [],
        scheduledTimeSlots: [],
        isActive: true,
        ribbonText: '',
        isRibbonActive: false,
        ribbonColor: 'red',
      });
    }
    setError('');
  }, [isOpen, boat]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Dosya tipi kontrolü
    if (!file.type.startsWith('image/')) {
      setError('Lütfen bir resim dosyası seçin (PNG, JPG, vb.)');
      return;
    }

    // Dosya boyutu kontrolü (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Resim boyutu 5MB\'dan küçük olmalıdır');
      return;
    }

    setUploadingImage(true);
    setError('');

    try {
      // Benzersiz dosya adı oluştur
      const timestamp = Date.now();
      const fileName = `boats/${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      
      // Firebase Storage'a yükle
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, file);
      
      // Download URL al
      const downloadURL = await getDownloadURL(storageRef);
      
      // Form data'yı güncelle
      setFormData({ ...formData, imageUrl: downloadURL });
      setImagePreview(downloadURL);
      
      console.log('✅ Resim yüklendi:', downloadURL);
    } catch (error) {
      console.error('❌ Resim yükleme hatası:', error);
      setError('Resim yüklenirken bir hata oluştu');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name.trim()) {
      setError('Tekne adı gereklidir');
      return;
    }

    if (formData.capacity < 1) {
      setError('Kapasite en az 1 olmalıdır');
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      setError('Başlangıç ve bitiş tarihleri gereklidir');
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      setError('Bitiş tarihi başlangıç tarihinden önce olamaz');
      return;
    }

    setLoading(true);

    try {
      let result;
      if (boat) {
        // Güncelleme
        result = await updateBoat(boat.id, formData);
      } else {
        // Yeni ekleme
        result = await addBoat(formData);
      }

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.error || 'Bir hata oluştu');
      }
    } catch (err) {
      console.error('Form submit hatası:', err);
      setError('Beklenmeyen bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTimeSlot = () => {
    setFormData({
      ...formData,
      timeSlots: [
        ...formData.timeSlots,
        { start: '09:00', end: '12:00', displayName: 'Sabah Turu', baitWarning: false },
      ],
    });
  };

  const handleRemoveTimeSlot = (index: number) => {
    setFormData({
      ...formData,
      timeSlots: formData.timeSlots.filter((_, i) => i !== index),
    });
  };

  const handleTimeSlotChange = (index: number, field: keyof TimeSlot, value: string | boolean) => {
    const newTimeSlots = [...formData.timeSlots];
    newTimeSlots[index] = { ...newTimeSlots[index], [field]: value };
    setFormData({ ...formData, timeSlots: newTimeSlots });
  };

  // Tarih bazlı saat dilimi ekleme
  const handleAddScheduledTimeSlots = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    setFormData({
      ...formData,
      scheduledTimeSlots: [
        ...(formData.scheduledTimeSlots || []),
        {
          effectiveDate: tomorrowStr,
          timeSlots: formData.timeSlots.length > 0 
            ? JSON.parse(JSON.stringify(formData.timeSlots)) // Mevcut saatleri kopyala
            : [{ start: '09:00', end: '12:00', displayName: 'Sabah Turu', baitWarning: false }],
        },
      ],
    });
  };

  const handleRemoveScheduledTimeSlots = (index: number) => {
    setFormData({
      ...formData,
      scheduledTimeSlots: (formData.scheduledTimeSlots || []).filter((_, i) => i !== index),
    });
  };

  const handleScheduledDateChange = (index: number, newDate: string) => {
    const newScheduled = [...(formData.scheduledTimeSlots || [])];
    newScheduled[index] = { ...newScheduled[index], effectiveDate: newDate };
    setFormData({ ...formData, scheduledTimeSlots: newScheduled });
  };

  const handleScheduledTimeSlotChange = (
    scheduleIndex: number,
    slotIndex: number,
    field: keyof TimeSlot,
    value: string | boolean
  ) => {
    const newScheduled = [...(formData.scheduledTimeSlots || [])];
    const newTimeSlots = [...newScheduled[scheduleIndex].timeSlots];
    newTimeSlots[slotIndex] = { ...newTimeSlots[slotIndex], [field]: value };
    newScheduled[scheduleIndex] = { ...newScheduled[scheduleIndex], timeSlots: newTimeSlots };
    setFormData({ ...formData, scheduledTimeSlots: newScheduled });
  };

  const handleAddScheduledTimeSlot = (scheduleIndex: number) => {
    const newScheduled = [...(formData.scheduledTimeSlots || [])];
    newScheduled[scheduleIndex] = {
      ...newScheduled[scheduleIndex],
      timeSlots: [
        ...newScheduled[scheduleIndex].timeSlots,
        { start: '09:00', end: '12:00', displayName: 'Yeni Tur', baitWarning: false },
      ],
    };
    setFormData({ ...formData, scheduledTimeSlots: newScheduled });
  };

  const handleRemoveScheduledTimeSlot = (scheduleIndex: number, slotIndex: number) => {
    const newScheduled = [...(formData.scheduledTimeSlots || [])];
    newScheduled[scheduleIndex] = {
      ...newScheduled[scheduleIndex],
      timeSlots: newScheduled[scheduleIndex].timeSlots.filter((_, i) => i !== slotIndex),
    };
    setFormData({ ...formData, scheduledTimeSlots: newScheduled });
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
            className="relative w-[90%] md:w-[700px] max-h-[90vh] overflow-y-auto bg-gradient-to-b from-[#001F3F]/95 to-black/95 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-2xl"
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
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00A9A5] to-[#008B87] flex items-center justify-center">
                  <Anchor className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">
                  {boat ? 'Tekne Düzenle' : 'Yeni Tekne Ekle'}
                </h2>
              </div>
              <p className="text-white/60 text-sm">
                Tekne bilgilerini doldurun
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
              {/* Tekne Adı ve Kodu */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Tekne Adı *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={loading}
                    placeholder="Örn: Deniz Yıldızı"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:border-[#00A9A5] focus:bg-white/10 outline-none transition-all disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Tekne Kodu *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    disabled={loading}
                    placeholder="Örn: T1"
                    maxLength={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:border-[#00A9A5] focus:bg-white/10 outline-none transition-all disabled:opacity-50"
                  />
                  <p className="text-white/40 text-xs mt-1">Koltuk kodlaması için (T1, T2, vb.)</p>
                </div>
              </div>

              {/* Açıklama */}
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Açıklama
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={loading}
                  placeholder="Tekne hakkında kısa açıklama..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:border-[#00A9A5] focus:bg-white/10 outline-none transition-all disabled:opacity-50 resize-none"
                />
              </div>

              {/* Google Maps Link */}
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  📍 Google Maps Konumu
                </label>
                <input
                  type="url"
                  value={formData.mapsLink}
                  onChange={(e) => setFormData({ ...formData, mapsLink: e.target.value })}
                  disabled={loading}
                  placeholder="https://maps.google.com/..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:border-[#00A9A5] focus:bg-white/10 outline-none transition-all disabled:opacity-50"
                />
                <p className="text-white/40 text-xs mt-1">Teknenin kalkış noktasının Google Maps linki</p>
              </div>

              {/* Kapasite & Koltuk Düzeni */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Kapasite *
                  </label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                    disabled={loading}
                    min="1"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:border-[#00A9A5] focus:bg-white/10 outline-none transition-all disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Koltuk Yerleşimi
                  </label>
                  <select
                    value={formData.seatLayout}
                    onChange={(e) => setFormData({ ...formData, seatLayout: e.target.value as 'single' | 'double' })}
                    disabled={loading}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#00A9A5] focus:bg-white/10 outline-none transition-all disabled:opacity-50"
                  >
                    <option value="single">Tekli</option>
                    <option value="double">İkili</option>
                  </select>
                </div>
              </div>

              {/* Resim Yükleme */}
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Tekne Resmi
                </label>
                
                {/* Resim Önizleme */}
                {(imagePreview || formData.imageUrl) && (
                  <div className="mb-4 relative group">
                    <img
                      src={imagePreview || formData.imageUrl}
                      alt="Tekne önizleme"
                      className="w-full h-48 object-cover rounded-xl border border-white/10"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, imageUrl: '' });
                        setImagePreview('');
                      }}
                      className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 text-white p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Dosya Yükleme Butonu */}
                <div className="relative">
                  <input
                    type="file"
                    id="boat-image-upload"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={loading || uploadingImage}
                    className="hidden"
                  />
                  <label
                    htmlFor="boat-image-upload"
                    className={`flex items-center justify-center gap-3 w-full bg-white/5 border-2 border-dashed border-white/20 rounded-xl px-4 py-8 text-white/60 hover:border-[#00A9A5] hover:bg-white/10 transition-all cursor-pointer ${
                      (loading || uploadingImage) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {uploadingImage ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin text-[#00A9A5]" />
                        <span>Yükleniyor...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-6 h-6" />
                        <div className="text-center">
                          <p className="text-white font-medium">Resim Yükle</p>
                          <p className="text-xs text-white/40 mt-1">PNG, JPG (Max 5MB)</p>
                        </div>
                      </>
                    )}
                  </label>
                </div>

                {/* Manuel URL Girişi (Opsiyonel) */}
                <div className="mt-3">
                  <p className="text-white/40 text-xs mb-2">veya URL girin:</p>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      value={formData.imageUrl}
                      onChange={(e) => {
                        setFormData({ ...formData, imageUrl: e.target.value });
                        setImagePreview(e.target.value);
                      }}
                      disabled={loading || uploadingImage}
                      placeholder="https://example.com/boat.jpg"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-2 text-white placeholder-white/40 focus:border-[#00A9A5] focus:bg-white/10 outline-none transition-all disabled:opacity-50 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Tur Tipleri */}
              <div>
                <label className="block text-white/80 text-sm font-medium mb-3">
                  Tur Tipleri
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.tourTypes.normal}
                      onChange={(e) => setFormData({
                        ...formData,
                        tourTypes: { ...formData.tourTypes, normal: e.target.checked }
                      })}
                      disabled={loading}
                      className="w-5 h-5 rounded border-white/20 bg-white/5 text-[#00A9A5] focus:ring-[#00A9A5] focus:ring-offset-0"
                    />
                    <span className="text-white/80">Normal Tur</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.tourTypes.private}
                      onChange={(e) => setFormData({
                        ...formData,
                        tourTypes: { ...formData.tourTypes, private: e.target.checked }
                      })}
                      disabled={loading}
                      className="w-5 h-5 rounded border-white/20 bg-white/5 text-[#00A9A5] focus:ring-[#00A9A5] focus:ring-offset-0"
                    />
                    <span className="text-white/80">Özel Tur</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.tourTypes.fishingSwimming}
                      onChange={(e) => setFormData({
                        ...formData,
                        tourTypes: { ...formData.tourTypes, fishingSwimming: e.target.checked }
                      })}
                      disabled={loading}
                      className="w-5 h-5 rounded border-white/20 bg-white/5 text-[#00A9A5] focus:ring-[#00A9A5] focus:ring-offset-0"
                    />
                    <span className="text-white/80">Balık Avı & Yüzme</span>
                  </label>
                </div>
              </div>

              {/* Bant (Ribbon) Ayarları */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">Tekne Üzeri Bant (Ribbon)</span>
                    <span className="px-2 py-0.5 bg-[#00A9A5]/20 text-[#00A9A5] text-xs rounded-full">Yeni</span>
                  </div>
                  
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isRibbonActive}
                      onChange={(e) => setFormData({ ...formData, isRibbonActive: e.target.checked })}
                      className="sr-only peer"
                      disabled={loading}
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#00A9A5]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00A9A5]"></div>
                  </label>
                </div>

                {formData.isRibbonActive && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">
                        Bant Metni
                      </label>
                      <input
                        type="text"
                        value={formData.ribbonText}
                        onChange={(e) => setFormData({ ...formData, ribbonText: e.target.value })}
                        disabled={loading}
                        placeholder="Örn: DOLU, TADİLATTA"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:border-[#00A9A5] focus:bg-white/10 outline-none transition-all disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">
                        Bant Rengi
                      </label>
                      <select
                        value={formData.ribbonColor}
                        onChange={(e) => setFormData({ ...formData, ribbonColor: e.target.value })}
                        disabled={loading}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#00A9A5] focus:bg-white/10 outline-none transition-all disabled:opacity-50"
                      >
                        <option value="red">Kırmızı</option>
                        <option value="blue">Mavi</option>
                        <option value="green">Yeşil</option>
                        <option value="yellow">Sarı</option>
                        <option value="purple">Mor</option>
                        <option value="black">Siyah</option>
                      </select>
                    </div>

                    {/* Önizleme */}
                    <div className="col-span-2 mt-2">
                      <p className="text-white/40 text-xs mb-2">Önizleme:</p>
                      <div className="relative w-32 h-20 bg-gray-800 rounded-lg overflow-hidden border border-white/10">
                         {/* Ribbon CSS Implementation Preview */}
                         <div className={`absolute top-0 right-0 w-24 h-24 overflow-hidden pointer-events-none`}>
                           <div className={`absolute top-0 right-0 transform translate-x-[30%] translate-y-[-20%] rotate-45 w-[150%] text-center text-[10px] font-bold text-white shadow-sm py-1
                             ${formData.ribbonColor === 'red' ? 'bg-red-600' : 
                               formData.ribbonColor === 'blue' ? 'bg-blue-600' : 
                               formData.ribbonColor === 'green' ? 'bg-green-600' :
                               formData.ribbonColor === 'yellow' ? 'bg-yellow-500 text-black' : 
                               formData.ribbonColor === 'purple' ? 'bg-purple-600' :
                               formData.ribbonColor === 'black' ? 'bg-black' : 'bg-red-600'}
                           `}>
                             {formData.ribbonText || 'METİN'}
                           </div>
                         </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tarih Aralığı */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Başlangıç Tarihi *
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    disabled={loading}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#00A9A5] focus:bg-white/10 outline-none transition-all disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Bitiş Tarihi *
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    disabled={loading}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#00A9A5] focus:bg-white/10 outline-none transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Zaman Dilimleri */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-white/80 text-sm font-medium">
                    Zaman Dilimleri
                  </label>
                  <motion.button
                    type="button"
                    onClick={handleAddTimeSlot}
                    disabled={loading}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-3 py-1.5 bg-[#00A9A5]/20 hover:bg-[#00A9A5]/30 text-[#00A9A5] rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    Dilim Ekle
                  </motion.button>
                </div>

                <div className="space-y-3">
                  {formData.timeSlots.map((slot, index) => (
                    <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div>
                          <label className="block text-white/60 text-xs mb-1">Başlangıç</label>
                          <input
                            type="time"
                            value={slot.start}
                            onChange={(e) => handleTimeSlotChange(index, 'start', e.target.value)}
                            disabled={loading}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-[#00A9A5] outline-none transition-all disabled:opacity-50"
                          />
                        </div>

                        <div>
                          <label className="block text-white/60 text-xs mb-1">Bitiş</label>
                          <input
                            type="time"
                            value={slot.end}
                            onChange={(e) => handleTimeSlotChange(index, 'end', e.target.value)}
                            disabled={loading}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-[#00A9A5] outline-none transition-all disabled:opacity-50"
                          />
                        </div>

                        <div>
                          <label className="block text-white/60 text-xs mb-1">Görünen Ad</label>
                          <input
                            type="text"
                            value={slot.displayName}
                            onChange={(e) => handleTimeSlotChange(index, 'displayName', e.target.value)}
                            disabled={loading}
                            placeholder="Sabah Turu"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 focus:border-[#00A9A5] outline-none transition-all disabled:opacity-50"
                          />
                        </div>
                      </div>

                      {/* Yem Uyarısı Toggle */}
                      <div className="mb-3 flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Fish className={`w-4 h-4 ${slot.baitWarning ? 'text-orange-400' : 'text-white/40'}`} />
                          <span className="text-white/80 text-sm">Yem Uyarısı</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleTimeSlotChange(index, 'baitWarning', !slot.baitWarning)}
                          disabled={loading}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                            slot.baitWarning ? 'bg-orange-500' : 'bg-white/20'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              slot.baitWarning ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveTimeSlot(index)}
                        disabled={loading}
                        className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-3 h-3" />
                        Kaldır
                      </button>
                    </div>
                  ))}

                  {formData.timeSlots.length === 0 && (
                    <p className="text-white/40 text-sm text-center py-4">
                      Henüz zaman dilimi eklenmedi
                    </p>
                  )}
                </div>
              </div>

              {/* Tarih Bazlı Saat Değişiklikleri */}
              <div className="border-t border-white/10 pt-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="block text-white/80 text-sm font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-400" />
                      Planlı Saat Değişiklikleri
                    </label>
                    <p className="text-white/40 text-xs mt-1">
                      Belirli bir tarihten itibaren geçerli olacak yeni saatler ekleyin
                    </p>
                  </div>
                  <motion.button
                    type="button"
                    onClick={handleAddScheduledTimeSlots}
                    disabled={loading}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    Yeni Plan Ekle
                  </motion.button>
                </div>

                <div className="space-y-4">
                  {(formData.scheduledTimeSlots || []).map((schedule, scheduleIndex) => (
                    <div key={scheduleIndex} className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4">
                      {/* Geçerlilik Tarihi */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Clock className="w-5 h-5 text-purple-400" />
                          <div>
                            <label className="block text-white/60 text-xs mb-1">Geçerlilik Başlangıcı</label>
                            <input
                              type="date"
                              value={schedule.effectiveDate}
                              onChange={(e) => handleScheduledDateChange(scheduleIndex, e.target.value)}
                              disabled={loading}
                              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-400 outline-none transition-all disabled:opacity-50"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveScheduledTimeSlots(scheduleIndex)}
                          disabled={loading}
                          className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Bu plan için saat dilimleri */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-white/60 text-xs">Bu tarihten itibaren geçerli saatler:</span>
                          <button
                            type="button"
                            onClick={() => handleAddScheduledTimeSlot(scheduleIndex)}
                            disabled={loading}
                            className="text-purple-400 hover:text-purple-300 text-xs flex items-center gap-1 transition-colors disabled:opacity-50"
                          >
                            <Plus className="w-3 h-3" />
                            Saat Ekle
                          </button>
                        </div>

                        {schedule.timeSlots.map((slot, slotIndex) => (
                          <div key={slotIndex} className="bg-white/5 border border-white/10 rounded-lg p-3">
                            <div className="grid grid-cols-4 gap-2">
                              <div>
                                <label className="block text-white/40 text-xs mb-1">Başlangıç</label>
                                <input
                                  type="time"
                                  value={slot.start}
                                  onChange={(e) => handleScheduledTimeSlotChange(scheduleIndex, slotIndex, 'start', e.target.value)}
                                  disabled={loading}
                                  className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-white text-xs focus:border-purple-400 outline-none transition-all disabled:opacity-50"
                                />
                              </div>
                              <div>
                                <label className="block text-white/40 text-xs mb-1">Bitiş</label>
                                <input
                                  type="time"
                                  value={slot.end}
                                  onChange={(e) => handleScheduledTimeSlotChange(scheduleIndex, slotIndex, 'end', e.target.value)}
                                  disabled={loading}
                                  className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-white text-xs focus:border-purple-400 outline-none transition-all disabled:opacity-50"
                                />
                              </div>
                              <div>
                                <label className="block text-white/40 text-xs mb-1">Ad</label>
                                <input
                                  type="text"
                                  value={slot.displayName}
                                  onChange={(e) => handleScheduledTimeSlotChange(scheduleIndex, slotIndex, 'displayName', e.target.value)}
                                  disabled={loading}
                                  placeholder="Sabah Turu"
                                  className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-white text-xs placeholder-white/30 focus:border-purple-400 outline-none transition-all disabled:opacity-50"
                                />
                              </div>
                              <div className="flex items-end">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveScheduledTimeSlot(scheduleIndex, slotIndex)}
                                  disabled={loading || schedule.timeSlots.length <= 1}
                                  className="text-red-400 hover:text-red-300 p-1.5 hover:bg-red-500/10 rounded transition-colors disabled:opacity-30"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Özet bilgi */}
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <p className="text-purple-300/60 text-xs">
                          📅 {new Date(schedule.effectiveDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} tarihinden itibaren {schedule.timeSlots.length} saat dilimi aktif olacak
                        </p>
                      </div>
                    </div>
                  ))}

                  {(!formData.scheduledTimeSlots || formData.scheduledTimeSlots.length === 0) && (
                    <div className="text-center py-6 bg-white/5 border border-dashed border-white/10 rounded-xl">
                      <Calendar className="w-8 h-8 text-white/20 mx-auto mb-2" />
                      <p className="text-white/40 text-sm">
                        Henüz planlı saat değişikliği yok
                      </p>
                      <p className="text-white/30 text-xs mt-1">
                        İleride geçerli olacak farklı saatler eklemek için "Yeni Plan Ekle" butonunu kullanın
                      </p>
                    </div>
                  )}
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
                  className="flex-1 py-3 bg-gradient-to-r from-[#00A9A5] to-[#008B87] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#00A9A5]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{boat ? 'Güncelleniyor...' : 'Ekleniyor...'}</span>
                    </>
                  ) : (
                    boat ? 'Güncelle' : 'Ekle'
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
