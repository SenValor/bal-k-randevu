'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, setDoc, getDoc } from 'firebase/firestore';

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

// Ay bazlı fiyat yapısı
interface MonthlyPrice {
  month: number; // 1-12 (Ocak-Aralık)
  year: number;
  price: number;
  isActive: boolean;
}

interface TourType {
  id: string;
  name: string;
  price: number; // Varsayılan fiyat
  description: string;
  isActive: boolean;
  isSystem: boolean; // Sistem turları (silinemez)
  color: string; // UI rengi
  // Ay bazlı fiyatlandırma
  monthlyPricing?: {
    enabled: boolean;
    prices: MonthlyPrice[];
  };
}

interface AvailableTimes {
  times: string[];
  updatedAt: Date;
  updatedBy: string;
}

interface TimeSlot {
  id: string;
  start: string;
  end: string;
  isActive: boolean;
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
  // Çalışma saatleri
  customSchedule?: {
    enabled: boolean;
    timeSlots: TimeSlot[];
    note?: string;
  };
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
  
  // Dinamik tur tipleri yönetimi
  const [tourTypes, setTourTypes] = useState<TourType[]>([
    { id: 'normalOwn', name: 'Normal Tur (Kendi Malzemesi)', price: 850, description: 'Kendi oltanızla katılım', isActive: true, isSystem: true, color: 'blue' },
    { id: 'normalWithEquipment', name: 'Normal Tur (Malzeme Dahil)', price: 1000, description: 'Olta ve takım dahil', isActive: true, isSystem: true, color: 'green' },
    { id: 'privateTour', name: 'Özel Tur', price: 12000, description: 'Tüm tekne kiralama', isActive: true, isSystem: true, color: 'purple' },
    { id: 'fishingSwimming', name: 'Balık Tutma & Yüzme', price: 15000, description: '6 saat balık + yüzme', isActive: true, isSystem: true, color: 'orange' }
  ]);
  const [editingTourTypes, setEditingTourTypes] = useState(false);
  const [newTourType, setNewTourType] = useState({
    name: '',
    price: 0,
    description: '',
    isActive: true,
    color: 'indigo'
  });

  // Ay bazlı fiyat yönetimi
  const [editingMonthlyPrices, setEditingMonthlyPrices] = useState<string | null>(null); // Hangi tur için ay bazlı fiyat düzenleniyor
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Ay isimleri
  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

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

