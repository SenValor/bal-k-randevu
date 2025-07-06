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

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    siteName: 'Balık Sefası',
    contactPhone: '+90 555 123 4567',
    contactEmail: 'info@balikserafasi.com',
    workingHours: '07:00 - 20:00',
    maxCapacity: 12,
    priceUpdateDate: '',
    maintenanceMode: false,
    bookingEnabled: true
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

  // Ayarları dinle
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'settings'),
      (snapshot) => {
        const settingsDoc = snapshot.docs.find(doc => doc.id === 'general');
        if (settingsDoc) {
          const data = settingsDoc.data();
          setSettings(data);
        }
        
        const pricesDoc = snapshot.docs.find(doc => doc.id === 'prices');
        if (pricesDoc) {
          const data = pricesDoc.data();
          setPrices(data);
        }
        
        const timesDoc = snapshot.docs.find(doc => doc.id === 'availableTimes');
        if (timesDoc) {
          const data = timesDoc.data();
          setAvailableTimes(data.times || ['07:00-13:00', '14:00-20:00']);
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
        </div>
      </main>
    </div>
  );
} 