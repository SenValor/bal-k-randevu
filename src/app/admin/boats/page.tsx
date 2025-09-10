'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db, storage } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// Tarih aralığı modal komponenti
function DateRangeModal({ boat, onClose, onSave }: DateRangeModalProps) {
  const [dateRange, setDateRange] = useState<Boat['dateRange']>({
    enabled: boat.dateRange?.enabled || false,
    startDate: boat.dateRange?.startDate || '',
    endDate: boat.dateRange?.endDate || '',
    note: boat.dateRange?.note || ''
  });
  
  const handleSave = () => {
    if (dateRange.enabled && (!dateRange.startDate || !dateRange.endDate)) {
      alert('Tarih aralığı aktifse başlangıç ve bitiş tarihleri zorunludur.');
      return;
    }
    
    if (dateRange.enabled && dateRange.startDate >= dateRange.endDate) {
      alert('Bitiş tarihi başlangıç tarihinden sonra olmalıdır.');
      return;
    }
    
    onSave(boat.id, dateRange);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              📅 {boat.name} - Tarih Aralığı
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            {/* Tarih aralığı aktif/pasif */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="dateRangeEnabled"
                  checked={dateRange.enabled}
                  onChange={(e) => setDateRange({ ...dateRange, enabled: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="dateRangeEnabled" className="font-medium text-blue-800">
                  Bu tekne için tarih aralığı sınırı aktif
                </label>
              </div>
              <p className="text-blue-600 text-sm mt-2">
                ℹ️ Aktif olduğunda bu tekne sadece belirlenen tarih aralığında rezervasyon alabilir.
              </p>
            </div>

            {/* Tarih seçimi (sadece aktifse) */}
            {dateRange.enabled && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Başlangıç Tarihi *
                    </label>
                    <input
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bitiş Tarihi *
                    </label>
                    <input
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Açıklama (Opsiyonel)
                  </label>
                  <textarea
                    value={dateRange.note}
                    onChange={(e) => setDateRange({ ...dateRange, note: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="Örn: Sezon sınırı, bakım dönemi, özel etkinlik..."
                  />
                </div>
                
                {/* Önizleme */}
                {dateRange.startDate && dateRange.endDate && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-green-700 font-medium text-sm">
                      📅 Aktif Tarih Aralığı:
                    </p>
                    <p className="text-green-600 text-sm">
                      {new Date(dateRange.startDate).toLocaleDateString('tr-TR')} - {new Date(dateRange.endDate).toLocaleDateString('tr-TR')}
                    </p>
                    <p className="text-green-600 text-xs mt-1">
                      Toplam {Math.ceil((new Date(dateRange.endDate).getTime() - new Date(dateRange.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} gün
                    </p>
                  </div>
                )}
              </>
            )}
            
            {/* Pasif durum açıklaması */}
            {!dateRange.enabled && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-gray-600 text-sm">
                  ℹ️ Tarih aralığı sınırı pasifken bu tekne tüm tarihler için rezervasyon alabilir.
                </p>
              </div>
            )}
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              İptal
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              💾 Kaydet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Çalışma saatleri modal komponenti
function ScheduleModal({ boat, onClose, onSave }: ScheduleModalProps) {
  const [schedule, setSchedule] = useState<Boat['customSchedule']>({
    enabled: boat.customSchedule?.enabled || false,
    timeSlots: boat.customSchedule?.timeSlots || [
      { id: 'morning', start: '07:00', end: '13:00', isActive: true },
      { id: 'afternoon', start: '14:00', end: '20:00', isActive: true }
    ],
    note: boat.customSchedule?.note || ''
  });
  
  const addTimeSlot = () => {
    const newSlot: TimeSlot = {
      id: `slot_${Date.now()}`,
      start: '09:00',
      end: '15:00',
      isActive: true
    };
    setSchedule({
      ...schedule,
      timeSlots: [...schedule.timeSlots, newSlot]
    });
  };
  
  const updateTimeSlot = (id: string, field: keyof TimeSlot, value: string | boolean) => {
    setSchedule({
      ...schedule,
      timeSlots: schedule.timeSlots.map(slot => 
        slot.id === id ? { ...slot, [field]: value } : slot
      )
    });
  };
  
  const deleteTimeSlot = (id: string) => {
    if (schedule.timeSlots.length <= 1) {
      alert('En az 1 saat dilimi bulunmalıdır!');
      return;
    }
    setSchedule({
      ...schedule,
      timeSlots: schedule.timeSlots.filter(slot => slot.id !== id)
    });
  };
  
  const handleSave = () => {
    if (schedule.enabled) {
      const activeSlots = schedule.timeSlots.filter(slot => slot.isActive);
      if (activeSlots.length === 0) {
        alert('Özel saatler aktifse en az 1 aktif saat dilimi bulunmalıdır.');
        return;
      }
      
      // Saat doğrulama
      for (const slot of activeSlots) {
        if (!slot.start || !slot.end) {
          alert('Tüm aktif saat dilimlerinin başlangıç ve bitiş saatleri belirtilmelidir.');
          return;
        }
        if (slot.start >= slot.end) {
          alert('Bitiş saati başlangıç saatinden sonra olmalıdır.');
          return;
        }
      }
    }
    
    onSave(boat.id, schedule);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              🕰️ {boat.name} - Çalışma Saatleri
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            {/* Özel saatler aktif/pasif */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="scheduleEnabled"
                  checked={schedule.enabled}
                  onChange={(e) => setSchedule({ ...schedule, enabled: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="scheduleEnabled" className="font-medium text-blue-800">
                  Bu tekne için özel çalışma saatleri aktif
                </label>
              </div>
              <p className="text-blue-600 text-sm mt-2">
                ℹ️ Aktif olduğunda bu tekne sadece belirlenen saatlerde rezervasyon alabilir.
              </p>
            </div>

            {/* Saat dilimleri (sadece aktifse) */}
            {schedule.enabled && (
              <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">Çalışma Saatleri</h3>
                    <button
                      onClick={addTimeSlot}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-medium"
                    >
                      + Saat Ekle
                    </button>
                  </div>
                  
                  {schedule.timeSlots.map((slot) => (
                    <div key={slot.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center space-x-3 mb-3">
                        <input
                          type="checkbox"
                          checked={slot.isActive}
                          onChange={(e) => updateTimeSlot(slot.id, 'isActive', e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="font-medium text-gray-700">Aktif</span>
                        {schedule.timeSlots.length > 1 && (
                          <button
                            onClick={() => deleteTimeSlot(slot.id)}
                            className="ml-auto text-red-500 hover:text-red-700 font-medium text-sm"
                          >
                            🗑️ Sil
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Başlangıç Saati
                          </label>
                          <input
                            type="time"
                            value={slot.start}
                            onChange={(e) => updateTimeSlot(slot.id, 'start', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bitiş Saati
                          </label>
                          <input
                            type="time"
                            value={slot.end}
                            onChange={(e) => updateTimeSlot(slot.id, 'end', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Açıklama (Opsiyonel)
                  </label>
                  <textarea
                    value={schedule.note}
                    onChange={(e) => setSchedule({ ...schedule, note: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="Örn: Sabah turu, akşam turu, özel etkinlik saatleri..."
                  />
                </div>
                
                {/* Önizleme */}
                {schedule.timeSlots.filter(slot => slot.isActive && slot.start && slot.end).length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-green-700 font-medium text-sm mb-2">
                      🕰️ Aktif Çalışma Saatleri:
                    </p>
                    <div className="space-y-1">
                      {schedule.timeSlots
                        .filter(slot => slot.isActive && slot.start && slot.end)
                        .map((slot) => (
                          <p key={slot.id} className="text-green-600 text-sm">
                            • {slot.start} - {slot.end}
                          </p>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
            
            {/* Pasif durum açıklaması */}
            {!schedule.enabled && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-gray-600 text-sm">
                  ℹ️ Özel çalışma saatleri pasifken bu tekne varsayılan sistem saatlerini kullanır.
                </p>
              </div>
            )}
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              İptal
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              💾 Kaydet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface TimeSlot {
  id: string;
  start: string;
  end: string;
  isActive: boolean;
}

interface Boat {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  capacity: number;
  seatingLayout: 'single' | 'double'; // single = 1. tekne tarzı, double = 2. tekne tarzı
  isActive: boolean;
  status: 'active' | 'inactive' | 'coming-soon' | 'maintenance'; // Tekne durumu
  statusMessage?: string; // Özel durum mesajı (örn: "Çok yakında hizmetinizde")
  createdAt: string;
  updatedAt: string;
  // Tarih aralığı bilgileri
  dateRange?: {
    enabled: boolean;
    startDate: string;
    endDate: string;
    note?: string;
  };
  // Çalışma saatleri
  customSchedule?: {
    enabled: boolean;
    timeSlots: TimeSlot[];
    note?: string;
  };
}

interface DateRangeModalProps {
  boat: Boat;
  onClose: () => void;
  onSave: (boatId: string, dateRange: Boat['dateRange']) => void;
}

interface ScheduleModalProps {
  boat: Boat;
  onClose: () => void;
  onSave: (boatId: string, schedule: Boat['customSchedule']) => void;
}

export default function BoatManagement() {
  const router = useRouter();
  const [boats, setBoats] = useState<Boat[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingBoat, setEditingBoat] = useState<Boat | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [dateRangeModal, setDateRangeModal] = useState<Boat | null>(null);
  const [scheduleModal, setScheduleModal] = useState<Boat | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    capacity: 12,
    seatingLayout: 'single' as 'single' | 'double',
    isActive: true,
    status: 'active' as 'active' | 'inactive' | 'coming-soon' | 'maintenance',
    statusMessage: '',
    imageFile: null as File | null
  });

  // Auth kontrolü
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
      } else {
        router.push('/admin');
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Tekneleri dinle
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubscribe = onSnapshot(
      collection(db, 'boats'),
      (snapshot) => {
        const boatList: Boat[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          boatList.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
          } as Boat);
        });
        
        setBoats(boatList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        setLoading(false);
      },
      (error) => {
        console.error('Tekne verileri alınamadı:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isAuthenticated]);

  // Fotoğraf yükleme
  const uploadImage = async (file: File): Promise<string> => {
    const fileName = `boats/${Date.now()}_${file.name}`;
    const imageRef = ref(storage, fileName);
    
    await uploadBytes(imageRef, file);
    const downloadURL = await getDownloadURL(imageRef);
    
    return downloadURL;
  };

  // Fotoğraf silme
  const deleteImage = async (imageUrl: string) => {
    try {
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
    } catch (error) {
      console.error('Fotoğraf silinemedi:', error);
    }
  };

  // Tekne ekleme
  const handleAddBoat = async () => {
    if (!formData.name || !formData.imageFile) {
      alert('Lütfen tekne adı ve fotoğraf seçin');
      return;
    }

    setUploading(true);
    try {
      // Fotoğraf yükle
      const imageUrl = await uploadImage(formData.imageFile);

      // Tekne verisini kaydet
      await addDoc(collection(db, 'boats'), {
        name: formData.name,
        description: formData.description,
        imageUrl,
        capacity: formData.capacity,
        seatingLayout: formData.seatingLayout,
        isActive: formData.isActive,
        status: formData.status,
        statusMessage: formData.statusMessage,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Formu temizle
      setFormData({
        name: '',
        description: '',
        capacity: 12,
        seatingLayout: 'single',
        isActive: true,
        status: 'active',
        statusMessage: '',
        imageFile: null
      });
      setShowAddModal(false);
      
      alert('Tekne başarıyla eklendi!');
    } catch (error) {
      console.error('Tekne eklenirken hata:', error);
      alert('Tekne eklenirken hata oluştu');
    } finally {
      setUploading(false);
    }
  };

  // Tekne güncelleme
  const handleUpdateBoat = async () => {
    if (!editingBoat || !formData.name) {
      alert('Lütfen tekne adı girin');
      return;
    }

    setUploading(true);
    try {
      let imageUrl = editingBoat.imageUrl;

      // Yeni fotoğraf varsa yükle
      if (formData.imageFile) {
        // Eski fotoğrafı sil
        await deleteImage(editingBoat.imageUrl);
        // Yeni fotoğrafı yükle
        imageUrl = await uploadImage(formData.imageFile);
      }

      // Tekne verisini güncelle
      await updateDoc(doc(db, 'boats', editingBoat.id), {
        name: formData.name,
        description: formData.description,
        imageUrl,
        capacity: formData.capacity,
        seatingLayout: formData.seatingLayout,
        isActive: formData.isActive,
        status: formData.status,
        statusMessage: formData.statusMessage,
        updatedAt: new Date()
      });

      // Formu temizle
      setFormData({
        name: '',
        description: '',
        capacity: 12,
        seatingLayout: 'single',
        isActive: true,
        status: 'active',
        statusMessage: '',
        imageFile: null
      });
      setEditingBoat(null);
      
      alert('Tekne başarıyla güncellendi!');
    } catch (error) {
      console.error('Tekne güncellenirken hata:', error);
      alert('Tekne güncellenirken hata oluştu');
    } finally {
      setUploading(false);
    }
  };

  // Tekne silme
  const handleDeleteBoat = async (boat: Boat) => {
    if (!confirm(`${boat.name} teknesini silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      // Fotoğrafı sil
      await deleteImage(boat.imageUrl);
      
      // Tekne verisini sil
      await deleteDoc(doc(db, 'boats', boat.id));
      
      alert('Tekne başarıyla silindi!');
    } catch (error) {
      console.error('Tekne silinirken hata:', error);
      alert('Tekne silinirken hata oluştu');
    }
  };

  // Düzenleme modalını aç
  const openEditModal = (boat: Boat) => {
    setEditingBoat(boat);
    setFormData({
      name: boat.name,
      description: boat.description,
      capacity: boat.capacity,
      seatingLayout: boat.seatingLayout,
      isActive: boat.isActive,
      status: boat.status || 'active',
      statusMessage: boat.statusMessage || '',
      imageFile: null
    });
  };

  // Tarih aralığı kaydetme
  const handleSaveDateRange = async (boatId: string, dateRange: Boat['dateRange']) => {
    try {
      await updateDoc(doc(db, 'boats', boatId), {
        dateRange,
        updatedAt: new Date()
      });
      
      setDateRangeModal(null);
      alert('Tarih aralığı başarıyla güncellendi!');
    } catch (error) {
      console.error('Tarih aralığı güncellenirken hata:', error);
      alert('Tarih aralığı güncellenirken hata oluştu');
    }
  };
  
  // Çalışma saatleri kaydetme
  const handleSaveSchedule = async (boatId: string, schedule: Boat['customSchedule']) => {
    try {
      await updateDoc(doc(db, 'boats', boatId), {
        customSchedule: schedule,
        updatedAt: new Date()
      });
      
      setScheduleModal(null);
      alert('Çalışma saatleri başarıyla güncellendi!');
    } catch (error) {
      console.error('Çalışma saatleri güncellenirken hata:', error);
      alert('Çalışma saatleri güncellenirken hata oluştu');
    }
  };

  // Modal kapat
  const closeModal = () => {
    setShowAddModal(false);
    setEditingBoat(null);
    setFormData({
      name: '',
      description: '',
      capacity: 12,
      seatingLayout: 'single',
      isActive: true,
      status: 'active',
      statusMessage: '',
      imageFile: null
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Tekneler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-blue-600 hover:text-blue-800">
                ← Geri
              </Link>
              <h1 className="text-xl font-bold text-gray-900">⛵ Tekne Yönetimi</h1>
            </div>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              + Yeni Tekne Ekle
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {boats.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">⛵</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Henüz tekne yok</h2>
            <p className="text-gray-600 mb-6">İlk teknenizi ekleyerek başlayın</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              + İlk Tekneyi Ekle
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boats.map((boat) => (
              <div
                key={boat.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="relative">
                  <img
                    src={boat.imageUrl}
                    alt={boat.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-4 right-4 space-y-1">
                    <span className={`block px-2 py-1 rounded-full text-xs font-medium ${
                      boat.status === 'active' ? 'bg-green-100 text-green-800' :
                      boat.status === 'coming-soon' ? 'bg-blue-100 text-blue-800' :
                      boat.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {boat.status === 'active' ? '✅ Aktif' :
                       boat.status === 'coming-soon' ? '🔜 Yakında' :
                       boat.status === 'maintenance' ? '🔧 Bakım' :
                       '❌ Pasif'}
                    </span>
                    {boat.statusMessage && boat.status !== 'active' && (
                      <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs text-gray-700 max-w-32 text-center">
                        {boat.statusMessage}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{boat.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{boat.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Kapasite:</span>
                      <span className="font-medium">{boat.capacity} kişi</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Oturma Düzeni:</span>
                      <span className="font-medium">
                        {boat.seatingLayout === 'single' ? '🪑 Tekli' : '🪑🪑 Çiftli'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Oluşturulma:</span>
                      <span className="font-medium">
                        {new Date(boat.createdAt).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(boat)}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm"
                      >
                        ✏️ Düzenle
                      </button>
                      <button
                        onClick={() => handleDeleteBoat(boat)}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm"
                      >
                        🗑️ Sil
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setDateRangeModal(boat)}
                        className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                          boat.dateRange?.enabled 
                            ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                        }`}
                      >
                        📅 Tarih {boat.dateRange?.enabled ? '(✓)' : ''}
                      </button>
                      
                      <button
                        onClick={() => setScheduleModal(boat)}
                        className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                          boat.customSchedule?.enabled 
                            ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                        }`}
                      >
                        🕰️ Saatler {boat.customSchedule?.enabled ? '(✓)' : ''}
                      </button>
                    </div>
                    
                    {/* Aktif ayarları gösterimi */}
                    <div className="space-y-2">
                      {boat.dateRange?.enabled && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 text-xs">
                          <p className="text-orange-700 font-medium">📅 Aktif Tarih Aralığı:</p>
                          <p className="text-orange-600">
                            {new Date(boat.dateRange.startDate).toLocaleDateString('tr-TR')} - {new Date(boat.dateRange.endDate).toLocaleDateString('tr-TR')}
                          </p>
                          {boat.dateRange.note && (
                            <p className="text-orange-600 mt-1">
                              💬 {boat.dateRange.note}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {boat.customSchedule?.enabled && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-xs">
                          <p className="text-blue-700 font-medium">🕰️ Özel Çalışma Saatleri:</p>
                          <div className="text-blue-600 space-y-1 mt-1">
                            {boat.customSchedule.timeSlots?.filter(slot => slot.isActive).map((slot, index) => (
                              <p key={slot.id}>
                                • {slot.start} - {slot.end}
                              </p>
                            ))}
                          </div>
                          {boat.customSchedule.note && (
                            <p className="text-blue-600 mt-1">
                              💬 {boat.customSchedule.note}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Date Range Modal */}
      {dateRangeModal && (
        <DateRangeModal
          boat={dateRangeModal}
          onClose={() => setDateRangeModal(null)}
          onSave={handleSaveDateRange}
        />
      )}
      
      {/* Schedule Modal */}
      {scheduleModal && (
        <ScheduleModal
          boat={scheduleModal}
          onClose={() => setScheduleModal(null)}
          onSave={handleSaveSchedule}
        />
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingBoat) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingBoat ? '✏️ Tekne Düzenle' : '+ Yeni Tekne Ekle'}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Tekne Adı */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tekne Adı *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="Örn: 1. Tekne"
                  />
                </div>

                {/* Açıklama */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Açıklama
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="Tekne hakkında kısa açıklama..."
                  />
                </div>

                {/* Kapasite */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kapasite (Kişi)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 12 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>

                {/* Oturma Düzeni */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Oturma Düzeni
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="seatingLayout"
                        value="single"
                        checked={formData.seatingLayout === 'single'}
                        onChange={(e) => setFormData({ ...formData, seatingLayout: e.target.value as 'single' | 'double' })}
                        className="mr-2"
                      />
                      <span>🪑 Tekli Koltuklar (1. Tekne Tarzı)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="seatingLayout"
                        value="double"
                        checked={formData.seatingLayout === 'double'}
                        onChange={(e) => setFormData({ ...formData, seatingLayout: e.target.value as 'single' | 'double' })}
                        className="mr-2"
                      />
                      <span>🪑🪑 Çiftli Koltuklar (2. Tekne Tarzı)</span>
                    </label>
                  </div>
                </div>

                {/* Fotoğraf */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tekne Fotoğrafı {!editingBoat && '*'}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFormData({ ...formData, imageFile: e.target.files?.[0] || null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                  {editingBoat && (
                    <p className="text-xs text-gray-500 mt-1">
                      Yeni fotoğraf seçmezseniz mevcut fotoğraf korunur
                    </p>
                  )}
                </div>

                {/* Tekne Durumu */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tekne Durumu
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="status"
                        value="active"
                        checked={formData.status === 'active'}
                        onChange={(e) => {
                          setFormData({ 
                            ...formData, 
                            status: e.target.value as 'active' | 'inactive' | 'coming-soon' | 'maintenance',
                            isActive: true 
                          });
                        }}
                        className="mr-2"
                      />
                      <span>✅ Aktif - Normal rezervasyon alır</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="status"
                        value="coming-soon"
                        checked={formData.status === 'coming-soon'}
                        onChange={(e) => {
                          setFormData({ 
                            ...formData, 
                            status: e.target.value as 'active' | 'inactive' | 'coming-soon' | 'maintenance',
                            isActive: false 
                          });
                        }}
                        className="mr-2"
                      />
                      <span>🔜 Yakında - Özel mesaj gösterir</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="status"
                        value="maintenance"
                        checked={formData.status === 'maintenance'}
                        onChange={(e) => {
                          setFormData({ 
                            ...formData, 
                            status: e.target.value as 'active' | 'inactive' | 'coming-soon' | 'maintenance',
                            isActive: false 
                          });
                        }}
                        className="mr-2"
                      />
                      <span>🔧 Bakımda - Geçici olarak pasif</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="status"
                        value="inactive"
                        checked={formData.status === 'inactive'}
                        onChange={(e) => {
                          setFormData({ 
                            ...formData, 
                            status: e.target.value as 'active' | 'inactive' | 'coming-soon' | 'maintenance',
                            isActive: false 
                          });
                        }}
                        className="mr-2"
                      />
                      <span>❌ Pasif - Rezervasyon almaz</span>
                    </label>
                  </div>
                </div>

                {/* Durum Mesajı (sadece aktif değilse) */}
                {formData.status !== 'active' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Durum Mesajı (Opsiyonel)
                    </label>
                    <input
                      type="text"
                      value={formData.statusMessage}
                      onChange={(e) => setFormData({ ...formData, statusMessage: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      placeholder="Özel durum mesajınızı yazın..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Bu mesaj müşterilere gösterilecek
                    </p>
                  </div>
                )}
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={closeModal}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={editingBoat ? handleUpdateBoat : handleAddBoat}
                  disabled={uploading}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  {uploading ? 'Kaydediliyor...' : editingBoat ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