    // Tur tiplerini yükle ve ilk kurulum kontrolü yap
    loadTourTypes().then(() => {
      // Eğer tourTypes boşsa, ilk kurulum için varsayılan turları kaydet
      setTimeout(() => {
        if (tourTypes.length === 0) {
          console.log('🔧 İlk kurulum: Varsayılan tur tipleri kaydediliyor...');
          saveTourTypes();
        }
      }, 1000);
    });

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
      // Saat validasyonu - Gece seansları için özel kontrol (örn. 19:00-01:00)
      const isNightSession = newTimeSlot.start > newTimeSlot.end;
      if (!isNightSession && newTimeSlot.start >= newTimeSlot.end) {
        alert('Başlangıç saati bitiş saatinden küçük olmalıdır! Gece seansları için (örn. 19:00-01:00) bu kural geçerli değildir.');
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

  // Tur tipi yönetimi fonksiyonları
  const loadTourTypes = async () => {
    try {
      const tourTypesDoc = await getDoc(doc(db, 'settings', 'tourTypes'));
      if (tourTypesDoc.exists()) {
        const data = tourTypesDoc.data();
        if (data.types && Array.isArray(data.types)) {
          setTourTypes(data.types);
        }
      }
    } catch (error) {
      console.error('Tur tipleri yüklenemedi:', error);
    }
  };

  const saveTourTypes = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'tourTypes'), {
        types: tourTypes,
        updatedAt: new Date(),
        updatedBy: 'admin'
      });
      
      // Eski prices formatını da güncelle (geriye uyumluluk için)
      const systemTours = tourTypes.filter(t => t.isSystem);
      const updatedPrices = {
        normalOwn: systemTours.find(t => t.id === 'normalOwn')?.price || 850,
        normalWithEquipment: systemTours.find(t => t.id === 'normalWithEquipment')?.price || 1000,
        privateTour: systemTours.find(t => t.id === 'privateTour')?.price || 12000,
        fishingSwimming: systemTours.find(t => t.id === 'fishingSwimming')?.price || 15000
      };
      
      await setDoc(doc(db, 'settings', 'prices'), updatedPrices);
      setPrices(updatedPrices);
      
      setEditingTourTypes(false);
      alert('Tur tipleri başarıyla kaydedildi!');
    } catch (error) {
      console.error('Tur tipleri kaydedilemedi:', error);
      alert('Tur tipleri kaydedilirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const addTourType = () => {
    if (!newTourType.name.trim() || newTourType.price <= 0) {
      alert('Lütfen tur adı ve geçerli bir fiyat girin!');
      return;
    }

    const tourType: TourType = {
      id: `custom_${Date.now()}`,
      name: newTourType.name.trim(),
      price: newTourType.price,
      description: newTourType.description.trim(),
      isActive: newTourType.isActive,
      isSystem: false,
      color: newTourType.color
    };

    setTourTypes([...tourTypes, tourType]);
    setNewTourType({
      name: '',
      price: 0,
      description: '',
      isActive: true,
      color: 'indigo'
    });
  };

  const updateTourType = async (id: string, updates: Partial<TourType>) => {
    const updatedTourTypes = tourTypes.map(tour => 
      tour.id === id ? { ...tour, ...updates } : tour
    );
    setTourTypes(updatedTourTypes);
    
    // Otomatik kaydet
    try {
      await setDoc(doc(db, 'settings', 'tourTypes'), {
        types: updatedTourTypes,
        updatedAt: new Date(),
        updatedBy: 'admin'
      });
      
      // Eski prices formatını da güncelle (geriye uyumluluk için)
      const systemTours = updatedTourTypes.filter(t => t.isSystem);
      const updatedPrices = {
        normalOwn: systemTours.find(t => t.id === 'normalOwn')?.price || 850,
        normalWithEquipment: systemTours.find(t => t.id === 'normalWithEquipment')?.price || 1000,
        privateTour: systemTours.find(t => t.id === 'privateTour')?.price || 12000,
        fishingSwimming: systemTours.find(t => t.id === 'fishingSwimming')?.price || 15000
      };
      
      await setDoc(doc(db, 'settings', 'prices'), updatedPrices);
      setPrices(updatedPrices);
      
      console.log('✅ Tur tipi otomatik kaydedildi:', id, updates);
    } catch (error) {
      console.error('❌ Tur tipi kaydetme hatası:', error);
      alert('Tur tipi kaydedilirken hata oluştu');
      // Hata durumunda state'i geri al
      setTourTypes(tourTypes);
    }
  };

  const removeTourType = async (id: string) => {
    const tour = tourTypes.find(t => t.id === id);
    if (tour?.isSystem) {
      alert('Sistem turları silinemez!');
      return;
    }
    
    if (confirm(`"${tour?.name}" turunu silmek istediğinizden emin misiniz?`)) {
      const updatedTourTypes = tourTypes.filter(t => t.id !== id);
      setTourTypes(updatedTourTypes);
      
      // Otomatik kaydet
      try {
        await setDoc(doc(db, 'settings', 'tourTypes'), {
          types: updatedTourTypes,
          updatedAt: new Date(),
          updatedBy: 'admin'
        });
        
        console.log('✅ Tur tipi silindi ve kaydedildi:', id);
        alert(`"${tour?.name}" turu başarıyla silindi!`);
      } catch (error) {
        console.error('❌ Tur tipi silme hatası:', error);
        alert('Tur tipi silinirken hata oluştu');
        // Hata durumunda state'i geri al
        setTourTypes(tourTypes);
      }
    }
  };

  // Özel tur yönetimi fonksiyonları
  const addCustomTour = async () => {
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

    const updatedTours = [...customTours, tourToAdd];
    setCustomTours(updatedTours);
    
    // Hemen kaydet - güncellenen veriyi doğrudan kullan
    try {
      await setDoc(doc(db, 'settings', 'customTours'), {
        tours: updatedTours,
        updatedAt: new Date(),
        updatedBy: 'admin'
      });
      
      alert('Özel tur başarıyla eklendi!');
      console.log('Özel tur eklendi:', tourToAdd);
      
      setNewTour({
        name: '',
        price: 0,
        capacity: 12,
        duration: '6 saat',
        description: '',
        isActive: true
      });
    } catch (error: any) {
      console.error('Özel tur kaydetme hatası:', error);
      alert('Özel tur kaydedilirken hata oluştu');
      // Hata durumunda state'i geri al
      setCustomTours(customTours);
    }
  };

  const toggleTourStatus = async (tourId: string) => {
    const updatedTours = customTours.map(tour =>
      tour.id === tourId ? { ...tour, isActive: !tour.isActive } : tour
    );
    setCustomTours(updatedTours);
    
    // Hemen kaydet
    try {
      await setDoc(doc(db, 'settings', 'customTours'), {
        tours: updatedTours,
        updatedAt: new Date(),
        updatedBy: 'admin'
      });
      
      const tour = updatedTours.find(t => t.id === tourId);
      alert(`"${tour?.name}" ${tour?.isActive ? 'aktif hale getirildi' : 'pasif hale getirildi'}!`);
    } catch (error: any) {
      console.error('Özel tur durumu güncellenemedi:', error);
      alert('Tur durumu güncellenirken hata oluştu');
      // Hata durumunda state'i geri al
      setCustomTours(customTours);
    }
  };

  const removeTour = async (tourId: string) => {
    if (!confirm('Bu özel turu silmek istediğinize emin misiniz?')) return;
    
    const tourToRemove = customTours.find(tour => tour.id === tourId);
    const updatedTours = customTours.filter(tour => tour.id !== tourId);
    setCustomTours(updatedTours);
    
    // Hemen kaydet
    try {
      await setDoc(doc(db, 'settings', 'customTours'), {
        tours: updatedTours,
        updatedAt: new Date(),
        updatedBy: 'admin'
      });
      
      alert(`"${tourToRemove?.name}" özel turu silindi!`);
    } catch (error: any) {
      console.error('Özel tur silinemedi:', error);
      alert('Tur silinirken hata oluştu');
      // Hata durumunda state'i geri al
      setCustomTours(customTours);
    }
  };
  
  // Özel tur çalışma saatleri kaydetme
  const handleSaveTourSchedule = async (tourId: string, schedule: CustomTour['customSchedule']) => {
    try {
      const updatedTours = customTours.map(tour => 
        tour.id === tourId ? { ...tour, customSchedule: schedule } : tour
      );
      
      await setDoc(doc(db, 'settings', 'customTours'), {
        tours: updatedTours,
        updatedAt: new Date(),
        updatedBy: 'admin'
      });
      
      setCustomTours(updatedTours);
      alert('Özel tur başarıyla güncellendi!');
    } catch (error) {
      console.error('Özel tur güncellenirken hata:', error);
      alert('Özel tur güncellenirken hata oluştu');
    }
  };

  // Ay bazlı fiyat yönetimi fonksiyonları
  const toggleMonthlyPricing = async (tourId: string) => {
    const updatedTourTypes = tourTypes.map(tour => {
      if (tour.id === tourId) {
        const monthlyPricing = tour.monthlyPricing || { enabled: false, prices: [] };
        return {
          ...tour,
          monthlyPricing: {
            ...monthlyPricing,
            enabled: !monthlyPricing.enabled
          }
        };
      }
      return tour;
    });
    setTourTypes(updatedTourTypes);
    
    // Otomatik kaydet
    try {
      await setDoc(doc(db, 'settings', 'tourTypes'), {
        types: updatedTourTypes,
        updatedAt: new Date(),
        updatedBy: 'admin'
      });
      
      console.log('✅ Ay bazlı fiyat ayarı kaydedildi:', tourId);
    } catch (error) {
      console.error('❌ Ay bazlı fiyat ayarı kaydetme hatası:', error);
      alert('Ay bazlı fiyat ayarı kaydedilirken hata oluştu');
      setTourTypes(tourTypes);
    }
  };

  const updateMonthlyPrice = async (tourId: string, month: number, price: number) => {
    const updatedTourTypes = tourTypes.map(tour => {
      if (tour.id === tourId) {
        const monthlyPricing = tour.monthlyPricing || { enabled: true, prices: [] };
        const existingPriceIndex = monthlyPricing.prices.findIndex(p => p.month === month && p.year === selectedYear);
        
        let updatedPrices = [...monthlyPricing.prices];
        
        // Eğer fiyat 0 veya boş ise, o ayın fiyatını sil
        if (!price || price === 0) {
          if (existingPriceIndex >= 0) {
            updatedPrices.splice(existingPriceIndex, 1);
          }
        } else {
          // Fiyat var ise güncelle veya ekle
          if (existingPriceIndex >= 0) {
            // Mevcut fiyatı güncelle
            updatedPrices[existingPriceIndex] = {
              ...updatedPrices[existingPriceIndex],
              price: price
            };
          } else {
            // Yeni fiyat ekle
            updatedPrices.push({
              month: month,
              year: selectedYear,
              price: price,
              isActive: true
            });
          }
        }
        
        return {
          ...tour,
          monthlyPricing: {
            ...monthlyPricing,
            prices: updatedPrices
          }
        };
      }
      return tour;
    });
    setTourTypes(updatedTourTypes);
    
    // Otomatik kaydet
    try {
      await setDoc(doc(db, 'settings', 'tourTypes'), {
        types: updatedTourTypes,
        updatedAt: new Date(),
        updatedBy: 'admin'
      });
      
      console.log('✅ Aylık fiyat kaydedildi:', tourId, month, price);
    } catch (error) {
      console.error('❌ Aylık fiyat kaydetme hatası:', error);
      alert('Aylık fiyat kaydedilirken hata oluştu');
      setTourTypes(tourTypes);
    }
  };

  const getMonthlyPrice = (tourId: string, month: number): number => {
    const tour = tourTypes.find(t => t.id === tourId);
    if (!tour?.monthlyPricing?.enabled) return tour?.price || 0;
    
    const monthlyPrice = tour.monthlyPricing.prices.find(p => p.month === month && p.year === selectedYear);
    return monthlyPrice?.price || tour.price;
  };

  const getCurrentMonthPrice = (tourId: string): number => {
    const currentMonth = new Date().getMonth() + 1; // 1-12
    return getMonthlyPrice(tourId, currentMonth);
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
        {/* Bakım Modu Uyarısı */}
        {settings.maintenanceMode && (
          <div className="mb-6 bg-orange-100 border-l-4 border-orange-500 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="text-orange-500 text-xl mr-3">🔧</div>
              <div>
                <h3 className="text-orange-800 font-semibold">Bakım Modu Aktif!</h3>
                <p className="text-orange-700 text-sm">
                  Site şu anda ziyaretçiler için kapalı. Sadece admin paneli erişilebilir durumda.
                </p>
              </div>
            </div>
          </div>
        )}
        
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

          {/* Dinamik Tur Tipi Yönetimi */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">💰 Tur Tipi & Fiyat Yönetimi</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setEditingTourTypes(!editingTourTypes)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  {editingTourTypes ? 'İptal' : 'Yeni Tur Ekle'}
                </button>
                <button
                  onClick={saveTourTypes}
                  disabled={saving}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  {saving ? 'Kaydediliyor...' : 'Tur Tiplerini Kaydet'}
                </button>
              </div>
            </div>
            
            {/* Mevcut Tur Tipleri */}
            {tourTypes.length === 0 ? (
              <div className="text-center py-8 bg-yellow-50 border border-yellow-200 rounded-xl mb-6">
                <div className="text-4xl mb-4">⚠️</div>
                <h3 className="text-xl font-bold text-yellow-800 mb-2">İlk Kurulum Gerekli</h3>
                <p className="text-yellow-700 mb-4">
                  Tur tipleri henüz kaydedilmemiş. Sistem turlarını aktif etmek için "Tur Tiplerini Kaydet" butonuna tıklayın.
                </p>
                <p className="text-sm text-yellow-600">
                  Bu işlem Normal Tur, Özel Tur, Balık+Yüzme turlarını müşteri sayfasında görünür hale getirecek.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {tourTypes.map((tour) => {
                const colorClasses = {
                  blue: 'bg-blue-50 border-blue-200 text-blue-800',
                  green: 'bg-green-50 border-green-200 text-green-800',
                  purple: 'bg-purple-50 border-purple-200 text-purple-800',
                  orange: 'bg-orange-50 border-orange-200 text-orange-800',
                  indigo: 'bg-indigo-50 border-indigo-200 text-indigo-800',
                  red: 'bg-red-50 border-red-200 text-red-800',
                  yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800'
                };
                
                return (
                  <div key={tour.id} className={`p-4 rounded-lg border-2 ${colorClasses[tour.color as keyof typeof colorClasses] || colorClasses.blue} ${!tour.isActive ? 'opacity-60' : ''}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-bold text-gray-900">{tour.name}</h3>
                          {tour.isSystem && (
                            <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full">Sistem</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{tour.description}</p>
                        
                        {/* Fiyat Düzenleme */}
                        <div className="mb-2">
                          <input
                            type="number"
                            value={tour.price}
                            onChange={(e) => updateTourType(tour.id, { price: parseInt(e.target.value) || 0 })}
                            className="w-full px-2 py-1 text-lg font-bold border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                          />
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2 ml-2">
                        {/* Aktif/Pasif Toggle */}
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={tour.isActive}
                            onChange={(e) => updateTourType(tour.id, { isActive: e.target.checked })}
                            className="sr-only"
                          />
                          <div className={`relative w-8 h-5 rounded-full transition-colors ${tour.isActive ? 'bg-green-500' : 'bg-gray-300'}`}>
                            <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${tour.isActive ? 'translate-x-3' : 'translate-x-0'}`}></div>
                          </div>
                        </label>
                        
                        {/* Silme Butonu (sadece custom turlar için) */}
                        {!tour.isSystem && (
                          <button
                            onClick={() => removeTourType(tour.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Sil"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Ay Bazlı Fiyat Toggle */}
                    <div className="mb-2">
                      <label className="flex items-center cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={tour.monthlyPricing?.enabled || false}
                          onChange={() => toggleMonthlyPricing(tour.id)}
                          className="mr-2"
                        />
                        <span className="text-gray-600">Ay bazlı fiyat</span>
                      </label>
                    </div>

                    {/* Ay Bazlı Fiyat Butonu */}
                    {tour.monthlyPricing?.enabled && (
                      <div className="mb-2">
                        <button
                          onClick={() => setEditingMonthlyPrices(editingMonthlyPrices === tour.id ? null : tour.id)}
                          className="w-full bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-2 py-1 rounded text-xs font-medium transition-colors"
                        >
                          📅 Aylık Fiyatları Düzenle
                        </button>
                      </div>
                    )}
                    
                    {/* Durum */}
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${tour.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {tour.isActive ? '✅ Aktif' : '❌ Pasif'}
                      </span>
                      <div className="text-right">
                        {tour.monthlyPricing?.enabled ? (
                          <div>
                            <div className="text-lg font-bold text-green-600">
                              {formatPrice(getCurrentMonthPrice(tour.id))}
                            </div>
                            <div className="text-xs text-gray-500">
                              Bu ay ({monthNames[new Date().getMonth()]})
                            </div>
                          </div>
                        ) : (
                          <span className="text-lg font-bold">
                            {formatPrice(tour.price)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
            )}

            {/* Ay Bazlı Fiyat Düzenleme Paneli */}
            {editingMonthlyPrices && (
              <div className="border-t pt-6 mb-6">
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-indigo-800">
                      📅 {tourTypes.find(t => t.id === editingMonthlyPrices)?.name} - Aylık Fiyat Yönetimi
                    </h3>
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-indigo-700">Yıl:</label>
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="px-3 py-1 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                      >
                        <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
                        <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                        <option value={new Date().getFullYear() + 1}>{new Date().getFullYear() + 1}</option>
                      </select>
                      <button
                        onClick={() => setEditingMonthlyPrices(null)}
                        className="text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        ✕ Kapat
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {monthNames.map((monthName, index) => {
                      const monthNumber = index + 1;
                      const currentPrice = getMonthlyPrice(editingMonthlyPrices, monthNumber);
                      const isCurrentMonth = new Date().getMonth() === index && new Date().getFullYear() === selectedYear;
                      
                      return (
                        <div key={monthNumber} className={`p-4 rounded-xl border-2 transition-all shadow-sm hover:shadow-md ${
                          isCurrentMonth 
                            ? 'border-green-400 bg-gradient-to-br from-green-50 to-green-100' 
                            : 'border-indigo-200 bg-gradient-to-br from-white to-indigo-50 hover:border-indigo-300'
                        }`}>
                          <div className="text-center mb-2">
                            <div className={`font-bold text-sm ${isCurrentMonth ? 'text-green-700' : 'text-indigo-700'}`}>
                              {monthName}
                              {isCurrentMonth && <span className="ml-1">🟢</span>}
                            </div>
                            <div className="text-xs text-gray-500">{selectedYear}</div>
                          </div>
                          
                          <div className="space-y-3">
                            {/* Fiyat Input Alanı */}
                            <div className="relative">
                              <input
                                type="number"
                                value={currentPrice === (tourTypes.find(t => t.id === editingMonthlyPrices)?.price || 0) ? '' : currentPrice}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === '') {
                                    updateMonthlyPrice(editingMonthlyPrices, monthNumber, 0);
                                  } else {
                                    updateMonthlyPrice(editingMonthlyPrices, monthNumber, parseInt(value) || 0);
                                  }
                                }}
                                className="w-full px-3 py-2 text-center font-semibold border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-gray-800 bg-white"
                                placeholder="Varsayılan"
                              />
                              <div className="absolute -top-1 -right-1">
                                {currentPrice !== (tourTypes.find(t => t.id === editingMonthlyPrices)?.price || 0) && (
                                  <button
                                    onClick={() => updateMonthlyPrice(editingMonthlyPrices, monthNumber, 0)}
                                    className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors shadow-lg"
                                    title="Bu ayın fiyatını sil"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            </div>
                            
                            {/* Fiyat Gösterimi */}
                            <div className="text-center">
                              {currentPrice === (tourTypes.find(t => t.id === editingMonthlyPrices)?.price || 0) ? (
                                <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                                  Varsayılan: {formatPrice(currentPrice)}
                                </div>
                              ) : (
                                <div className="text-sm font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded">
                                  {formatPrice(currentPrice)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Kaydet/İptal Butonları */}
                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-indigo-600">💡</span>
                      <span className="text-sm text-indigo-700">
                        Değişiklikler otomatik kaydedilir
                      </span>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setEditingMonthlyPrices(null)}
                        className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                      >
                        Kapat
                      </button>
                      <button
                        onClick={saveTourTypes}
                        disabled={saving}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                      >
                        {saving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Kaydediliyor...</span>
                          </>
                        ) : (
                          <>
                            <span>💾</span>
                            <span>Kaydet</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-indigo-100 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <span className="text-indigo-600">💡</span>
                      <div className="text-sm text-indigo-700">
                        <p className="font-medium mb-1">Ay Bazlı Fiyatlandırma Nasıl Çalışır?</p>
                        <ul className="space-y-1 text-xs">
                          <li>• Yeşil işaretli ay mevcut aydır ve aktif fiyattır</li>
                          <li>• Boş bırakılan aylar varsayılan fiyatı kullanır</li>
                          <li>• <strong>Fiyat silmek için:</strong> Input'u boş bırakın veya × butonuna tıklayın</li>
                          <li>• Rezervasyon sırasında seçilen tarihin ayına göre fiyat belirlenir</li>
                          <li>• Kaydet butonuna tıklayarak değişiklikleri Firebase'e kaydedin</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Yeni Tur Ekleme Formu */}
            {editingTourTypes && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">➕ Yeni Tur Tipi Ekle</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tur Adı *
                      </label>
                      <input
                        type="text"
                        value={newTourType.name}
                        onChange={(e) => setNewTourType({...newTourType, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        placeholder="Örn: Gece Turu"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fiyat (TL) *
                      </label>
                      <input
                        type="number"
                        value={newTourType.price}
                        onChange={(e) => setNewTourType({...newTourType, price: parseInt(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        placeholder="0"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Renk Teması
                      </label>
                      <select
                        value={newTourType.color}
                        onChange={(e) => setNewTourType({...newTourType, color: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      >
                        <option value="indigo">İndigo</option>
                        <option value="red">Kırmızı</option>
                        <option value="yellow">Sarı</option>
                        <option value="blue">Mavi</option>
                        <option value="green">Yeşil</option>
                        <option value="purple">Mor</option>
                        <option value="orange">Turuncu</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newTourType.isActive}
                          onChange={(e) => setNewTourType({...newTourType, isActive: e.target.checked})}
                          className="sr-only"
                        />
                        <div className={`relative w-10 h-6 rounded-full transition-colors ${newTourType.isActive ? 'bg-green-500' : 'bg-gray-300'}`}>
                          <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${newTourType.isActive ? 'translate-x-4' : 'translate-x-0'}`}></div>
                        </div>
                        <span className="ml-3 text-sm font-medium text-gray-700">
                          {newTourType.isActive ? 'Aktif' : 'Pasif'}
                        </span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Açıklama
                    </label>
                    <input
                      type="text"
                      value={newTourType.description}
                      onChange={(e) => setNewTourType({...newTourType, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      placeholder="Bu turun kısa açıklaması..."
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2 mt-4">
                    <button
                      onClick={() => setEditingTourTypes(false)}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      İptal
                    </button>
                    <button
                      onClick={addTourType}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      ➕ Tur Ekle
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Bilgi Notu */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <div className="flex items-start">
                <span className="text-blue-600 mr-2">💡</span>
                <div>
                  <h4 className="font-medium text-blue-800 mb-1">Tur Tipi Yönetimi Hakkında:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• <strong>İlk Kurulum:</strong> "Tur Tiplerini Kaydet" butonuna tıklayarak sistem turlarını aktif edin</li>
                    <li>• Sistem turları (Normal, Özel, Balık+Yüzme) silinemez ama fiyatları değiştirilebilir</li>
                    <li>• Yeni tur tipleri ekleyebilir, aktif/pasif durumlarını kontrol edebilirsiniz</li>
                    <li>• Pasif turlar rezervasyon sayfasında görünmez</li>
                    <li>• Değişiklikler anında rezervasyon sistemine yansır</li>
                    <li>• Fiyat değişiklikleri için "Tur Tiplerini Kaydet" butonuna tıklayın</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Randevu Saatleri Yönetimi (Kapatıldı) */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">🕐 Randevu Saatleri</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <span className="text-blue-600 mr-3">ℹ️</span>
                <div>
                  <p className="text-sm text-blue-800">
                    Randevu saatlerinin yönetimi artık <strong>Tekne Yönetimi</strong> üzerinden yapılıyor. Her tekne için ayrı saat dilimleri ve günlük özel saatler tanımlanabilir.
                  </p>
                  <p className="text-sm text-blue-800 mt-2">
                    Lütfen saat düzenlemeleri için <Link href="/admin/boats" className="text-blue-700 underline font-medium">Tekneler</Link> sayfasına gidin.
                  </p>
                </div>
              </div>
            </div>
            {/* Mevcut kayıtlı sistem saatlerini sadece görüntüle (varsa) */}
            {availableTimes?.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">Sisteminizde kayıtlı (pasif) saatler</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {availableTimes.map((t, i) => (
                    <div key={i} className="px-3 py-2 rounded bg-gray-50 border border-gray-200 text-gray-700">
                      {t}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">Bu saatler yalnızca görüntüleme amaçlıdır; rezervasyonlarda kullanılmaz.</p>
              </div>
            )}
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
                        
                        {/* Durum ve Tarih */}
                        <div className="flex items-center justify-between mb-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${tour.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {tour.isActive ? '✅ Aktif' : '❌ Pasif'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(tour.createdAt).toLocaleDateString('tr-TR')}
                          </span>
                        </div>
                        
                        {/* Çalışma Saatleri Yönetimi */}
                        <div className="space-y-2">
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-xs">
                            <p className="text-yellow-700 font-medium mb-1">💡 Saat Yönetimi</p>
                            <p className="text-yellow-600">
                              Özel turların çalışma saatleri ana menüdeki "Saat Yönetimi" sayfasından yönetilir.
                              Orada yapılan değişiklikler tüm tur tiplerine aynı anda uygulanır.
                            </p>
                          </div>
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

 