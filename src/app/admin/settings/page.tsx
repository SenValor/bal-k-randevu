'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';

interface Settings {
  siteName: string;
  contactPhone: string;
  contactEmail: string;
  workingHours: string;
  maxCapacity: number;
  priceUpdateDate: string;
  maintenanceMode: boolean;
  bookingEnabled: boolean;
  whatsappNumber: string;
}

interface Prices {
  normalOwn: number;
  normalWithEquipment: number;
  privateTour: number;
  fishingSwimming: number;
}

interface AvailableTimes {
  times: string[];
  updatedAt: Date;
  updatedBy: string;
}

interface CustomTour {
  id: string;
  name: string;
  price: number;
  capacity: number;
  duration: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    siteName: 'Balık Sefası',
    contactPhone: '+90 555 123 4567',
    contactEmail: 'info@balikserafasi.com',
    workingHours: '07:00 - 20:00',
    maxCapacity: 12,
    priceUpdateDate: '',
    maintenanceMode: false,
    bookingEnabled: true,
    whatsappNumber: '+90 531 089 25 37'
  });
  
  const [prices, setPrices] = useState<Prices>({
    normalOwn: 850,
    normalWithEquipment: 1000,
    privateTour: 12000,
    fishingSwimming: 15000
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingPrices, setEditingPrices] = useState(false);
  const [availableTimes, setAvailableTimes] = useState<string[]>(['07:00-13:00', '14:00-20:00']);
  const [editingTimes, setEditingTimes] = useState(false);
  const [newTimeSlot, setNewTimeSlot] = useState({ start: '', end: '' });
  const [customTours, setCustomTours] = useState<CustomTour[]>([]);
  const [editingTours, setEditingTours] = useState(false);
  const [newTour, setNewTour] = useState({
    name: '',
    price: 0,
    capacity: 12,
    duration: '6 saat',
    description: '',
    isActive: true
  });

  // Ayarları dinle
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'settings'),
      (snapshot) => {
        const settingsDoc = snapshot.docs.find(doc => doc.id === 'general');
        if (settingsDoc) {
          const data = settingsDoc.data();
          setSettings({
            siteName: data.siteName || 'Balık Sefası',
            contactPhone: data.contactPhone || '+90 555 123 4567',
            contactEmail: data.contactEmail || 'info@balikserafasi.com',
            workingHours: data.workingHours || '07:00 - 20:00',
            maxCapacity: data.maxCapacity || 12,
            priceUpdateDate: data.priceUpdateDate || '',
            maintenanceMode: data.maintenanceMode || false,
            bookingEnabled: data.bookingEnabled ?? true,
            whatsappNumber: data.whatsappNumber || '+90 531 089 25 37'
          });
        }
        
        const pricesDoc = snapshot.docs.find(doc => doc.id === 'prices');
        if (pricesDoc) {
          const data = pricesDoc.data();
          setPrices({
            normalOwn: data.normalOwn || 850,
            normalWithEquipment: data.normalWithEquipment || 1000,
            privateTour: data.privateTour || 12000,
            fishingSwimming: data.fishingSwimming || 15000
          });
        }
        
        const timesDoc = snapshot.docs.find(doc => doc.id === 'availableTimes');
        if (timesDoc) {
          const data = timesDoc.data();
          setAvailableTimes(data.times || ['07:00-13:00', '14:00-20:00']);
        }
        
        const toursDoc = snapshot.docs.find(doc => doc.id === 'customTours');
        if (toursDoc) {
          const data = toursDoc.data();
          setCustomTours(data.tours || []);
        }
        
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'general'), {
        ...settings,
        updatedAt: new Date()
      });
      alert('Ayarlar kaydedildi!');
    } catch (error: any) {
      console.error('Ayar kaydetme hatası:', error);
      alert('Ayarlar kaydedilirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const savePrices = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'prices'), {
        ...prices,
        updatedAt: new Date()
      });
      setEditingPrices(false);
      alert('Fiyatlar kaydedildi!');
    } catch (error: any) {
      console.error('Fiyat kaydetme hatası:', error);
      alert('Fiyatlar kaydedilirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Saat yönetimi fonksiyonları
  const addTimeSlot = () => {
    if (newTimeSlot.start && newTimeSlot.end) {
      // Saat validasyonu
      if (newTimeSlot.start >= newTimeSlot.end) {
        alert('Başlangıç saati bitiş saatinden küçük olmalıdır!');
        return;
      }
      
      const timeSlot = `${newTimeSlot.start}-${newTimeSlot.end}`;
      if (!availableTimes.includes(timeSlot)) {
        const newTimes = [...availableTimes, timeSlot].sort();
        setAvailableTimes(newTimes);
        setNewTimeSlot({ start: '', end: '' });
      } else {
        alert('Bu saat dilimi zaten mevcut!');
      }
    } else {
      alert('Başlangıç ve bitiş saatlerini giriniz!');
    }
  };

  const removeTimeSlot = (timeSlot: string) => {
    if (availableTimes.length <= 1) {
      alert('En az 1 saat dilimi bulunmalıdır!');
      return;
    }
    setAvailableTimes(availableTimes.filter(t => t !== timeSlot));
  };

  const saveTimes = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'availableTimes'), {
        times: availableTimes,
        updatedAt: new Date(),
        updatedBy: 'admin'
      });
      setEditingTimes(false);
      alert('Randevu saatleri kaydedildi!');
    } catch (error: any) {
      console.error('Saat kaydetme hatası:', error);
      alert('Saatler kaydedilirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  // Özel tur yönetimi fonksiyonları
  const addCustomTour = () => {
    if (!newTour.name.trim() || newTour.price <= 0) {
      alert('Lütfen tur adı ve geçerli bir fiyat girin!');
      return;
    }

    const tourToAdd: CustomTour = {
      id: Date.now().toString(),
      name: newTour.name.trim(),
      price: newTour.price,
      capacity: newTour.capacity,
      duration: newTour.duration,
      description: newTour.description.trim(),
      isActive: newTour.isActive,
      createdAt: new Date()
    };

    setCustomTours([...customTours, tourToAdd]);
    setNewTour({
      name: '',
      price: 0,
      capacity: 12,
      duration: '6 saat',
      description: '',
      isActive: true
    });
    
    // Otomatik kaydet
    setTimeout(saveCustomTours, 500);
  };

  const toggleTourStatus = (tourId: string) => {
    const updatedTours = customTours.map(tour =>
      tour.id === tourId ? { ...tour, isActive: !tour.isActive } : tour
    );
    setCustomTours(updatedTours);
    
    // Otomatik kaydet
    setTimeout(saveCustomTours, 500);
  };

  const removeTour = (tourId: string) => {
    if (!confirm('Bu özel turu silmek istediğinize emin misiniz?')) return;
    
    setCustomTours(customTours.filter(tour => tour.id !== tourId));
    
    // Otomatik kaydet
    setTimeout(saveCustomTours, 500);
  };

  const saveCustomTours = async () => {
    try {
      await setDoc(doc(db, 'settings', 'customTours'), {
        tours: customTours,
        updatedAt: new Date(),
        updatedBy: 'admin'
      });
      console.log('Özel turlar kaydedildi');
    } catch (error: any) {
      console.error('Özel tur kaydetme hatası:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Ayarlar yükleniyor...</p>
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
                ← Dashboard
              </Link>
              <h1 className="text-xl font-bold text-gray-900">⚙️ Sistem Ayarları</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Genel Bilgiler */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">🏢 Genel Bilgiler</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Site Adı
                </label>
                                 <input
                   type="text"
                   value={settings.siteName}
                   onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                 />
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   İletişim Telefonu
                 </label>
                 <input
                   type="tel"
                   value={settings.contactPhone}
                   onChange={(e) => setSettings({...settings, contactPhone: e.target.value})}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                 />
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   WhatsApp Numarası
                 </label>
                 <input
                   type="tel"
                   value={settings.whatsappNumber}
                   onChange={(e) => setSettings({...settings, whatsappNumber: e.target.value})}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                   placeholder="+90 531 089 25 37"
                 />
                 <p className="text-xs text-gray-500 mt-1">
                   Rezervasyon onay mesajları bu numaradan gönderilecek
                 </p>
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   İletişim E-posta
                 </label>
                 <input
                   type="email"
                   value={settings.contactEmail}
                   onChange={(e) => setSettings({...settings, contactEmail: e.target.value})}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                 />
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Çalışma Saatleri
                 </label>
                 <input
                   type="text"
                   value={settings.workingHours}
                   onChange={(e) => setSettings({...settings, workingHours: e.target.value})}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                 />
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Maksimum Kapasite
                 </label>
                 <input
                   type="number"
                   value={settings.maxCapacity}
                   onChange={(e) => setSettings({...settings, maxCapacity: parseInt(e.target.value)})}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                 />
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Fiyat Güncelleme Tarihi
                 </label>
                 <input
                   type="date"
                   value={settings.priceUpdateDate}
                   onChange={(e) => setSettings({...settings, priceUpdateDate: e.target.value})}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                 />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={saveSettings}
                disabled={saving}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>

          {/* Sistem Ayarları */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">🔧 Sistem Ayarları</h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Bakım Modu</h3>
                  <p className="text-sm text-gray-600">
                    Açık olduğunda site bakım modunda görünür
                  </p>
                </div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})}
                    className="sr-only"
                  />
                  <div className={`relative w-11 h-6 rounded-full transition-colors ${
                    settings.maintenanceMode ? 'bg-blue-500' : 'bg-gray-300'
                  }`}>
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.maintenanceMode ? 'translate-x-5' : 'translate-x-0'
                    }`}></div>
                  </div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Rezervasyon Sistemi</h3>
                  <p className="text-sm text-gray-600">
                    Rezervasyon formunu açar/kapatır
                  </p>
                </div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.bookingEnabled}
                    onChange={(e) => setSettings({...settings, bookingEnabled: e.target.checked})}
                    className="sr-only"
                  />
                  <div className={`relative w-11 h-6 rounded-full transition-colors ${
                    settings.bookingEnabled ? 'bg-blue-500' : 'bg-gray-300'
                  }`}>
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.bookingEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}></div>
                  </div>
                </label>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={saveSettings}
                disabled={saving}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>

          {/* Fiyat Yönetimi */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">💰 Fiyat Yönetimi</h2>
              <button
                onClick={() => setEditingPrices(!editingPrices)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {editingPrices ? 'İptal' : 'Düzenle'}
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Normal Tur (Kendi Malzemesi)</h3>
                {editingPrices ? (
                                     <input
                     type="number"
                     value={prices.normalOwn}
                     onChange={(e) => setPrices({...prices, normalOwn: parseInt(e.target.value)})}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                   />
                 ) : (
                   <p className="text-2xl font-bold text-blue-600">
                     {formatPrice(prices.normalOwn)}
                   </p>
                 )}
               </div>
               
               <div className="p-4 bg-green-50 rounded-lg">
                 <h3 className="font-medium text-gray-900 mb-2">Normal Tur (Malzeme Dahil)</h3>
                 {editingPrices ? (
                   <input
                     type="number"
                     value={prices.normalWithEquipment}
                     onChange={(e) => setPrices({...prices, normalWithEquipment: parseInt(e.target.value)})}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                   />
                 ) : (
                   <p className="text-2xl font-bold text-green-600">
                     {formatPrice(prices.normalWithEquipment)}
                   </p>
                 )}
               </div>
               
               <div className="p-4 bg-purple-50 rounded-lg">
                 <h3 className="font-medium text-gray-900 mb-2">Özel Tur</h3>
                 {editingPrices ? (
                   <input
                     type="number"
                     value={prices.privateTour}
                     onChange={(e) => setPrices({...prices, privateTour: parseInt(e.target.value)})}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                   />
                 ) : (
                   <p className="text-2xl font-bold text-purple-600">
                     {formatPrice(prices.privateTour)}
                   </p>
                 )}
               </div>
               
               <div className="p-4 bg-orange-50 rounded-lg">
                 <h3 className="font-medium text-gray-900 mb-2">Balık Tutma & Yüzme</h3>
                 {editingPrices ? (
                   <input
                     type="number"
                     value={prices.fishingSwimming}
                     onChange={(e) => setPrices({...prices, fishingSwimming: parseInt(e.target.value)})}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                   />
                ) : (
                  <p className="text-2xl font-bold text-orange-600">
                    {formatPrice(prices.fishingSwimming)}
                  </p>
                )}
              </div>
            </div>
            
            {editingPrices && (
              <div className="mt-6 flex justify-end space-x-2">
                <button
                  onClick={() => setEditingPrices(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={savePrices}
                  disabled={saving}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  {saving ? 'Kaydediliyor...' : 'Fiyatları Kaydet'}
                </button>
              </div>
            )}
          </div>

          {/* Randevu Saatleri Yönetimi */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">🕐 Randevu Saatleri</h2>
              <button
                onClick={() => setEditingTimes(!editingTimes)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {editingTimes ? 'İptal' : 'Düzenle'}
              </button>
            </div>

            <div className="space-y-4">
              {/* Mevcut Saatler */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">📋 Mevcut Randevu Saatleri</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {availableTimes.map((timeSlot, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="font-medium text-blue-700">{timeSlot}</span>
                      {editingTimes && (
                        <button
                          onClick={() => removeTimeSlot(timeSlot)}
                          className="text-red-500 hover:text-red-700 ml-2"
                        >
                          ❌
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Yeni Saat Ekleme */}
              {editingTimes && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">➕ Yeni Saat Dilimi Ekle</h3>
                  <div className="flex items-center space-x-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Başlangıç Saati
                      </label>
                      <input
                        type="time"
                        value={newTimeSlot.start}
                        onChange={(e) => setNewTimeSlot({...newTimeSlot, start: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bitiş Saati
                      </label>
                      <input
                        type="time"
                        value={newTimeSlot.end}
                        onChange={(e) => setNewTimeSlot({...newTimeSlot, end: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      />
                    </div>
                    <div className="pt-6">
                      <button
                        onClick={addTimeSlot}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        ➕ Ekle
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Kaydet Butonu */}
              {editingTimes && (
                <div className="border-t pt-4">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setEditingTimes(false)}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                      İptal
                    </button>
                    <button
                      onClick={saveTimes}
                      disabled={saving}
                      className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                      {saving ? 'Kaydediliyor...' : 'Saatleri Kaydet'}
                    </button>
                  </div>
                </div>
              )}

              {/* Bilgi Notu */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <span className="text-yellow-600 mr-2">💡</span>
                  <div>
                    <h4 className="font-medium text-yellow-800 mb-1">Bilgi:</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• Randevu saatleri saat dilimi olarak belirlenir (örn: 07:00-13:00)</li>
                      <li>• Müşteriler bu saat dilimlerinden birini seçebilir</li>
                      <li>• Değişiklikler anında aktif olur</li>
                      <li>• En az 1 saat dilimi bulunmalıdır</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Özel Tur Yönetimi */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">🎣 Özel Tur Yönetimi</h2>
              <button
                onClick={() => setEditingTours(!editingTours)}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {editingTours ? 'İptal' : 'Tur Ekle'}
              </button>
            </div>

            <div className="space-y-4">
              {/* Mevcut Özel Turlar */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">📋 Mevcut Özel Turlar</h3>
                {customTours.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <div className="text-4xl mb-2">🎣</div>
                    <p className="text-gray-600">Henüz özel tur eklenmemiş</p>
                    <p className="text-sm text-gray-500">Palamut Turu gibi özel turları buradan yönetebilirsiniz</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customTours.map((tour) => (
                      <div key={tour.id} className={`p-4 rounded-lg border-2 ${tour.isActive ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900">{tour.name}</h4>
                            <p className="text-sm text-gray-600 mb-2">{tour.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-700">
                              <span>💰 {formatPrice(tour.price)}</span>
                              <span>👥 {tour.capacity} kişi</span>
                              <span>⏱️ {tour.duration}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={tour.isActive}
                                onChange={() => toggleTourStatus(tour.id)}
                                className="sr-only"
                              />
                              <div className={`relative w-10 h-6 rounded-full transition-colors ${tour.isActive ? 'bg-green-500' : 'bg-gray-300'}`}>
                                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${tour.isActive ? 'translate-x-4' : 'translate-x-0'}`}></div>
                              </div>
                            </label>
                            <button
                              onClick={() => removeTour(tour.id)}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Sil"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${tour.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {tour.isActive ? '✅ Aktif' : '❌ Pasif'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(tour.createdAt).toLocaleDateString('tr-TR')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Yeni Tur Ekleme Formu */}
              {editingTours && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">➕ Yeni Özel Tur Ekle</h3>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tur Adı *
                        </label>
                        <input
                          type="text"
                          value={newTour.name}
                          onChange={(e) => setNewTour({...newTour, name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                          placeholder="Örn: Palamut Turu"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Fiyat (TL) *
                        </label>
                        <input
                          type="number"
                          value={newTour.price}
                          onChange={(e) => setNewTour({...newTour, price: parseInt(e.target.value) || 0})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                          placeholder="0"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Kapasite (Kişi)
                        </label>
                        <input
                          type="number"
                          value={newTour.capacity}
                          onChange={(e) => setNewTour({...newTour, capacity: parseInt(e.target.value) || 12})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                          placeholder="12"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Süre
                        </label>
                        <select
                          value={newTour.duration}
                          onChange={(e) => setNewTour({...newTour, duration: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                        >
                          <option value="4 saat">4 saat</option>
                          <option value="6 saat">6 saat</option>
                          <option value="8 saat">8 saat</option>
                          <option value="Gün boyu">Gün boyu</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Açıklama
                      </label>
                      <textarea
                        value={newTour.description}
                        onChange={(e) => setNewTour({...newTour, description: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                        rows={3}
                        placeholder="Bu özel turun detaylarını açıklayın..."
                      />
                    </div>
                    
                    <div className="flex items-center mt-4">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newTour.isActive}
                          onChange={(e) => setNewTour({...newTour, isActive: e.target.checked})}
                          className="sr-only"
                        />
                        <div className={`relative w-10 h-6 rounded-full transition-colors ${newTour.isActive ? 'bg-green-500' : 'bg-gray-300'}`}>
                          <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${newTour.isActive ? 'translate-x-4' : 'translate-x-0'}`}></div>
                        </div>
                        <span className="ml-3 text-sm font-medium text-gray-700">
                          {newTour.isActive ? 'Aktif' : 'Pasif'}
                        </span>
                      </label>
                    </div>
                    
                    <div className="flex justify-end space-x-2 mt-6">
                      <button
                        onClick={() => setEditingTours(false)}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        İptal
                      </button>
                      <button
                        onClick={addCustomTour}
                        className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        ➕ Tur Ekle
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Bilgi Notu */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <span className="text-blue-600 mr-2">💡</span>
                  <div>
                    <h4 className="font-medium text-blue-800 mb-1">Özel Tur Yönetimi Hakkında:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Palamut Turu gibi mevsimlik özel turları buradan yönetebilirsiniz</li>
                      <li>• Aktif/Pasif durumu ile turların rezervasyon sayfasında görünürlüğünü kontrol edebilirsiniz</li>
                      <li>• Her turun kendine özel fiyat, kapasite ve süre ayarları vardır</li>
                      <li>• Değişiklikler anında rezervasyon sistemine yansır</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 