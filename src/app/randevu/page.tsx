'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { createResilientListener } from '@/lib/firestoreHelpers';
import { detectBrowser, logBrowserComparison, forceFirestoreConnectionInChrome } from '@/lib/browserDetection';
import { optimizeFirestoreForChrome, chromeSpecificRetry, detectChromePrivacySettings } from '@/lib/chromeFixes';
import { handleChromeFirebaseError } from '@/utils/chromeFirebaseFix';
import { logChromeFirebaseDebug, checkChromeFirebasePermissions } from '@/utils/chromeDebugHelper';

interface TimeSlot {
  id: string;
  start: string;
  end: string;
  isActive: boolean;
  displayName?: string;
  availableTourTypes?: {
    normal: boolean;
    private: boolean;
    fishingSwimming: boolean;
    customTours?: string[];
  };
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
  customSchedule?: {
    enabled: boolean;
    timeSlots: TimeSlot[];
    note?: string;
  };
}

interface Boat {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
  capacity: number;
  seatingLayout: 'single' | 'double';
  isActive: boolean;
  status?: 'active' | 'inactive' | 'coming-soon' | 'maintenance'; // Tekne durumu
  statusMessage?: string; // Özel durum mesajı (örn: "Çok yakında hizmetinizde")
  createdAt?: string;
  updatedAt?: string;
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

export default function RandevuPage() {
  // Adım takibi
  const [currentStep, setCurrentStep] = useState<number>(1);
  
  // Tekne seçimi
  const [selectedBoat, setSelectedBoat] = useState<Boat | null>(null);
  const [boatName, setBoatName] = useState<string>('');
  
  // Tekneler verisi
  // Tekneler - Firebase'den dinamik çekilecek
  const [boats, setBoats] = useState<Boat[]>([]);
  const [boatsLoading, setBoatsLoading] = useState<boolean>(true);
  const [imageLoadingStates, setImageLoadingStates] = useState<{[key: string]: boolean}>({});
  
  // Tekne seçimi handler
  const handleSelectBoat = (boatId: string) => {
    const boatToSelect = boats.find(b => b.id === boatId);
    if (boatToSelect) {
      setSelectedBoat(boatToSelect);
      setBoatName(boatToSelect.name);
    }
  };
  
  // Helper fonksiyonlar
  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Tarih aralığı kontrolü
  const isDateInBoatRange = (date: string, boat: Boat): boolean => {
    if (!boat.dateRange?.enabled) return true;
    
    const checkDate = new Date(date);
    const startDate = new Date(boat.dateRange.startDate);
    const endDate = new Date(boat.dateRange.endDate);
    
    return checkDate >= startDate && checkDate <= endDate;
  };
  
  // Seçili tarih için geçerli tekneleri filtrele
  const getAvailableBoatsForDate = (date: string): Boat[] => {
    return boats.filter(boat => isDateInBoatRange(date, boat));
  };
  
  // Image loading handlers
  const handleImageLoad = (boatId: string) => {
    setImageLoadingStates(prev => ({...prev, [boatId]: false}));
  };
  
  const handleImageError = (boatId: string) => {
    setImageLoadingStates(prev => ({...prev, [boatId]: false}));
  };

  // Tekneleri Firebase'den çek
  useEffect(() => {
    setLoading(true); // Yükleme başladı
    setBoatsLoading(true);
    
    // Browser diagnostics
    const browser = detectBrowser();
    logBrowserComparison();
    
    console.log(`🚢 Tekneler yükleniyor... (${browser.name})`);
    
    // Chrome için özel bağlantı zorlaması
    const initializeBoats = async () => {
      try {
        if (browser.isChrome) {
          // Chrome privacy settings kontrolü
          const privacySettings = detectChromePrivacySettings();
          console.log('🔒 Chrome Privacy Settings:', privacySettings);
          
          if (privacySettings.thirdPartyCookiesBlocked) {
            console.warn('🍪 Chrome third-party cookies blocked - bu Firestore bağlantısını etkileyebilir');
          }
          
          if (privacySettings.adBlockerDetected) {
            console.warn('🛡️ Ad blocker detected - Firebase subdomain\'leri engellenebilir');
          }
          
          // Chrome cache temizliği
          console.log('🗑️ Chrome cache temizleniyor...');
          const { clearChromeFirestoreCache } = await import('@/lib/chromeFixes');
          clearChromeFirestoreCache();
          
          await optimizeFirestoreForChrome();
          await forceFirestoreConnectionInChrome();
          console.log('🔧 Chrome için Firestore optimizasyonu tamamlandı');
        }
        
        // Chrome için özel retry wrapper
        const fetchBoatsOperation = () => new Promise<any>((resolve, reject) => {
          const unsubscribe = createResilientListener(
            collection(db, 'boats'),
            (snapshot) => {
              console.log(`📡 Tekne verisi alındı: ${snapshot.size} tekne`);
              
              if (snapshot.size === 0) {
                console.warn('⚠️ Tekne verisi boş - yeniden deneniyor...');
                reject(new Error('Empty snapshot'));
                return;
              }
              
              const boatList: Boat[] = [];
              const initialImageStates: {[key: string]: boolean} = {};
              
              snapshot.forEach((doc) => {
                const data = doc.data();
                console.log(`⛵ Tekne işleniyor: ${doc.id}`, data);
                
                const boat = {
                  id: doc.id,
                  ...data,
                  createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                  updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
                } as Boat;
                
                boatList.push(boat);
                initialImageStates[boat.id] = true; // Başlangıçta loading state true
              });
              
              console.log(`✅ İşlenen tekneler (${browser.name}):`, boatList);
              
              setBoats(boatList.sort((a, b) => new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime()));
              setImageLoadingStates(initialImageStates);
              setBoatsLoading(false);
              setLoading(false); // Yükleme bitti
              
              resolve(unsubscribe);
            },
            (error) => {
              console.error(`❌ Snapshot error (${browser.name}):`, error);
              reject(error);
            }
          );
        });
        
        // Chrome için retry logic kullan
        const unsubscribeOrRetry = browser.isChrome 
          ? await chromeSpecificRetry(fetchBoatsOperation, 3, 1000)
          : await fetchBoatsOperation();
        
        return unsubscribeOrRetry;
      } catch (error) {
        console.error(`💥 İnitialization hatası (${browser.name}):`, error);
        
        // Browser specific error handling
        if (browser.isChrome) {
          console.warn('🔧 Chrome\'da Firestore bağlantı sorunu tespit edildi');
        }
        
        // Hata durumunda varsayılan tekneleri kullan
        setBoats([
          {
            id: 'boat1',
            name: '1. Tekne',
            imageUrl: '/tekne-gorseller/tekne-1.jpg',
            description: 'Konforlu ve güvenli balık avı teknesi',
            capacity: 12,
            seatingLayout: 'single',
            isActive: true,
            status: 'active'
          },
          {
            id: 'boat2',
            name: '2. Tekne',
            imageUrl: '/tekne-gorseller/tekne-2.jpg',
            description: 'Geniş ve ferah balık avı teknesi',
            capacity: 12,
            seatingLayout: 'double',
            isActive: true,
            status: 'active'
          }
        ]);
        
        setBoatsLoading(false);
        setLoading(false);
        return () => {};
      }
    };

    const unsubscribePromise = initializeBoats();
    
    return () => {
      unsubscribePromise.then(unsubscribe => {
        if (unsubscribe) unsubscribe();
      });
    };
  }, []);

  // Sayfa yüklendiğinde üstte başla
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);
  
  // Telefon numarası formatlaması - Mobil uyumlu basitleştirilmiş versiyon
  const formatPhoneNumber = (value: string): string => {
    // Sadece rakamları al
    let cleanValue = value.replace(/\D/g, '');
    
    // 0 ile başlamayan 10 haneli numaraları 0 ile başlat
    if (cleanValue.length === 10 && !cleanValue.startsWith('0')) {
      cleanValue = '0' + cleanValue;
    }
    
    // Maksimum 11 haneli
    cleanValue = cleanValue.slice(0, 11);
    
    // Basit format: sadece rakamlar (mobil klavyede sorun yaşanmaması için)
    return cleanValue;
  };

  // Telefon numarası validasyon fonksiyonu
  const validatePhoneNumber = (phone: string): { isValid: boolean; message: string } => {
    // Boşluk ve özel karakterleri temizle
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    // Türk telefon numarası formatı kontrolü
    const phoneRegex = /^(0?)(50[0-9]|51[0-9]|52[0-9]|53[0-9]|54[0-9]|55[0-9]|56[0-9]|59[0-9])[0-9]{7}$/;
    
    if (!cleanPhone) {
      return { isValid: false, message: 'Telefon numarası zorunludur' };
    }
    
    if (cleanPhone.length < 10) {
      return { isValid: false, message: 'Telefon numarası en az 10 haneli olmalıdır' };
    }
    
    if (cleanPhone.length > 11) {
      return { isValid: false, message: 'Telefon numarası en fazla 11 haneli olmalıdır' };
    }
    
    // Sadece rakam kontrolü
    if (!/^\d+$/.test(cleanPhone)) {
      return { isValid: false, message: 'Telefon numarası sadece rakam içermelidir' };
    }
    
    // Türk GSM operatör kodları kontrolü
    if (!phoneRegex.test(cleanPhone)) {
      return { isValid: false, message: 'Geçerli bir Türk telefon numarası giriniz (05XX XXX XX XX)' };
    }
    
    return { isValid: true, message: '' };
  };
  
  // Scroll to continue button utility - iyileştirilmiş versiyon
  const scrollToContinueButton = (forceScroll = false) => {
    // Browser kontrolü (SSR uyumluluğu)
    if (typeof window === 'undefined') return;
    
    // Sadece mobil cihazlarda veya force edildiğinde scroll yap
    const isMobile = window.innerWidth < 768;
    
    if (!forceScroll && !isMobile) {
      return; // Desktop'ta otomatik scroll yapma
    }
    
    setTimeout(() => {
      const continueButton = document.querySelector('[data-continue-button]') as HTMLElement;
      if (continueButton) {
        // Butonun görünür olup olmadığını kontrol et
        const rect = continueButton.getBoundingClientRect();
        const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
        
        // Sadece buton görünmüyorsa scroll yap
        if (!isVisible) {
          continueButton.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }
    }, 150);
  };
  
  // Form verileri
  const [tourType, setTourType] = useState<string>('normal'); // normal, private, fishing-swimming, veya custom tur ID'si
  const [priceOption, setPriceOption] = useState<'own-equipment' | 'with-equipment'>('own-equipment');
  const [prices, setPrices] = useState({
    normalOwn: 850,
    normalWithEquipment: 1000,
    privateTour: 12000,
    fishingSwimming: 15000
  });
  // Yaş grubu bilgileri
  const [ageGroups, setAgeGroups] = useState({
    adults: 1,    // 7+ yaş - tam fiyat
    children: 0,  // 3-6 yaş - %50 indirim
    babies: 0     // 0-3 yaş - ücretsiz
  });
  
  // Kişi bazında olta seçimi
  const [equipmentChoices, setEquipmentChoices] = useState({
    adults: { withEquipment: 0, ownEquipment: 1 },      // Yetişkinler için olta seçimi
    children: { withEquipment: 0, ownEquipment: 0 },     // Çocuklar için olta seçimi
    babies: { withEquipment: 0, ownEquipment: 0 }        // Bebekler için olta seçimi (kullanılmaz)
  });
  
  // Toplam kişi sayısı hesaplama
  const getTotalGuestCount = () => {
    return ageGroups.adults + ageGroups.children + ageGroups.babies;
  };
  
  // Koltuk gereksinimi hesaplama (bebekler koltuk gerektirmez)
  const getRequiredSeatCount = () => {
    const totalPeople = ageGroups.adults + ageGroups.children; // Bebekler hariç
    // Her iki tekne için de 1 kişi = 1 koltuk mantığı
    return totalPeople;
  };


  
  // Yaş gruplarına göre fiyat hesaplama
  const calculateAgeBasedPrice = (basePrice: number) => {
    const adultPrice = basePrice * ageGroups.adults;
    const childPrice = basePrice * ageGroups.children * 0.5; // %50 indirim
    const babyPrice = 0; // Bebekler ücretsiz
    
    return {
      adultPrice,
      childPrice,
      babyPrice,
      totalPrice: adultPrice + childPrice + babyPrice,
      breakdown: {
        adults: { count: ageGroups.adults, unitPrice: basePrice, totalPrice: adultPrice },
        children: { count: ageGroups.children, unitPrice: basePrice * 0.5, totalPrice: childPrice },
        babies: { count: ageGroups.babies, unitPrice: 0, totalPrice: babyPrice }
      }
    };
  };
  
  // Yaş grupları değiştiğinde olta seçimlerini güncelle
  useEffect(() => {
    setEquipmentChoices(prev => ({
      adults: { 
        withEquipment: priceOption === 'with-equipment' ? ageGroups.adults : 0,
        ownEquipment: priceOption === 'own-equipment' ? ageGroups.adults : 0
      },
      children: { 
        withEquipment: priceOption === 'with-equipment' ? ageGroups.children : 0,
        ownEquipment: priceOption === 'own-equipment' ? ageGroups.children : 0
      },
      babies: { withEquipment: 0, ownEquipment: 0 } // Bebekler olta kullanmaz
    }));
  }, [ageGroups, priceOption]); // priceOption dependency eklendi

  // Tur tipi değiştiğinde equipmentChoices'ı sıfırla ve priceOption'a göre ayarla
  useEffect(() => {
    if (tourType === 'normal') {
      setEquipmentChoices({
        adults: { 
          withEquipment: priceOption === 'with-equipment' ? ageGroups.adults : 0,
          ownEquipment: priceOption === 'own-equipment' ? ageGroups.adults : 0
        },
        children: { 
          withEquipment: priceOption === 'with-equipment' ? ageGroups.children : 0,
          ownEquipment: priceOption === 'own-equipment' ? ageGroups.children : 0
        },
        babies: { withEquipment: 0, ownEquipment: 0 }
      });
    }
  }, [tourType, priceOption, ageGroups]); // Tur tipi ve priceOption değiştiğinde hemen güncelle

  // Esnek fiyat hesaplama (kişi bazında olta seçimi)
  const calculateFlexiblePrice = () => {
    if (tourType !== 'normal') return null;
    
    const adultWithEquipment = equipmentChoices.adults.withEquipment * prices.normalWithEquipment;
    const adultOwnEquipment = equipmentChoices.adults.ownEquipment * prices.normalOwn;
    const childWithEquipment = equipmentChoices.children.withEquipment * prices.normalWithEquipment * 0.5;
    const childOwnEquipment = equipmentChoices.children.ownEquipment * prices.normalOwn * 0.5;
    
    const totalPrice = adultWithEquipment + adultOwnEquipment + childWithEquipment + childOwnEquipment;
    
    return {
      totalPrice,
      breakdown: {
        adults: {
          withEquipment: { count: equipmentChoices.adults.withEquipment, unitPrice: prices.normalWithEquipment, totalPrice: adultWithEquipment },
          ownEquipment: { count: equipmentChoices.adults.ownEquipment, unitPrice: prices.normalOwn, totalPrice: adultOwnEquipment }
        },
        children: {
          withEquipment: { count: equipmentChoices.children.withEquipment, unitPrice: prices.normalWithEquipment * 0.5, totalPrice: childWithEquipment },
          ownEquipment: { count: equipmentChoices.children.ownEquipment, unitPrice: prices.normalOwn * 0.5, totalPrice: childOwnEquipment }
        },
        babies: { count: ageGroups.babies, unitPrice: 0, totalPrice: 0 }
      }
    };
  };

  // Normal tur için gerçek zamanlı fiyat hesaplama
  const getCurrentPrice = () => {
    if (tourType !== 'normal') return null;
    
    // Esnek olta sistemi kullan
    return calculateFlexiblePrice();
  };
  
  const [guestCount, setGuestCount] = useState<number>(1);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [guestInfo, setGuestInfo] = useState({
    name: '',
    surname: '',
    phone: '',
    email: ''
  });
  
  // Telefon numarası hata mesajı
  const [phoneError, setPhoneError] = useState<string>('');
  
  // Sistem verileri
  const [availableTimes, setAvailableTimes] = useState<string[]>(['07:00-13:00', '14:00-20:00']);
  // Saat dilimlerinin detaylı bilgileri (displayName için)
  const [timeSlotDetails, setTimeSlotDetails] = useState<{[timeRange: string]: TimeSlot}>({});
  // Tekne + Tur bazlı özel program bilgisi (not/badge için kullanılacak)
  const [activeBoatSchedule, setActiveBoatSchedule] = useState<{ note?: string; tourType?: string } | null>(null);
  const [customTours, setCustomTours] = useState<CustomTour[]>([]);
  const [occupiedSeats, setOccupiedSeats] = useState<string[]>([]);
  const [occupiedDates, setOccupiedDates] = useState<{[boatId: string]: {[key: string]: number}}>({});
  const [sessionOccupancy, setSessionOccupancy] = useState<{[boatId: string]: {[key: string]: number}}>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  

  // Chrome için Firebase retry wrapper (optimized)
  const withRetry = async (operation: () => Promise<any>, maxRetries = 3): Promise<any> => {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Chrome Firebase işlemi (deneme ${attempt}/${maxRetries})`);
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        console.warn(`❌ Firebase hatası (deneme ${attempt}):`, error.code || error.message);
        
        // Chrome'da sık görülen Firebase hataları
        if (error?.code === 'permission-denied' || 
            error?.code === 'unavailable' || 
            error?.message?.includes('Missing or insufficient permissions')) {
          
          if (attempt < maxRetries) {
            // Exponential backoff with jitter
            const delay = Math.min(1000 * Math.pow(2, attempt - 1) + Math.random() * 1000, 5000);
            console.log(`⏳ ${delay}ms bekleyip tekrar denenecek...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          } else {
            // Son deneme başarısız oldu, kullanıcıyı bilgilendir
            console.error('🔴 Chrome Firebase hatası - tüm denemeler başarısız');
            handleChromeFirebaseError(error);
          }
        }
        
        // Diğer hatalar için hemen fırlat
        throw error;
      }
    }
    
    throw lastError;
  };

  // Firebase'den fiyatları çek
  const fetchPrices = async () => {
    try {
      const result = await withRetry(async () => {
        const pricesDoc = await getDoc(doc(db, 'settings', 'prices'));
        if (pricesDoc.exists()) {
          return pricesDoc.data();
        }
        return null;
      });
      
      if (result) {
        setPrices({
          normalOwn: result.normalOwn || 850,
          normalWithEquipment: result.normalWithEquipment || 1000,
          privateTour: result.privateTour || 12000,
          fishingSwimming: result.fishingSwimming || 15000
        });
      }
    } catch (error: any) {
      console.error('Fiyatlar çekilemedi:', error);
      
      // Chrome'da permission hatası durumunda kullanıcıyı bilgilendir
      if (error?.code === 'permission-denied' || 
          error?.message?.includes('Missing or insufficient permissions')) {
        console.warn('⚠️ Chrome Firebase yetki sorunu - varsayılan fiyatlar kullanılıyor');
      }
    }
  };


  // Firebase'den özel turları çek
  const fetchCustomTours = async () => {
    try {
      const result = await withRetry(async () => {
        const toursDoc = await getDoc(doc(db, 'settings', 'customTours'));
        if (toursDoc.exists()) {
          return toursDoc.data();
        }
        return null;
      });
      
      if (result && result.tours && Array.isArray(result.tours)) {
        // Sadece aktif turları göster
        const activeTours = result.tours.filter((tour: CustomTour) => tour.isActive);
        setCustomTours(activeTours);
      }
    } catch (error: any) {
      console.error('Özel turlar çekilemedi:', error);
      
      // Chrome'da permission hatası durumunda kullanıcıyı bilgilendir
      if (error?.code === 'permission-denied' || 
          error?.message?.includes('Missing or insufficient permissions')) {
        console.warn('⚠️ Chrome Firebase yetki sorunu - özel turlar yüklenemedi');
      }
    }
  };

  // Seçilen tekne/tur ve tarihe göre saatleri çek
  const fetchAvailableTimesForDate = async (dateString: string) => {
    try {
      // 0) Öncelik: Tekne + Tur Tipi + Tarih için boatSchedules kontrolü (Chrome optimized)
      if (selectedBoat?.id && tourType) {
        const bsId = `${selectedBoat.id}_${dateString}_${tourType}`;
        console.log(`🔍 Chrome: boatSchedules kontrolü - ${bsId}`);
        logChromeFirebaseDebug('boatSchedules Check', { bsId, selectedBoat: selectedBoat.name, tourType });
        
        try {
          const bsDoc = await withRetry(async () => {
            console.log(`📡 Chrome: Firebase çağrısı yapılıyor - boatSchedules/${bsId}`);
            return await getDoc(doc(db, 'boatSchedules', bsId));
          });
          
          if (bsDoc.exists()) {
            const bsData = bsDoc.data();
            console.log(`✅ Chrome: boatSchedules bulundu (${bsId}):`, bsData);
            
            // Tur tipi eşleşmesi ve aktif olma kontrolü
            if (bsData.enabled && bsData.tourType === tourType && Array.isArray(bsData.timeSlots)) {
              const times = bsData.timeSlots.map((slot: any) => `${slot.start}-${slot.end}`);
              setAvailableTimes(times);
              
              // TimeSlot detaylarını kaydet
              const slotDetails: {[timeRange: string]: TimeSlot} = {};
              bsData.timeSlots.forEach((slot: any) => {
                const timeRange = `${slot.start}-${slot.end}`;
                slotDetails[timeRange] = slot;
              });
              setTimeSlotDetails(slotDetails);
              
              setActiveBoatSchedule({
                note: bsData.note || '',
                tourType: bsData.tourType || tourType
              });
              
              console.log(`🎯 Chrome: Tekne özel saatleri yüklendi:`, times);
              return;
            } else {
              console.log(`⚠️ Chrome: boatSchedules bulundu ama koşullar sağlanmıyor:`, {
                enabled: bsData.enabled,
                tourType: bsData.tourType,
                expectedTourType: tourType,
                hasTimeSlots: Array.isArray(bsData.timeSlots)
              });
            }
          } else {
            console.log(`ℹ️ Chrome: boatSchedules bulunamadı (${bsId})`);
          }
        } catch (error: any) {
          console.error(`❌ Chrome: boatSchedules çekme hatası (${bsId}):`, error);
          
          // Chrome'da permission hatası durumunda bilgilendir
          if (error?.code === 'permission-denied' || 
              error?.message?.includes('Missing or insufficient permissions')) {
            console.warn('⚠️ Chrome: boatSchedules permission hatası - genel saatlere geçiliyor');
          }
        }
        
        // Custom tur için boatSchedules kaydı yoksa genel saatleri kullan
        if (tourType !== 'normal' && tourType !== 'private' && tourType !== 'fishing-swimming') {
          console.log(`Custom tur (${tourType}) için boatSchedules kaydı bulunamadı: ${bsId}, genel saatlere geçiliyor...`);
          // Genel saatleri kullanmak için devam et, return yapma
        }
      }

      // Öncelik 1: Özel tur seçildi ve o turun customSchedule'ı varsa
      if (tourType !== 'normal' && tourType !== 'private' && tourType !== 'fishing-swimming') {
        console.log(`🎣 Özel tur tespit edildi: ${tourType} (customTours sayısı: ${customTours.length})`);
        const selectedCustomTour = customTours.find(tour => tour.id === tourType);
        
        if (selectedCustomTour) {
          console.log(`📋 Özel tur bulundu: ${selectedCustomTour.name}`);
          if (selectedCustomTour.customSchedule?.enabled) {
            const activeSlots = selectedCustomTour.customSchedule.timeSlots
              .filter(slot => slot.isActive && slot.start && slot.end)
              .map(slot => `${slot.start}-${slot.end}`);
          
            if (activeSlots.length > 0) {
              console.log(`✅ Özel tur (${selectedCustomTour.name}) için customSchedule bulundu:`, activeSlots);
              setAvailableTimes(activeSlots);
              
              // TimeSlot detaylarını kaydet
              const slotDetails: {[timeRange: string]: TimeSlot} = {};
              selectedCustomTour.customSchedule.timeSlots
                .filter(slot => slot.isActive && slot.start && slot.end)
                .forEach((slot) => {
                  const timeRange = `${slot.start}-${slot.end}`;
                  slotDetails[timeRange] = slot;
                });
              setTimeSlotDetails(slotDetails);
              
              setActiveBoatSchedule({
                note: selectedCustomTour.customSchedule.note || '',
                tourType: tourType
              });
              return;
            }
          }
          console.log(`⚠️ Özel tur (${selectedCustomTour.name}) için customSchedule yok, tekne saatlerine geçiliyor...`);
        } else {
          console.log(`❌ Özel tur (${tourType}) customTours listesinde bulunamadı (liste boş: ${customTours.length === 0}), tekne saatlerine geçiliyor...`);
        }
        
        // Özel tur olduğunu belirtmek için devam et (return yapma)
        console.log(`🔄 Özel tur ${tourType} için tekne saatleri kontrol edilecek...`);
      }
      
      // Öncelik 2: Tekne seçildi ve o teknenin özel saatleri varsa
      if (selectedBoat?.customSchedule?.enabled) {
        console.log(`Tekne (${selectedBoat.name}) özel saatleri kontrol ediliyor...`);
        
        // Önce tüm aktif slotları al
        const allActiveSlots = selectedBoat.customSchedule.timeSlots
          .filter(slot => slot.isActive && slot.start && slot.end);
        
        console.log(`Tekne tüm aktif slotları:`, allActiveSlots.map(s => `${s.start}-${s.end}`));
        
        // Tur tipine göre filtreleme yap
        const filteredSlots = allActiveSlots.filter(slot => {
            // availableTourTypes kontrolü varsa
            if (slot.availableTourTypes) {
              if (tourType === 'normal') return slot.availableTourTypes.normal;
              if (tourType === 'private') return slot.availableTourTypes.private;
              if (tourType === 'fishing-swimming') return slot.availableTourTypes.fishingSwimming;
              
              // Özel turlar için: VARSAYILAN OLARAK TÜM ÖZEL TURLAR AKTİF
              if (tourType !== 'normal' && tourType !== 'private' && tourType !== 'fishing-swimming') {
                // Eğer customTours listesi varsa ve bu tur orada varsa
                if (slot.availableTourTypes.customTours?.includes(tourType)) {
                  return true;
                }
                // Eğer customTours listesi yoksa veya boşsa, TÜM ÖZEL TURLAR İÇİN AKTİF
                if (!slot.availableTourTypes.customTours || slot.availableTourTypes.customTours.length === 0) {
                  console.log(`✅ Slot ${slot.start}-${slot.end} özel tur ${tourType} için aktif (customTours listesi boş/yok)`);
                  return true;
                }
                // customTours listesi var ama bu tur orada yok - yine de aktif yap (eski davranış)
                console.log(`⚠️ Slot ${slot.start}-${slot.end} özel tur ${tourType} için customTours'da yok ama yine de aktif yapılıyor`);
                return true;
              }
              return false;
            }
            
            // availableTourTypes yoksa tüm turlar için aktif (eski format uyumluluğu)
            console.log(`✅ Slot ${slot.start}-${slot.end} availableTourTypes yok, tüm turlar için aktif`);
            return true;
          });
        
        console.log(`${tourType} turu için filtrelenmiş slotlar:`, filteredSlots.map(s => `${s.start}-${s.end}`));
        
        if (filteredSlots.length > 0) {
          const times = filteredSlots.map(slot => `${slot.start}-${slot.end}`);
          setAvailableTimes(times);
          
          // TimeSlot detaylarını kaydet
          const slotDetails: {[timeRange: string]: TimeSlot} = {};
          filteredSlots.forEach((slot) => {
            const timeRange = `${slot.start}-${slot.end}`;
            slotDetails[timeRange] = slot;
          });
          setTimeSlotDetails(slotDetails);
          
          setActiveBoatSchedule({
            note: selectedBoat.customSchedule.note || '',
            tourType: tourType
          });
          
          console.log(`✅ Tekne özel saatleri kullanılıyor:`, times);
          return;
        } else {
          console.log(`❌ Tekne özel saatleri ${tourType} turu için uygun değil, genel saatlere geçiliyor...`);
        }
      }
      
      // Öncelik 3: Tarih bazlı özel sistem saatleri
      const scheduleDoc = await getDoc(doc(db, 'schedules', dateString));
      
      if (scheduleDoc.exists()) {
        const scheduleData = scheduleDoc.data();
        if (scheduleData.timeSlots && Array.isArray(scheduleData.timeSlots)) {
          // Özel saat ayarları var, bunları kullan
          const times = scheduleData.timeSlots.map((slot: any) => `${slot.start}-${slot.end}`);
          setAvailableTimes(times);
          setTimeSlotDetails({}); // Eski sistem için displayName yok
          return;
        }
      }
      
      // Öncelik 4: Genel sistem saatleri (Chrome için retry ile)
      console.log('🔄 Genel sistem saatleri çekiliyor (Chrome optimized)...');
      
      try {
        const result = await withRetry(async () => {
          const timesDoc = await getDoc(doc(db, 'settings', 'availableTimes'));
          if (timesDoc.exists()) {
            return timesDoc.data();
          }
          return null;
        });
        
        if (result && result.times && Array.isArray(result.times)) {
          console.log('✅ Genel sistem saatleri başarıyla çekildi:', result.times);
          setAvailableTimes(result.times);
          
          // Saat detaylarını da kontrol et
          if (result.timeSlotDetails) {
            setTimeSlotDetails(result.timeSlotDetails);
          } else {
            setTimeSlotDetails({});
          }
          setActiveBoatSchedule(null);
        } else {
          // Firestore'da da yoksa hardcoded varsayılanları kullan
          console.log('⚠️ Firestore\'da saat verisi yok, varsayılan saatler kullanılıyor');
          setAvailableTimes(['07:00-13:00', '14:00-20:00']);
          setTimeSlotDetails({});
          setActiveBoatSchedule(null);
        }
      } catch (error: any) {
        console.error('❌ Saat çekme hatası (Chrome):', error);
        
        // Chrome'da permission hatası durumunda kullanıcıyı bilgilendir
        if (error?.code === 'permission-denied' || 
            error?.message?.includes('Missing or insufficient permissions')) {
          console.warn('⚠️ Chrome Firebase yetki sorunu - varsayılan saatler kullanılıyor');
          
          // Chrome için özel bildirim göster
          try {
            handleChromeFirebaseError(error);
          } catch (notificationError) {
            console.warn('Bildirim gösterilemedi:', notificationError);
          }
        }
        
        // Varsayılan saatler
        console.log('🔧 Hata durumunda varsayılan saatler kullanılıyor');
        setAvailableTimes(['07:00-13:00', '14:00-20:00']);
        setTimeSlotDetails({});
        setActiveBoatSchedule(null);
      }
    } catch (error) {
      console.error('Saatler çekilemedi:', error);
      // Hata durumunda varsayılan saatler
      setAvailableTimes(['07:00-13:00', '14:00-20:00']);
      setTimeSlotDetails({});
    }
    
    // Saatler yüklendikten sonra seans doluluk bilgisini çek
    if (selectedBoat?.id && dateString) {
      fetchSessionOccupancy(dateString).catch(error => {
        console.error('Session occupancy fetch error:', error);
      });
    }
  };

  // Seçilen tarih, tekne veya tur değiştiğinde saatleri çek
  useEffect(() => {
    let isCancelled = false; // Cleanup kontrolü için flag
    
    console.log(`🔄 useEffect tetiklendi - Tarih: ${selectedDate}, Tekne: ${selectedBoat?.name}, Tur: ${tourType}`);
    
    if (selectedDate && selectedBoat) {
      console.log(`🕐 Saat çekme başlatılıyor - Tarih: ${selectedDate}, Tekne: ${selectedBoat?.name}, Tur: ${tourType}`);
      fetchAvailableTimesForDate(selectedDate).catch((error) => {
        // Promise rejection'ları da yakala
        if (!isCancelled) {
          console.error('fetchAvailableTimesForDate Promise hatası:', error);
        }
      });
    } else {
      console.log(`⚠️ Saat çekme atlandı - Tarih: ${selectedDate}, Tekne: ${selectedBoat?.name}`);
    }
    
    // Cleanup function
    return () => {
      isCancelled = true;
    };
  }, [selectedDate, selectedBoat?.id, selectedBoat?.customSchedule, tourType, customTours]);

  // Chrome Firebase debug kontrolü
  useEffect(() => {
    const isChrome = navigator.userAgent.includes('Chrome');
    if (isChrome) {
      console.log('🔍 Chrome tespit edildi - Firebase debug başlatılıyor...');
      logChromeFirebaseDebug('Page Load');
      
      // 2 saniye sonra permission test yap
      setTimeout(() => {
        checkChromeFirebasePermissions().then(success => {
          if (success) {
            console.log('✅ Chrome Firebase permissions OK');
          } else {
            console.error('❌ Chrome Firebase permissions FAILED');
            alert('⚠️ Chrome Firebase Bağlantı Sorunu\n\nSayfayı yenilemeyi deneyin (Ctrl+F5)');
          }
        });
      }, 2000);
    }
  }, []);

  // Firebase'den fiyatları çek
  useEffect(() => {
    // Promise rejection'ları yakala
    fetchPrices().catch((error) => {
      console.error('fetchPrices Promise hatası:', error);
    });
    
    fetchCustomTours().catch((error) => {
      console.error('fetchCustomTours Promise hatası:', error);
    });
    

    // Fiyatları real-time dinle
    const unsubscribePrices = onSnapshot(doc(db, 'settings', 'prices'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const newPrices = {
          normalOwn: data.normalOwn || 850,
          normalWithEquipment: data.normalWithEquipment || 1000,
          privateTour: data.privateTour || 12000,
          fishingSwimming: data.fishingSwimming || 15000
        };
        setPrices(newPrices);
        console.log('Fiyatlar güncellendi:', newPrices);
      }
    });

    // Özel turları real-time dinle
    const unsubscribeCustomTours = onSnapshot(doc(db, 'settings', 'customTours'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.tours && Array.isArray(data.tours)) {
          // Sadece aktif turları göster
          const activeTours = data.tours.filter((tour: CustomTour) => tour.isActive);
          setCustomTours(activeTours);
          console.log('Özel turlar güncellendi:', activeTours);
        }
      } else {
        setCustomTours([]);
      }
    });

    return () => {
      unsubscribePrices();
      unsubscribeCustomTours();
    };
  }, []);

  // Ayın dolu günlerini seans bazlı çek
  useEffect(() => {
    let isCancelled = false; // Cleanup kontrolü için flag
    
    const fetchOccupiedDates = async () => {
      if (!selectedBoat?.id) return; // Tekne seçilmemişse çekme
      
      try {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        const lastDay = `${year}-${String(month + 1).padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}`;
        
        const q = query(
          collection(db, 'reservations'),
          where('selectedDate', '>=', firstDay),
          where('selectedDate', '<=', lastDay),
          where('selectedBoat', '==', selectedBoat.id) // Sadece seçili tekneye ait rezervasyonlar
        );
        
        const querySnapshot = await getDocs(q);
        
        // Component unmount olduysa state güncellemesi yapma
        if (isCancelled) return;
        
        const dateTimeOccupancy: {[key: string]: {[key: string]: number}} = {};
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // Sadece onaylı ve bekleyen rezervasyonları dikkate al
          if ((data.status === 'confirmed' || data.status === 'pending') && data.selectedDate && data.selectedTime) {
            const dateKey = data.selectedDate;
            
            // Tarih için obje yoksa oluştur
            if (!dateTimeOccupancy[dateKey]) {
              dateTimeOccupancy[dateKey] = {};
            }
            
            if (data.isPrivateTour) {
              // ÖZEL TUR: Sadece seçilen seans için tüm tekneyi blokla (12 koltuk)
              const timeKey = data.selectedTime;
              dateTimeOccupancy[dateKey][timeKey] = 12; // Seçilen seans için 12 koltuk dolu
            } else if (data.selectedSeats && Array.isArray(data.selectedSeats)) {
              // Normal tur = sadece seçili seans için koltuk sayısı
              const timeKey = data.selectedTime;
              const occupiedCount = data.selectedSeats.length;
              
              // Seans için rezervasyon varsa koltuk sayısını ekle
              if (dateTimeOccupancy[dateKey][timeKey]) {
                dateTimeOccupancy[dateKey][timeKey] += occupiedCount;
              } else {
                dateTimeOccupancy[dateKey][timeKey] = occupiedCount;
              }
              
              // Maksimum 12 koltuk olabilir (bir seans için)
              if (dateTimeOccupancy[dateKey][timeKey] > 12) {
                dateTimeOccupancy[dateKey][timeKey] = 12;
              }
            }
          }
        });
        
        // Component unmount olduysa state güncellemesi yapma
        if (isCancelled) return;
        
        // Eski formatta uyumlu olması için toplam doluluk da hesapla
        const dateOccupancy: {[key: string]: number} = {};
        Object.keys(dateTimeOccupancy).forEach((date) => {
          const sessions = dateTimeOccupancy[date];
          let totalOccupied = 0;
          let fullyOccupiedSessions = 0;
          
          Object.keys(sessions).forEach((time) => {
            if (sessions[time] >= 12) {
              fullyOccupiedSessions++;
            }
            totalOccupied += sessions[time];
          });
          
          // Teknenin TÜM saatleri dolu olduğunda günü tamamen dolu say
          // availableTimes.length kadar saat varsa ve hepsi dolu ise
          const totalAvailableSessions = availableTimes.length;
          if (fullyOccupiedSessions === totalAvailableSessions && totalAvailableSessions > 0) {
            dateOccupancy[date] = 24; // Tüm seanslar dolu
          } else {
            dateOccupancy[date] = Math.min(totalOccupied, 23); // Kısmi dolu (max 23 olsun ki 24'ten az olsun)
          }
        });
        
        // Tekne bazlı state güncelle - sadece component hala mount ise
        if (!isCancelled) {
          setOccupiedDates(prev => ({
            ...prev,
            [selectedBoat.id]: dateOccupancy
          }));
        }
      } catch (error) {
        // Component unmount olduysa error handling yapma
        if (!isCancelled) {
          console.error('Dolu günler çekilemedi:', error);
        }
      }
    };
    
    fetchOccupiedDates().catch((error) => {
      // Promise rejection'ları da yakala
      if (!isCancelled) {
        console.error('fetchOccupiedDates Promise hatası:', error);
      }
    });
    
    // Cleanup function
    return () => {
      isCancelled = true;
    };
  }, [currentMonth, selectedBoat?.id]); // selectedBoat dependency eklendi

  // Yardımcı fonksiyonlar
  const isSpecialTour = (type: string) => {
    // Sadece 'private' ve 'fishing-swimming' tüm tekneyi kapatır
    // Custom turlar koltuk seçilebilir olmalı
    return type === 'private' || type === 'fishing-swimming';
  };

  const getSelectedCustomTour = (type: string) => {
    return customTours.find(tour => tour.id === type);
  };

  const getTourDisplayName = (type: string) => {
    if (type === 'normal') return 'Normal Tur';
    if (type === 'private') return 'Kapalı Tur (Özel)';
    if (type === 'fishing-swimming') return 'Balık + Yüzme Turu';
    
    // Özel turlar için tur adını bul
    const customTour = getSelectedCustomTour(type);
    return customTour ? customTour.name : 'Bilinmeyen Tur';
  };

  const getTourPrice = (type: string) => {
    if (type === 'normal') return priceOption === 'own-equipment' ? prices.normalOwn : prices.normalWithEquipment;
    if (type === 'private') return prices.privateTour;
    if (type === 'fishing-swimming') return prices.fishingSwimming;
    const customTour = getSelectedCustomTour(type);
    return customTour ? customTour.price : 0;
  };

  // Takvim işlevleri
  const getCalendarDays = (month: Date) => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7;
    
    const days = [];
    const today = new Date();
    // Bugünün tarih string formatı (yerel saat dilimi)
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // Önceki ayın günleri
    const prevMonth = new Date(year, monthIndex - 1, 0);
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonth.getDate() - i;
      const prevYear = monthIndex === 0 ? year - 1 : year;
      const prevMonthIndex = monthIndex === 0 ? 11 : monthIndex - 1;
      // Yerel saat dilimi ile tarih formatı (UTC sorunu çözümü)
      const dateStr = `${prevYear}-${String(prevMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        day,
        date: dateStr,
        isCurrentMonth: false,
        isDisabled: true
      });
    }
    
    // Bu ayın günleri
    for (let day = 1; day <= daysInMonth; day++) {
      // Yerel saat dilimi ile tarih formatı (UTC sorunu çözümü)
      const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        day,
        date: dateStr,
        isCurrentMonth: true,
        isDisabled: dateStr < todayStr
      });
    }
    
    // Sonraki ayın günleri
    const remainingSlots = 42 - days.length;
    for (let day = 1; day <= remainingSlots; day++) {
      const nextYear = monthIndex === 11 ? year + 1 : year;
      const nextMonthIndex = monthIndex === 11 ? 0 : monthIndex + 1;
      // Yerel saat dilimi ile tarih formatı (UTC sorunu çözümü)
      const dateStr = `${nextYear}-${String(nextMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        day,
        date: dateStr,
        isCurrentMonth: false,
        isDisabled: true
      });
    }
    
    return days;
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    const today = new Date();
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    if (newMonth >= new Date(today.getFullYear(), today.getMonth(), 1)) {
      setCurrentMonth(newMonth);
    }
  };

  // Tekne sırası belirleme (daha okunakli koltuk ID'leri için)
  const getBoatOrder = (boatId: string) => {
    const sortedBoats = boats.sort((a, b) => new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime());
    const index = sortedBoats.findIndex(boat => boat.id === boatId);
    return index >= 0 ? `T${index + 1}` : 'T1'; // T1, T2, T3...
  };

  // Tekne koltuk düzeni - Her tekne için ayrı koltuk ID'leri (okunakli format)
  const getSeatingLayout = () => {
    // Seçili tekneyi bul
    const currentBoat = boats.find(boat => boat.id === selectedBoat?.id);
    const layoutType = currentBoat?.seatingLayout || 'single';
    const boatId = selectedBoat?.id || 'default';
    
    // Okunakli prefix oluştur (T1, T2, T3...)
    const prefix = boatId === 'default' ? '' : `${getBoatOrder(boatId)}_`;
    
    return {
      iskele: [`${prefix}IS1`, `${prefix}IS2`, `${prefix}IS3`, `${prefix}IS4`, `${prefix}IS5`, `${prefix}IS6`],
      sancak: [`${prefix}SA1`, `${prefix}SA2`, `${prefix}SA3`, `${prefix}SA4`, `${prefix}SA5`, `${prefix}SA6`],
      type: layoutType // Firebase'den gelen seatingLayout kullan
    };
  };

  const seatingLayout = getSeatingLayout();
  const iskeleSeat = seatingLayout.iskele;
  const sancakSeat = seatingLayout.sancak;

  // Koltuk durumu kontrolü
  const getSeatStatus = (seat: string) => {
    if (occupiedSeats.includes(seat)) return 'occupied';
    if (selectedSeats.includes(seat)) return 'selected';
    return 'available';
  };

  const getSeatColor = (status: string) => {
    switch (status) {
      case 'occupied': return 'bg-gradient-to-br from-red-500 to-red-600 border-red-600 cursor-not-allowed';
      case 'selected': return 'bg-gradient-to-br from-green-400 to-green-600 border-green-600 shadow-xl scale-110';
      case 'available': return 'bg-gradient-to-br from-blue-400 to-blue-600 border-blue-600 hover:from-blue-500 hover:to-blue-700 hover:scale-110 shadow-lg hover:shadow-xl';
      default: return 'bg-gray-300 border-gray-400';
    }
  };

  // Koltuk çifti belirleme (sadece görünüm için)
  const getSeatPair = (seatId: string) => {
    // Okunakli tekne prefixli ID'ler için çalışacak şekilde güncellendi
    // Örnek: T1_IS2 -> T1_IS1, T2_IS4 -> T2_IS3
    const parts = seatId.split('_');
    if (parts.length !== 2) return undefined;
    
    const prefix = parts[0]; // T1, T2, etc.
    const seat = parts[1];   // IS1, IS2, etc.
    
    const seatMap: { [key: string]: string } = {
      'IS1': 'IS2', 'IS2': 'IS1',
      'IS3': 'IS4', 'IS4': 'IS3', 
      'IS5': 'IS6', 'IS6': 'IS5',
      'SA1': 'SA2', 'SA2': 'SA1',
      'SA3': 'SA4', 'SA4': 'SA3',
      'SA5': 'SA6', 'SA6': 'SA5'
    };
    
    const pairSeat = seatMap[seat];
    return pairSeat ? `${prefix}_${pairSeat}` : undefined;
  };

  // Koltuk render fonksiyonu
  const renderSeat = (seatId: string) => {
    const isDoubleSeat = selectedBoat?.seatingLayout === 'double';
    const isOccupied = occupiedSeats.includes(seatId);
    const isSelected = selectedSeats.includes(seatId);
    
    const handleSeatClick = () => {
      if (isSpecialTour(tourType)) return;
      
      if (!isOccupied) {
        if (isSelected) {
          setSelectedSeats(selectedSeats.filter(seat => seat !== seatId));
        } else if (selectedSeats.length < getRequiredSeatCount()) {
          setSelectedSeats([...selectedSeats, seatId]);
          setTimeout(() => scrollToContinueButton(), 300);
        }
      }
    };
    
    if (isDoubleSeat) {
      // 2. Tekne: Çiftli görünüm ama bağımsız seçim
      const pairSeat = getSeatPair(seatId);
      const isPairSelected = pairSeat ? selectedSeats.includes(pairSeat) : false;
      const isPairOccupied = pairSeat ? occupiedSeats.includes(pairSeat) : false;
      
      // Çiftli görünümde sadece çift numaralı koltukları render et (boat1_IS2, boat1_IS4, boat1_IS6, etc.)
      // Her çift koltuk içinde hem tek (boat1_IS1) hem çift (boat1_IS2) butonları olacak
      const seatNumber = seatId.split('_')[1]; // boat1_IS2 -> IS2
      const isEvenSeat = parseInt(seatNumber.slice(-1)) % 2 === 0; // IS2 -> 2 -> çift
      if (!isEvenSeat) return null; // Tek numaralı koltuklarda render yapma, çift olanında ikisini birden göster
      
      const oddSeat = getSeatPair(seatId); // IS1, IS3, IS5, SA1, SA3, SA5
      const oddIsSelected = selectedSeats.includes(oddSeat || '');
      const oddIsOccupied = occupiedSeats.includes(oddSeat || '');
      
      return (
        <div key={seatId} className="w-8 h-16 sm:w-9 sm:h-18 md:w-10 md:h-20 rounded-lg md:rounded-xl overflow-hidden shadow-lg border-2 border-gray-300 bg-white">
          {/* Üst koltuk (tek numaralı) */}
          <button
            onClick={() => {
              if (isSpecialTour(tourType) || !oddSeat) return;
              
              if (!oddIsOccupied) {
                if (oddIsSelected) {
                  setSelectedSeats(selectedSeats.filter(seat => seat !== oddSeat));
                } else if (selectedSeats.length < getRequiredSeatCount()) {
                  setSelectedSeats([...selectedSeats, oddSeat]);
                  setTimeout(() => scrollToContinueButton(), 300);
                }
              }
            }}
            disabled={oddIsOccupied || isSpecialTour(tourType)}
            className={`w-full h-1/2 flex items-center justify-center text-white text-xs font-bold transition-all duration-300 ${getSeatColor(oddIsSelected ? 'selected' : oddIsOccupied ? 'occupied' : 'available')} ${
              oddIsOccupied || isSpecialTour(tourType) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
            }`}
            title={
              isSpecialTour(tourType)
                ? `${getTourDisplayName(tourType)} - tüm koltuklar otomatik seçilmiştir`
                : oddIsOccupied 
                ? `${oddSeat} koltuğu dolu` 
                : oddIsSelected 
                ? `${oddSeat} seçimini kaldır`
                : `${oddSeat} koltuğunu seç`
            }
          >
            <div className="relative flex items-center justify-center">
              <span className="relative z-10">{oddSeat?.split('_')[1]?.slice(-1)}</span>
              <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-4 h-0.5 bg-black/30 rounded-full"></div>
            </div>
          </button>
          
          {/* Alt koltuk (çift numaralı) */}
          <button
            onClick={handleSeatClick}
            disabled={isOccupied || isSpecialTour(tourType)}
            className={`w-full h-1/2 flex items-center justify-center text-white text-xs font-bold transition-all duration-300 ${getSeatColor(isSelected ? 'selected' : isOccupied ? 'occupied' : 'available')} ${
              isOccupied || isSpecialTour(tourType) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
            }`}
            title={
              isSpecialTour(tourType)
                ? `${getTourDisplayName(tourType)} - tüm koltuklar otomatik seçilmiştir`
                : isOccupied 
                ? `${seatId} koltuğu dolu` 
                : isSelected 
                ? `${seatId} seçimini kaldır`
                : `${seatId} koltuğunu seç`
            }
          >
            <div className="relative flex items-center justify-center">
              <span className="relative z-10">{seatId.split('_')[1]?.slice(-1)}</span>
              <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-4 h-0.5 bg-black/30 rounded-full"></div>
            </div>
          </button>
        </div>
      );
    } else {
      // 1. Tekne: Normal tekli koltuk
      return (
        <button
          key={seatId}
          onClick={handleSeatClick}
          disabled={isOccupied || isSpecialTour(tourType)}
          className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center text-white text-xs sm:text-sm font-bold transition-all duration-300 shadow-lg border-2 ${getSeatColor(getSeatStatus(seatId))} ${
            isOccupied || isSpecialTour(tourType) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
          }`}
          title={
            isSpecialTour(tourType)
              ? `${getTourDisplayName(tourType)} - tüm koltuklar otomatik seçilmiştir`
              : isOccupied 
              ? `${seatId} koltuğu dolu` 
              : isSelected 
              ? `${seatId} seçimini kaldır`
              : `${seatId} koltuğunu seç`
          }
        >
          <div className="relative flex items-center justify-center">
            <span className="relative z-10">{seatId.slice(-1)}</span>
            <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-black/30 rounded-full"></div>
          </div>
        </button>
      );
    }
  };

  // Seçili tarih için seans bazlı doluluk bilgisini çek (tekne bazlı)
  const fetchSessionOccupancy = async (date: string) => {
    if (!date || !selectedBoat?.id) {
      console.log('❌ fetchSessionOccupancy: Tarih veya tekne eksik', { date, boatId: selectedBoat?.id });
      return;
    }
    
    console.log(`🔍 fetchSessionOccupancy başlatılıyor - Tarih: ${date}, Tekne: ${selectedBoat.name} (${selectedBoat.id})`);
    console.log(`🔍 Arama kriterleri:`, {
      selectedDate: date,
      selectedBoat: selectedBoat.id,
      query: `where('selectedDate', '==', '${date}') AND where('selectedBoat', '==', '${selectedBoat.id}')`
    });
    
    try {
      const q = query(
        collection(db, 'reservations'),
        where('selectedDate', '==', date),
        where('selectedBoat', '==', selectedBoat.id) // Sadece seçili tekneye ait rezervasyonlar
      );
      
      const querySnapshot = await getDocs(q);
      console.log(`📊 Rezervasyon sorgusu tamamlandı - ${querySnapshot.size} rezervasyon bulundu`);
      
      const sessionOccupancyMap: {[key: string]: number} = {};
      
      // Önce tüm mevcut saatleri 0 ile başlat
      availableTimes.forEach(time => {
        sessionOccupancyMap[time] = 0;
      });
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`📋 Rezervasyon kontrol ediliyor:`, {
          id: doc.id,
          status: data.status,
          selectedTime: data.selectedTime,
          isPrivateTour: data.isPrivateTour,
          selectedSeats: data.selectedSeats
        });
        
        // Sadece onaylı ve bekleyen rezervasyonları dikkate al
        if ((data.status === 'confirmed' || data.status === 'pending') && data.selectedTime) {
          // Bu saat için doluluk başlat (eğer yoksa)
          if (!sessionOccupancyMap[data.selectedTime]) {
            sessionOccupancyMap[data.selectedTime] = 0;
            console.log(`⚠️ Rezervasyon saati availableTimes'da yok: ${data.selectedTime}. AvailableTimes:`, availableTimes);
          }
          
          if (data.isPrivateTour) {
            // Özel tur: tüm tekneyi kaplar (12 koltuk)
            console.log(`🔴 Özel tur bulundu - ${data.selectedTime}: 12 koltuk`);
            sessionOccupancyMap[data.selectedTime] = 12;
          } else if (data.selectedSeats && Array.isArray(data.selectedSeats)) {
            // Normal tur: koltuk sayısı kadar
            const currentOccupancy = sessionOccupancyMap[data.selectedTime] || 0;
            const newOccupancy = currentOccupancy + data.selectedSeats.length;
            console.log(`🟡 Normal tur bulundu - ${data.selectedTime}: ${data.selectedSeats.length} koltuk (toplam: ${newOccupancy})`);
            sessionOccupancyMap[data.selectedTime] = Math.min(newOccupancy, 12);
          }
        } else {
          console.log(`⚠️ Rezervasyon atlandı - Status: ${data.status}, Time: ${data.selectedTime}`);
        }
      });
      
      console.log(`✅ Session occupancy hesaplandı:`, sessionOccupancyMap);
      
      // Tekne bazlı state güncelle
      setSessionOccupancy(prev => ({
        ...prev,
        [selectedBoat.id]: sessionOccupancyMap
      }));
      
      console.log(`🎯 Session occupancy state güncellendi - Tekne: ${selectedBoat.id}`);
    } catch (error) {
      console.error('❌ Seans doluluk bilgisi çekilemedi:', error);
    }
  };

  // Dolu koltukları çek - SADECE SEÇİLİ TEKNE İÇİN
  const fetchOccupiedSeats = async (date: string, time: string) => {
    if (!date || !time || !selectedBoat?.id) return;
    
    try {
      // Sadece seçili tekne için rezervasyonları çek
      const q = query(
        collection(db, 'reservations'),
        where('selectedDate', '==', date),
        where('selectedTime', '==', time),
        where('selectedBoat', '==', selectedBoat.id)
      );
      
      const querySnapshot = await getDocs(q);
      const occupied: string[] = [];
      const currentBoatOrder = getBoatOrder(selectedBoat.id);
      const currentPrefix = `${currentBoatOrder}_`;
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Sadece onaylı ve bekleyen rezervasyonları dikkate al
        if (data.status === 'confirmed' || data.status === 'pending') {
          // TUR TİPİ KONTROLÜ: 
          const reservationTourType = data.tourType || 'normal';
          
          // Özel tur seçildiğinde TÜM rezervasyonları say (çünkü tüm tekneyi etkiler)
          // Normal tur seçildiğinde sadece aynı tur tipindeki rezervasyonları say
          if (!isSpecialTour(tourType) && reservationTourType !== tourType) {
            return; // Bu rezervasyonu atla
          }
          
          if (data.selectedSeats && Array.isArray(data.selectedSeats)) {
            // Sadece bu tekneye ait koltukları ekle
            data.selectedSeats.forEach((seat: string) => {
              if (seat.startsWith(currentPrefix) || (!seat.includes('_') && currentBoatOrder === 'T1')) {
                occupied.push(seat);
              }
            });
          }
          
          if (data.isPrivateTour && data.selectedBoat === selectedBoat.id) {
            // Özel tur için sadece bu teknenin tüm koltukları dolu sayılır
            const allSeats = [
              `${currentPrefix}IS1`, `${currentPrefix}IS2`, `${currentPrefix}IS3`, `${currentPrefix}IS4`, `${currentPrefix}IS5`, `${currentPrefix}IS6`,
              `${currentPrefix}SA1`, `${currentPrefix}SA2`, `${currentPrefix}SA3`, `${currentPrefix}SA4`, `${currentPrefix}SA5`, `${currentPrefix}SA6`
            ];
            allSeats.forEach(seat => {
              if (!occupied.includes(seat)) {
                occupied.push(seat);
              }
            });
          }
        }
      });
      
      setOccupiedSeats(occupied);
    } catch (error) {
      console.error('Dolu koltuklar çekilemedi:', error);
    }
  };

  // Tarih ve saat seçildiğinde dolu koltukları çek ve real-time dinle
  useEffect(() => {
    if (selectedDate && selectedTime && tourType === 'normal') {
      // Promise rejection'ını yakala
      fetchOccupiedSeats(selectedDate, selectedTime).catch((error) => {
        console.error('fetchOccupiedSeats Promise hatası:', error);
      });

      const q = query(
        collection(db, 'reservations'),
        where('selectedDate', '==', selectedDate),
        where('selectedTime', '==', selectedTime)
      );

      const unsubscribe = createResilientListener(
        q,
        (snapshot) => {
          const occupied: string[] = [];
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            // Sadece onaylı ve bekleyen rezervasyonları dikkate al
            if (data.status === 'confirmed' || data.status === 'pending') {
              // TUR TİPİ KONTROLÜ: 
              const reservationTourType = data.tourType || 'normal';
              
              // Özel tur seçildiğinde TÜM rezervasyonları say (çünkü tüm tekneyi etkiler)
              // Normal tur seçildiğinde sadece aynı tur tipindeki rezervasyonları say
              if (!isSpecialTour(tourType) && reservationTourType !== tourType) {
                return; // Bu rezervasyonu atla
              }
              
              if (data.selectedSeats && Array.isArray(data.selectedSeats)) {
                occupied.push(...data.selectedSeats);
              }
              
              if (data.isPrivateTour && data.selectedBoat) {
                // Özel tur için ilgili teknenin tüm koltukları dolu sayılır
                const boatId = data.selectedBoat;
                const boatOrder = getBoatOrder(boatId);
                const prefix = `${boatOrder}_`;
                const allSeats = [
                  `${prefix}IS1`, `${prefix}IS2`, `${prefix}IS3`, `${prefix}IS4`, `${prefix}IS5`, `${prefix}IS6`,
                  `${prefix}SA1`, `${prefix}SA2`, `${prefix}SA3`, `${prefix}SA4`, `${prefix}SA5`, `${prefix}SA6`
                ];
                allSeats.forEach(seat => {
                  if (!occupied.includes(seat)) {
                    occupied.push(seat);
                  }
                });
              }
            }
          });
          
          setOccupiedSeats(occupied);
        },
        (error) => {
          console.error('Rezervasyon dinleme hatası:', error);
          // Hata durumunda boş array set et
          setOccupiedSeats([]);
        }
      );

      return () => unsubscribe();
    } else {
      setOccupiedSeats([]);
      // Özel tur için koltukları sıfırlamayalım
      if (tourType === 'normal') {
        setSelectedSeats([]);
      }
    }
  }, [selectedDate, selectedTime, tourType]);

  // Özel tur seçildiğinde tüm koltukları seç
  useEffect(() => {
    if (isSpecialTour(tourType) && selectedBoat) {
      // Seçili tekneye özel okunakli koltuk ID'lerini kullan
      const boatOrder = getBoatOrder(selectedBoat.id);
      const prefix = `${boatOrder}_`;
      const allSeats = [
        `${prefix}IS1`, `${prefix}IS2`, `${prefix}IS3`, `${prefix}IS4`, `${prefix}IS5`, `${prefix}IS6`,
        `${prefix}SA1`, `${prefix}SA2`, `${prefix}SA3`, `${prefix}SA4`, `${prefix}SA5`, `${prefix}SA6`
      ];
      setSelectedSeats(allSeats);
    } else {
      setSelectedSeats([]);
    }
  }, [tourType, selectedBoat, customTours]); // selectedBoat dependency eklendi

  // Özel tur için tarih seçildiğinde de koltukları seç
  useEffect(() => {
    if (isSpecialTour(tourType) && selectedDate && selectedBoat) {
      // Seçili tekneye özel okunakli koltuk ID'lerini kullan
      const boatOrder = getBoatOrder(selectedBoat.id);
      const prefix = `${boatOrder}_`;
      const allSeats = [
        `${prefix}IS1`, `${prefix}IS2`, `${prefix}IS3`, `${prefix}IS4`, `${prefix}IS5`, `${prefix}IS6`,
        `${prefix}SA1`, `${prefix}SA2`, `${prefix}SA3`, `${prefix}SA4`, `${prefix}SA5`, `${prefix}SA6`
      ];
      setSelectedSeats(allSeats);
    }
  }, [selectedDate, tourType, selectedBoat, customTours]); // selectedBoat dependency eklendi

  // Tarih veya tekne değiştiğinde session occupancy'yi çek
  useEffect(() => {
    if (selectedDate && selectedBoat?.id) {
      console.log(`🔄 Session occupancy çekiliyor - Tarih: ${selectedDate}, Tekne: ${selectedBoat.name}`);
      fetchSessionOccupancy(selectedDate).catch(error => {
        console.error('Session occupancy fetch error:', error);
      });
    } else {
      setSessionOccupancy({});
    }
  }, [selectedDate, selectedBoat?.id]);

  // Tekne değiştiğinde seçili tarihin geçerliliğini kontrol et
  useEffect(() => {
    if (selectedBoat && selectedDate) {
      // Eğer seçili tarih bu tekne için geçerli değilse tarihi temizle
      if (!isDateSelectable(selectedDate)) {
        setSelectedDate('');
        setSelectedTime('');
        setSelectedSeats([]);
        // Kullanıcıyı bilgilendir
        alert(`📅 Seçili tarih bu tekne için uygun değil!\n\nTekne: ${selectedBoat.name}\n\nLütfen bu tekne için uygun bir tarih seçin.`);
      }
    }
  }, [selectedBoat?.id]); // Sadece tekne değiştiğinde çalış

  // Rezervasyon kaydetme
  const saveReservation = async (retryCount = 0) => {
    // Telefon numarası validasyonu
    const phoneValidation = validatePhoneNumber(guestInfo.phone);
    if (!phoneValidation.isValid) {
      alert(`Telefon numarası hatası: ${phoneValidation.message}`);
      return;
    }
    
    setLoading(true);
    try {
      // ⛔ Güvenlik: Tekne + Tarih + Tur tipi için özel program tanımlıysa, seçilen saat bu programda olmalı
      if (selectedBoat?.id && selectedDate && selectedTime && tourType) {
        try {
          const scheduleId = `${selectedBoat.id}_${selectedDate}_${tourType || 'normal'}`;
          const bsDoc = await getDoc(doc(db, 'boatSchedules', scheduleId));
          if (bsDoc.exists()) {
            const data = bsDoc.data() as any;
            if (!data.enabled) {
              console.log('Pasif program tespit edildi:', {
                scheduleId,
                tekne: selectedBoat?.name,
                tarih: selectedDate,
                turTipi: tourType,
                data: data
              });
              // GEÇİCİ: Bu kontrolü devre dışı bırak
              console.warn('⚠️ GEÇİCİ: Pasif program kontrolü atlandı, rezervasyon devam ediyor...');
              // alert(`Bu tarih ve tur tipi için özel program pasif.\n\nTekne: ${selectedBoat?.name}\nTarih: ${selectedDate}\nTur Tipi: ${tourType}\n\nAdmin panelinden bu programı aktif hale getirebilirsiniz.`);
              // setLoading(false);
              // return;
            }
            const allowedTimes: string[] = (data.timeSlots || [])
              .filter((slot: any) => slot.start && slot.end)
              .map((slot: any) => `${slot.start}-${slot.end}`);
            if (allowedTimes.length > 0 && !allowedTimes.includes(selectedTime)) {
              console.log('Uygun olmayan saat tespit edildi:', {
                secilenSaat: selectedTime,
                uygunSaatler: allowedTimes,
                scheduleId,
                tekne: selectedBoat?.name
              });
              // GEÇİCİ: Bu kontrolü de devre dışı bırak
              console.warn('⚠️ GEÇİCİ: Saat uygunluk kontrolü atlandı, rezervasyon devam ediyor...');
              // alert(`Seçtiğiniz saat bu tur tipi ve tekne için uygun değil. Uygun saatler: ${allowedTimes.join(', ')}`);
              // setLoading(false);
              // return;
            }
          }
        } catch (guardErr) {
          console.warn('boatSchedules guard kontrolünde hata:', guardErr);
        }
      }

      // ✅ ÇAKIŞMA KONTROLÜ - Aynı tarih/saat/koltuk var mı?
      if (tourType === 'normal' && selectedSeats.length > 0) {
        const conflictQuery = query(
          collection(db, 'reservations'),
          where('selectedDate', '==', selectedDate),
          where('selectedTime', '==', selectedTime),
          where('status', 'in', ['pending', 'confirmed']) // Pending ve confirmed'ı kontrol et
        );
        
        const conflictSnapshot = await getDocs(conflictQuery);
        const conflictingSeats: string[] = [];
        
        conflictSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.selectedSeats && Array.isArray(data.selectedSeats)) {
            conflictingSeats.push(...data.selectedSeats);
          }
        });
        
        // Seçilen koltuklar ile mevcut rezervasyonlar çakışıyor mu?
        const hasConflict = selectedSeats.some(seat => conflictingSeats.includes(seat));
        
        if (hasConflict) {
          const conflictingSeatsStr = selectedSeats.filter(seat => conflictingSeats.includes(seat)).join(', ');
          alert(`❌ Koltuk Çakışması!\n\nSeçtiğiniz koltuklar (${conflictingSeatsStr}) bu tarih ve saatte başka bir rezervasyonda bulunuyor.\n\nLütfen farklı koltuklar seçin veya başka bir tarih/saat tercih edin.`);
          setLoading(false);
          return;
        }
      }
      
      // ✅ ÖZEL TUR ÇAKIŞMA KONTROLÜ (SADECE AYNI TEKNE)
      if (isSpecialTour(tourType)) {
        const specialTourQuery = query(
          collection(db, 'reservations'),
          where('selectedDate', '==', selectedDate),
          where('selectedTime', '==', selectedTime),
          where('selectedBoat', '==', selectedBoat.id), // Sadece aynı tekne
          where('status', 'in', ['pending', 'confirmed'])
        );
        
        const specialSnapshot = await getDocs(specialTourQuery);
        
        if (!specialSnapshot.empty) {
          alert(`❌ Tarih/Saat Çakışması!\n\nBu tarih ve saatte başka bir rezervasyon bulunuyor.\n\nÖzel turlar için tamamen boş tarih/saat gereklidir.\n\nLütfen farklı bir tarih veya saat seçin.`);
          setLoading(false);
          return;
        }
      }
      
      const isSpecial = isSpecialTour(tourType);
      const customTour = getSelectedCustomTour(tourType);
      
      // Rezervasyon numarası üretme
      const generateReservationNumber = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 9000) + 1000;
        return `RV-${year}${month}${day}-${random}`;
      };
      
      // Fiyat hesaplama
      let selectedPrice = 0;
      let priceDetails = '';
      let capacity = 12; // Varsayılan kapasite
      let totalAmount = 0;
      let ageBasedBreakdown = null;
      
      if (tourType === 'normal') {
        // Esnek olta sistemi kullan
        const priceCalculation = calculateFlexiblePrice();
        selectedPrice = 0; // Artık tek bir fiyat yok, esnek sistem var
        priceDetails = 'Normal Tur - Esnek Olta Seçimi';
        totalAmount = priceCalculation ? priceCalculation.totalPrice : 0;
        ageBasedBreakdown = priceCalculation ? priceCalculation.breakdown : null;
      } else if (tourType === 'private') {
        selectedPrice = prices.privateTour;
        priceDetails = 'Kapalı Tur (Özel) - Tüm Tekne';
        totalAmount = selectedPrice;
      } else if (tourType === 'fishing-swimming') {
        selectedPrice = prices.fishingSwimming;
        priceDetails = 'Balık + Yüzme Turu - 6 Saat';
        totalAmount = selectedPrice;
      } else if (customTour) {
        selectedPrice = customTour.price;
        priceDetails = `${customTour.name} - ${customTour.duration}`;
        capacity = customTour.capacity;
        totalAmount = selectedPrice;
      }
      
      const reservationData = {
        tourType,
        selectedBoat: selectedBoat?.id, // Sadece ID'sini kaydediyoruz
        boatName: boatName,
        reservationNumber: generateReservationNumber(),
        guestCount: isSpecial ? capacity : getTotalGuestCount(),
        selectedDate,
        selectedTime: selectedTime, // Kullanıcının seçtiği saat dilimi her zaman korunur
        isPrivateTour: isSpecial,
        selectedSeats: selectedSeats,
        guestInfos: [guestInfo],
        status: 'pending',
        paymentStatus: 'waiting',
        priceOption: tourType === 'normal' ? priceOption : 'with-equipment',
        selectedPrice: selectedPrice,
        priceDetails: priceDetails,
        totalAmount: totalAmount,
        createdAt: new Date(),
        // Yaş grubu bilgileri (sadece normal tur için)
        ...(tourType === 'normal' && {
          ageGroups: ageGroups,
          ageBasedPricing: ageBasedBreakdown,
          equipmentChoices: equipmentChoices
        }),
        // Custom tur detayları
        ...(customTour && {
          customTourDetails: {
            id: customTour.id,
            name: customTour.name,
            price: customTour.price,
            capacity: customTour.capacity,
            duration: customTour.duration,
            description: customTour.description
          }
        })
      };

      await addDoc(collection(db, 'reservations'), reservationData);
      setCurrentStep(6); // Başarı sayfası
    } catch (error: any) {
      console.error('Rezervasyon kaydedilemedi:', error);
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        stack: error?.stack,
        userAgent: navigator?.userAgent,
        timestamp: new Date().toISOString(),
        reservationData: {
          tourType,
          selectedDate,
          selectedTime,
          guestInfo: {
            name: guestInfo.name,
            surname: guestInfo.surname,
            phone: guestInfo.phone,
            email: guestInfo.email
          }
        }
      });
      
      // Daha kullanıcı dostu hata mesajı
      let errorMessage = 'Rezervasyon sırasında bir hata oluştu.';
      
      if (error?.code === 'permission-denied') {
        errorMessage = 'İzin hatası. Lütfen sayfayı yenileyip tekrar deneyin.';
      } else if (error?.code === 'unavailable') {
        errorMessage = 'Bağlantı sorunu. İnternet bağlantınızı kontrol edip tekrar deneyin.';
      } else if (error?.message?.includes('network')) {
        errorMessage = 'Ağ bağlantısı sorunu. Lütfen tekrar deneyin.';
      }
      
      // Mobil cihazlarda ağ sorunları için retry mekanizması
      if (retryCount < 2 && (
        error?.code === 'unavailable' || 
        error?.message?.includes('network') ||
        error?.message?.includes('timeout')
      )) {
        console.log(`Rezervasyon kaydı tekrar deneniyor... (${retryCount + 1}/3)`);
        setLoading(false);
        setTimeout(() => {
          saveReservation(retryCount + 1);
        }, 1000 * (retryCount + 1)); // Artan gecikme: 1s, 2s
        return;
      }
      
      alert(`${errorMessage}\n\nHata devam ederse lütfen WhatsApp ile iletişime geçin: +90 531 089 25 37`);
    } finally {
      setLoading(false);
    }
  };

  const calendarDays = getCalendarDays(currentMonth);

  // Belirli tarihin seçilebilir olup olmadığını kontrol et
  const isDateSelectable = (dateString: string) => {
    // Sadece teknenin tarih aralığı kontrolü
    if (selectedBoat && selectedBoat.dateRange?.enabled) {
      return isDateInBoatRange(dateString, selectedBoat);
    }
    
    return true; // Hiçbir kısıtlama yoksa seçilebilir
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-8 sm:py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <Link href="/" className="inline-block mb-4 sm:mb-6 text-blue-100 hover:text-white transition-colors text-sm sm:text-base">
            ← Ana Sayfaya Dön
          </Link>
          <h1 className="text-2xl sm:text-4xl font-bold mb-2 sm:mb-4">🎣 Randevu Al</h1>
          <p className="text-base sm:text-xl text-blue-100">
            Basit adımlarla rezervasyon yapın
          </p>
        </div>
      </div>

      {/* Adım İndikatörü */}
      <div className="max-w-2xl mx-auto px-4 py-4 sm:py-8">
        <div className="flex items-center justify-center mb-4 sm:mb-8">
          {[1, 2, 3, 4, 5].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm sm:text-base ${
                currentStep >= step 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {step}
              </div>
              {step < 5 && (
                <div className={`w-8 sm:w-16 h-1 ${
                  currentStep > step ? 'bg-green-500' : 'bg-gray-200'
                }`}></div>
              )}
            </div>
          ))}
        </div>

        {/* Form İçeriği */}
        <div className="bg-white rounded-xl sm:rounded-3xl shadow-2xl p-4 sm:p-8 border border-blue-200">

          {/* Adım 1: Tekne Seçimi */}
          {currentStep === 1 && (
            <div className="text-center">
              <h2 className="text-xl sm:text-3xl font-bold text-slate-800 mb-2 sm:mb-4">
                🚢 Tekne Seçimi
              </h2>
              <p className="text-slate-600 mb-4 sm:mb-6 text-sm sm:text-base">
                Balık avı için hangi teknemizi tercih edersiniz?
              </p>
              
              {/* Seçili tarih bilgisi */}
              {selectedDate && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 max-w-md mx-auto">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.89-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.11-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                    </svg>
                    <p className="text-blue-700 font-bold text-sm">
                      Seçili Tarih: {new Date(selectedDate).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                  <p className="text-blue-600 text-xs text-center">
                    Bu tarih için uygun tekneler gösteriliyor
                  </p>
                  {getAvailableBoatsForDate(selectedDate).length < boats.length && (
                    <p className="text-orange-600 text-xs text-center mt-1">
                      ⚠️ {boats.length - getAvailableBoatsForDate(selectedDate).length} tekne bu tarih için uygun değil
                    </p>
                  )}
                </div>
              )}

              {loading ? (
                <div className="py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Tekneler yükleniyor...</p>
                </div>
              ) : boatsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
                  {/* Skeleton Loading - 2 tekne placeholder */}
                  {[1, 2].map((index) => (
                    <div key={index} className="bg-white border-2 border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 animate-pulse">
                      {/* Image skeleton */}
                      <div className="aspect-video w-full bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl mb-4"></div>
                      
                      {/* Title skeleton */}
                      <div className="h-6 bg-gray-200 rounded-lg mb-3 w-3/4"></div>
                      
                      {/* Description skeleton */}
                      <div className="space-y-2 mb-4">
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      </div>
                      
                      {/* Button skeleton */}
                      <div className="h-12 bg-gray-200 rounded-lg w-full"></div>
                    </div>
                  ))}
                </div>
              ) : boats.length === 0 ? (
                <div className="py-8">
                  <div className="text-6xl mb-4">❌</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Tekne Bulunamadı</h3>
                  <p className="text-gray-600">Lütfen admin panelden tekne ekleyin.</p>
                  <p className="text-sm text-gray-500 mt-2">(/admin/boats adresinden ekleyebilirsiniz)</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
                  {boats
                    .filter(boat => 
                      (boat.isActive || boat.status === 'coming-soon') && // ✅ Aktif tekneler + "Çok yakında" tekneler
                      (!selectedDate || isDateInBoatRange(selectedDate, boat))
                    )
                    .map((boat) => (
                    <button
                      key={boat.id}
                      onClick={() => {
                        // "Çok yakında" teknesi kontrolü
                        if (boat.status === 'coming-soon') {
                          alert(`🚢 ${boat.name}\n\n${boat.statusMessage || 'Bu tekne çok yakında hizmetinizde olacak!'}\n\nŞu anda rezervasyon alınmamaktadır.`);
                          return;
                        }
                        
                        if (selectedDate && !isDateInBoatRange(selectedDate, boat)) {
                          alert(`📅 Bu tekne seçili tarih için uygun değil.\n\nTekne: ${boat.name}\nSeçili Tarih: ${new Date(selectedDate).toLocaleDateString('tr-TR')}\n\nLütfen farklı bir tarih seçin veya başka bir tekne tercih edin.`);
                          return;
                        }
                        handleSelectBoat(boat.id);
                      }}
                      className={`relative flex flex-col items-start rounded-xl overflow-hidden border-2 transition-all duration-300 transform hover:scale-103 ${
                        boat.status === 'coming-soon'
                          ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50 shadow-md'
                          : selectedDate && !isDateInBoatRange(selectedDate, boat)
                          ? 'border-red-300 bg-red-50 opacity-60 cursor-not-allowed'
                          : selectedBoat?.id === boat.id
                          ? 'border-blue-500 bg-blue-50 shadow-lg'
                          : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                        }
                      ${(boat.status && boat.status !== 'active') || !boat.isActive ? 'opacity-60 cursor-not-allowed' : ''}
                      ${boat.status === 'coming-soon' ? 'border-blue-400 bg-blue-50' : ''}
                      ${boat.status === 'maintenance' ? 'border-yellow-400 bg-yellow-50' : ''}
                      `}
                      disabled={(boat.status && boat.status !== 'active') || !boat.isActive || (selectedDate && !isDateInBoatRange(selectedDate, boat))}
                    >
                      {(boat.status && boat.status !== 'active') || !boat.isActive ? (
                        <div className={`absolute inset-0 flex items-center justify-center rounded-xl z-10 ${
                          boat.status === 'coming-soon' ? 'bg-blue-500 bg-opacity-80' :
                          boat.status === 'maintenance' ? 'bg-yellow-500 bg-opacity-80' :
                          'bg-black bg-opacity-40'
                        }`}>
                          <div className="text-center text-white font-bold drop-shadow-lg px-4">
                            {boat.status === 'coming-soon' && (
                              <>
                                <div className="text-2xl mb-1">🔜</div>
                                <div className="text-lg mb-1">YAKINDA</div>
                                {boat.statusMessage && (
                                  <div className="text-sm font-normal opacity-90">{boat.statusMessage}</div>
                                )}
                              </>
                            )}
                            {boat.status === 'maintenance' && (
                              <>
                                <div className="text-2xl mb-1">🔧</div>
                                <div className="text-lg mb-1">BAKIMDA</div>
                                {boat.statusMessage && (
                                  <div className="text-sm font-normal opacity-90">{boat.statusMessage}</div>
                                )}
                              </>
                            )}
                            {boat.status === 'inactive' && (
                              <>
                                <div className="text-2xl mb-1">❌</div>
                                <div className="text-lg mb-1">PASİF</div>
                                {boat.statusMessage && (
                                  <div className="text-sm font-normal opacity-90">{boat.statusMessage}</div>
                                )}
                              </>
                            )}
                            {(!boat.status || boat.status === 'active') && !boat.isActive && (
                              <span className="text-xl">PASİF</span>
                            )}
                          </div>
                        </div>
                      ) : null}
                      
                      {selectedDate && !isDateInBoatRange(selectedDate, boat) && (
                        <div className="absolute inset-0 bg-red-500 bg-opacity-40 flex items-center justify-center rounded-xl z-10">
                          <div className="text-center text-white font-bold drop-shadow-lg">
                            <div className="text-3xl mb-2">📅</div>
                            <div className="text-lg">TARIH ARALIK</div>
                            <div className="text-lg">DİŞINDA</div>
                          </div>
                        </div>
                      )}
                      <div className="aspect-video w-full overflow-hidden relative">
                        {/* Loading placeholder */}
                        {imageLoadingStates[boat.id] && (
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                              <p className="text-sm text-blue-600">Yükleniyor...</p>
                            </div>
                          </div>
                        )}
                        
                        <Image
                          src={boat.imageUrl}
                          alt={boat.name}
                          fill
                          className={`object-cover transition-all duration-300 hover:scale-110 ${
                            imageLoadingStates[boat.id] ? 'opacity-0' : 'opacity-100'
                          }`}
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          priority={selectedDate ? getAvailableBoatsForDate(selectedDate).length <= 3 : false}
                          onLoad={() => handleImageLoad(boat.id)}
                          onError={() => handleImageError(boat.id)}
                          placeholder="blur"
                          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                        />
                      </div>
                      
                      <div className="p-4 sm:p-5 flex-1 flex flex-col items-start text-left w-full">
                        <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">
                          {boat.name}
                        </h3>
                        <p className="text-slate-600 text-sm sm:text-base mb-4 flex-1">
                          {boat.description}
                        </p>
                        {/* Tarih aralığı uyarısı */}
                        {boat.dateRange?.enabled && (
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.89-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.11-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                              </svg>
                              <span className="text-orange-700 font-medium text-sm">
                                Aktif Tarih Aralığı
                              </span>
                            </div>
                            <p className="text-orange-600 text-xs">
                              {new Date(boat.dateRange.startDate).toLocaleDateString('tr-TR')} - {new Date(boat.dateRange.endDate).toLocaleDateString('tr-TR')}
                            </p>
                            {boat.dateRange.note && (
                              <p className="text-orange-600 text-xs mt-1">
                                💬 {boat.dateRange.note}
                              </p>
                            )}
                          </div>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500 mt-auto pt-4 border-t border-gray-100 w-full">
                          <span className="flex items-center space-x-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h-2A2 2 0 0113 18V8a2 2 0 012-2h2a2 2 0 012 2v10a2 2 0 01-2 2z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20H7a2 2 0 01-2-2V8a2 2 0 012-2h2a2 2 0 012 2v10a2 2 0 01-2 2z" />
                            </svg>
                            <span>{boat.capacity} Kişi</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v2a2 2 0 01-2 2h-4m-6 0H5a2 2 0 01-2-2v-2a2 2 0 012-2h4m6 0a2 2 0 002-2V9a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m-6 0a2 2 0 01-2-2V9a2 2 0 012-2h4a2 2 0 012 2v2" />
                            </svg>
                            <span>
                              {boat.seatingLayout === 'single' ? 'Tekli Koltuk' : 'Çiftli Koltuk'}
                            </span>
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-8 sm:mt-10">
                <button
                  onClick={() => setCurrentStep(2)}
                  disabled={!selectedBoat?.id}
                  className={`px-6 sm:px-8 py-3 rounded-xl font-bold transition-all duration-300 touch-manipulation text-sm sm:text-base ${
                    selectedBoat?.id
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                  Devam Et →
                </button>
              </div>
            </div>
          )}

          {/* Adım 2: Tur Tipi ve Fiyat Seçimi */}
          {currentStep === 2 && (
            <div className="text-center">
              <h2 className="text-xl sm:text-3xl font-bold text-slate-800 mb-2 sm:mb-4">
                Hangi türde bir tur istiyorsunuz?
              </h2>
              <p className="text-slate-600 mb-6 sm:mb-8 text-sm sm:text-base">
                Fiyat seçeneklerimizi inceleyin ve size uygun olanı seçin
              </p>
              
              <div className="grid grid-cols-1 gap-4 sm:gap-6 max-w-6xl mx-auto">

                {/* Dinamik Özel Turlar (en üstte, yeni eklenenler önce) */}
                {customTours
                  .slice()
                  .sort((a, b) => {
                    // createdAt'e göre sırala (yeni -> eski)
                    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return bTime - aTime;
                  })
                  .map((customTour: CustomTour, index: number) => {
                  // 5 farklı renk şeması
                  const colorSchemes = [
                    { 
                      border: 'border-emerald-500', 
                      bg: 'bg-emerald-50', 
                      text: 'text-emerald-600',
                      hover: 'hover:border-emerald-300 hover:bg-emerald-50',
                      emoji: '🌟'
                    },
                    { 
                      border: 'border-rose-500', 
                      bg: 'bg-rose-50', 
                      text: 'text-rose-600',
                      hover: 'hover:border-rose-300 hover:bg-rose-50',
                      emoji: '🎯'
                    },
                    { 
                      border: 'border-amber-500', 
                      bg: 'bg-amber-50', 
                      text: 'text-amber-600',
                      hover: 'hover:border-amber-300 hover:bg-amber-50',
                      emoji: '⚡'
                    },
                    { 
                      border: 'border-indigo-500', 
                      bg: 'bg-indigo-50', 
                      text: 'text-indigo-600',
                      hover: 'hover:border-indigo-300 hover:bg-indigo-50',
                      emoji: '🚀'
                    },
                    { 
                      border: 'border-pink-500', 
                      bg: 'bg-pink-50', 
                      text: 'text-pink-600',
                      hover: 'hover:border-pink-300 hover:bg-pink-50',
                      emoji: '💎'
                    }
                  ];
                  
                  const scheme = colorSchemes[index % colorSchemes.length];
                  
                  return (
                    <div 
                      key={customTour.id}
                      onClick={() => {
                        // Custom turlar koltuk seçilebilir, doluluk kontrolü yapmıyoruz
                        setTourType(customTour.id);
                        // Tur seçiminde hafif scroll yap
                        setTimeout(() => scrollToContinueButton(), 500);
                      }}
                      className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                        tourType === customTour.id
                          ? `${scheme.border} ${scheme.bg} scale-105 shadow-xl`
                          : `border-gray-200 ${scheme.hover}`
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="text-3xl sm:text-4xl">{scheme.emoji}</div>
                          <div className="text-left">
                            <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-1">{customTour.name}</h3>
                            <p className="text-sm sm:text-base text-slate-600 mb-2">
                              {customTour.description || `${customTour.duration} özel tur deneyimi`}
                            </p>
                            <div className="text-xs sm:text-sm text-slate-500">
                              • {customTour.capacity} kişiye kadar • Koltuk seçilebilir • {customTour.duration}
                            </div>
                            {/* Yeni eklenen tur badge'i */}
                            {index === 0 && (
                              <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[10px] sm:text-xs shadow">
                                <span>✨</span>
                                <span>Yeni Eklendi</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl sm:text-3xl font-bold ${scheme.text}`}>
                            {customTour.price.toLocaleString('tr-TR')} TL
                          </div>
                          <div className="text-xs sm:text-sm text-slate-500">grup fiyatı</div>
                          <div className={`text-xs ${scheme.text} font-medium`}>koltuk seçilebilir</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Normal Tur - Kendi Ekipmanı */}
                <div 
                  onClick={() => {
                    setTourType('normal');
                    setPriceOption('own-equipment');
                    // Tur seçiminde hafif scroll yap
                    setTimeout(() => scrollToContinueButton(), 500);
                  }}
                  className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                    tourType === 'normal' && priceOption === 'own-equipment'
                      ? 'border-green-500 bg-green-50 scale-105 shadow-xl'
                      : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-3xl sm:text-4xl">🎣</div>
                      <div className="text-left">
                        <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-1">Normal Tur - Kendi Ekipmanı</h3>
                        <p className="text-sm sm:text-base text-slate-600 mb-2">
                          Kendi oltanızla diğer misafirlerle birlikte katılım
                        </p>
                        <div className="text-xs sm:text-sm text-slate-500">
                          • 1-12 kişi arası • Koltuk bazlı rezervasyon • 07:00-13:00 veya 14:00-20:00
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl sm:text-3xl font-bold text-green-600">{prices.normalOwn.toLocaleString('tr-TR')} TL</div>
                      <div className="text-xs sm:text-sm text-slate-500">kişi başı</div>
                    </div>
                  </div>
                </div>

                {/* Normal Tur - Ekipman Dahil */}
                <div 
                  onClick={() => {
                    setTourType('normal');
                    setPriceOption('with-equipment');
                    // Tur seçiminde hafif scroll yap
                    setTimeout(() => scrollToContinueButton(), 500);
                  }}
                  className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                    tourType === 'normal' && priceOption === 'with-equipment'
                      ? 'border-blue-500 bg-blue-50 scale-105 shadow-xl'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-3xl sm:text-4xl">🐟</div>
                      <div className="text-left">
                        <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-1">Normal Tur - Ekipman Dahil</h3>
                        <p className="text-sm sm:text-base text-slate-600 mb-2">
                          Olta ve ilk takım Balık Sefası tarafından sağlanır
                        </p>
                        <div className="text-xs sm:text-sm text-slate-500">
                          • 1-12 kişi arası • Kaliteli olta, ip, yem dahil • 07:00-13:00 veya 14:00-20:00
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl sm:text-3xl font-bold text-blue-600">{prices.normalWithEquipment.toLocaleString('tr-TR')} TL</div>
                      <div className="text-xs sm:text-sm text-slate-500">kişi başı</div>
                    </div>
                  </div>
                </div>

                {/* Özel Tur */}
                <div 
                  onClick={() => {
                    setTourType('private');
                    // Tur seçiminde hafif scroll yap
                    setTimeout(() => scrollToContinueButton(), 500);
                  }}
                  className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                    tourType === 'private'
                      ? 'border-purple-500 bg-purple-50 scale-105 shadow-xl'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-3xl sm:text-4xl">⭐</div>
                      <div className="text-left">
                        <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-1">Kapalı Tur (Özel)</h3>
                        <p className="text-sm sm:text-base text-slate-600 mb-2">
                          Tüm tekne sadece sizin grubunuz için - 12 olta ve takım dahil
                        </p>
                        <div className="text-xs sm:text-sm text-slate-500">
                          • 12 kişiye kadar • Tüm tekne kiralama • 6 saat (Sabah veya Öğleden sonra seansı)
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl sm:text-3xl font-bold text-purple-600">{prices.privateTour.toLocaleString('tr-TR')} TL</div>
                      <div className="text-xs sm:text-sm text-slate-500">grup fiyatı</div>
                      <div className="text-xs text-purple-600 font-medium">tüm ekipman dahil</div>
                    </div>
                  </div>
                </div>

                {/* Balık + Yüzme Turu */}
                <div 
                  onClick={() => {
                    setTourType('fishing-swimming');
                    // Tur seçiminde hafif scroll yap
                    setTimeout(() => scrollToContinueButton(), 500);
                  }}
                  className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                    tourType === 'fishing-swimming'
                      ? 'border-cyan-500 bg-cyan-50 scale-105 shadow-xl'
                      : 'border-gray-200 hover:border-cyan-300 hover:bg-cyan-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-3xl sm:text-4xl">🏊‍♂️</div>
                      <div className="text-left">
                        <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-1">Balık + Yüzme Turu</h3>
                        <p className="text-sm sm:text-base text-slate-600 mb-2">
                          6 saat - İlk balık avı ardından yüzme keyfi (Özel tur)
                        </p>
                        <div className="text-xs sm:text-sm text-slate-500">
                          • 12 kişiye kadar • Tüm ekipman dahil • Yüzme molası • 6 saat süre
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl sm:text-3xl font-bold text-cyan-600">{prices.fishingSwimming.toLocaleString('tr-TR')} TL</div>
                      <div className="text-xs sm:text-sm text-slate-500">grup fiyatı</div>
                      <div className="text-xs text-cyan-600 font-medium">balık + yüzme</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Yaş Ücretlendirmesi Bilgisi */}
              <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <h4 className="font-bold text-yellow-800 mb-2">👶 Çocuk Ücretlendirmesi</h4>
                <div className="text-sm text-yellow-700 space-y-1">
                  <p>• <strong>0-3 yaş:</strong> Ücretsiz (kucakta)</p>
                  <p>• <strong>3-6 yaş:</strong> Yarım ücret (koltuk gerekli)</p>
                  <p>• <strong>6 yaş üstü:</strong> Tam ücret</p>
                  <p className="text-xs text-yellow-600 mt-2">
                    ⚠️ Tüm çocuklara güvenlik nedeniyle koltuk verilmek zorundadır
                  </p>
                </div>
              </div>

              {/* İkinci Tekne Bilgilendirmesi */}
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <h4 className="font-bold text-blue-800 mb-2">🚤 İkinci Teknemiz</h4>
                <div className="text-sm text-blue-700">
                  <p>📱 <strong>Seçtiğiniz tarih doluysa ikinci teknemiz için bize WhatsApp üzerinden ulaşın.</strong></p>
                  <p className="text-xs text-blue-600 mt-2">
                    💡 Aynı kapasitede ikinci teknemizle size alternatif saatler sunabiliriz
                  </p>
                </div>
              </div>

                              <button
                  data-continue-button
                  onClick={() => {
                    setCurrentStep(3);
                    // Adım geçişinde sayfayı üste scroll yap
                    setTimeout(() => {
                      if (typeof window !== 'undefined') {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }, 100);
                  }}
                  disabled={!tourType}
                  className={`mt-6 sm:mt-8 px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg transition-all duration-300 shadow-lg w-full sm:w-auto ${
                    tourType 
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Devam Et →
                </button>
            </div>
          )}

          {/* Adım 3: Kişi Sayısı (Sadece Normal Tur İçin) */}
          {currentStep === 3 && (
            <div className="text-center">
              {tourType === 'normal' ? (
                <>
                  <h2 className="text-xl sm:text-3xl font-bold text-slate-800 mb-4 sm:mb-6">
                    Kaç kişi katılacaksınız?
                  </h2>
                  
                  <div className="max-w-md mx-auto space-y-6 mb-6 sm:mb-8">
                    {/* Yetişkin (7+ yaş) */}
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-left">
                          <h3 className="text-lg font-bold text-blue-800">👨‍👩‍👦 Yetişkin (7+ yaş)</h3>
                          <p className="text-sm text-blue-600">Tam fiyat</p>
                        </div>
                        <div className="flex items-center space-x-3">
                    <button
                            onClick={() => setAgeGroups(prev => ({
                              ...prev,
                              adults: Math.max(1, prev.adults - 1)
                            }))}
                            className="w-8 h-8 bg-red-500 text-white rounded-full font-bold hover:bg-red-600 transition-all duration-300"
                    >
                      -
                    </button>
                          <span className="text-xl font-bold text-blue-800 w-8 text-center">{ageGroups.adults}</span>
                          <button
                            onClick={() => setAgeGroups(prev => ({
                              ...prev,
                              adults: Math.min(12 - prev.children - prev.babies, prev.adults + 1)
                            }))}
                            className="w-8 h-8 bg-green-500 text-white rounded-full font-bold hover:bg-green-600 transition-all duration-300"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Çocuk (3-6 yaş) */}
                    <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-left">
                          <h3 className="text-lg font-bold text-orange-800">👶 Çocuk (3-6 yaş)</h3>
                          <p className="text-sm text-orange-600">%50 indirimli</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => setAgeGroups(prev => ({
                              ...prev,
                              children: Math.max(0, prev.children - 1)
                            }))}
                            className="w-8 h-8 bg-red-500 text-white rounded-full font-bold hover:bg-red-600 transition-all duration-300"
                          >
                            -
                          </button>
                          <span className="text-xl font-bold text-orange-800 w-8 text-center">{ageGroups.children}</span>
                          <button
                            onClick={() => setAgeGroups(prev => ({
                              ...prev,
                              children: Math.min(12 - prev.adults - prev.babies, prev.children + 1)
                            }))}
                            className="w-8 h-8 bg-green-500 text-white rounded-full font-bold hover:bg-green-600 transition-all duration-300"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Bebek (0-3 yaş) */}
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-left">
                          <h3 className="text-lg font-bold text-green-800">🍼 Bebek (0-3 yaş)</h3>
                          <p className="text-sm text-green-600">Ücretsiz</p>
                        </div>
                        <div className="flex items-center space-x-3">
                    <button
                            onClick={() => setAgeGroups(prev => ({
                              ...prev,
                              babies: Math.max(0, prev.babies - 1)
                            }))}
                            className="w-8 h-8 bg-red-500 text-white rounded-full font-bold hover:bg-red-600 transition-all duration-300"
                          >
                            -
                          </button>
                          <span className="text-xl font-bold text-green-800 w-8 text-center">{ageGroups.babies}</span>
                          <button
                            onClick={() => setAgeGroups(prev => ({
                              ...prev,
                              babies: Math.min(12 - prev.adults - prev.children, prev.babies + 1)
                            }))}
                            className="w-8 h-8 bg-green-500 text-white rounded-full font-bold hover:bg-green-600 transition-all duration-300"
                    >
                      +
                    </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Toplam özet ve fiyat */}
                  <div className="bg-slate-100 border-2 border-slate-300 rounded-xl p-4 mb-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">📊 Rezervasyon Özeti</h3>
                    <div className="text-slate-700 space-y-2">
                      <p><strong>{getTotalGuestCount()} kişi</strong> katılacak</p>
                      <div className="text-sm space-y-1">
                        {ageGroups.adults > 0 && <p>• {ageGroups.adults} Yetişkin</p>}
                        {ageGroups.children > 0 && <p>• {ageGroups.children} Çocuk (%50 indirimli)</p>}
                        {ageGroups.babies > 0 && <p>• {ageGroups.babies} Bebek (ücretsiz)</p>}
                      </div>
                      
                      {/* Fiyat hesaplama */}
                      {(() => {
                        const priceInfo = getCurrentPrice();
                        if (!priceInfo) return null;
                        
                        return (
                          <div className="mt-3 pt-3 border-t border-slate-300">
                            <div className="space-y-1 text-sm">
                              {/* Yetişkin Ekipman Dahil */}
                              {priceInfo.breakdown.adults.withEquipment.count > 0 && (
                                <div className="flex justify-between">
                                  <span>{priceInfo.breakdown.adults.withEquipment.count} Yetişkin (Ekipman Dahil)</span>
                                  <span>{priceInfo.breakdown.adults.withEquipment.totalPrice.toLocaleString('tr-TR')} ₺</span>
                                </div>
                              )}
                              {/* Yetişkin Kendi Ekipmanı */}
                              {priceInfo.breakdown.adults.ownEquipment.count > 0 && (
                                <div className="flex justify-between">
                                  <span>{priceInfo.breakdown.adults.ownEquipment.count} Yetişkin (Kendi Ekipmanı)</span>
                                  <span>{priceInfo.breakdown.adults.ownEquipment.totalPrice.toLocaleString('tr-TR')} ₺</span>
                                </div>
                              )}
                              {/* Çocuk Ekipman Dahil */}
                              {priceInfo.breakdown.children.withEquipment.count > 0 && (
                                <div className="flex justify-between">
                                  <span>{priceInfo.breakdown.children.withEquipment.count} Çocuk (Ekipman Dahil)</span>
                                  <span>{priceInfo.breakdown.children.withEquipment.totalPrice.toLocaleString('tr-TR')} ₺</span>
                                </div>
                              )}
                              {/* Çocuk Kendi Ekipmanı */}
                              {priceInfo.breakdown.children.ownEquipment.count > 0 && (
                                <div className="flex justify-between">
                                  <span>{priceInfo.breakdown.children.ownEquipment.count} Çocuk (Kendi Ekipmanı)</span>
                                  <span>{priceInfo.breakdown.children.ownEquipment.totalPrice.toLocaleString('tr-TR')} ₺</span>
                                </div>
                              )}
                              {/* Bebek */}
                              {priceInfo.breakdown.babies.count > 0 && (
                                <div className="flex justify-between">
                                  <span>{priceInfo.breakdown.babies.count} Bebek (Ücretsiz)</span>
                                  <span>{priceInfo.breakdown.babies.totalPrice.toLocaleString('tr-TR')} ₺</span>
                                </div>
                              )}
                            </div>
                            <div className="flex justify-between mt-2 pt-2 border-t border-slate-400 font-bold text-lg">
                              <span className="text-slate-800">Toplam Tutar:</span>
                              <span className="text-blue-700">{priceInfo.totalPrice.toLocaleString('tr-TR')} ₺</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  
                  <p className="text-slate-500 mb-6 sm:mb-8 text-sm sm:text-base">
                    Maksimum 12 kişi katılabilir
                  </p>
                </>
              ) : tourType === 'private' ? (
                <>
                  <h2 className="text-xl sm:text-3xl font-bold text-slate-800 mb-4 sm:mb-6">
                    Kapalı Tur (Özel) Seçtiniz
                  </h2>
                  
                  <div className="bg-purple-50 border-2 border-purple-200 rounded-xl sm:rounded-2xl p-4 sm:p-8 mb-6 sm:mb-8">
                    <div className="text-4xl sm:text-6xl mb-2 sm:mb-4">⭐</div>
                    <h3 className="text-lg sm:text-2xl font-bold text-purple-800 mb-2 sm:mb-4">Tüm Tekne Sizin!</h3>
                    <div className="text-purple-700 space-y-1 sm:space-y-2 text-sm sm:text-base">
                      <p>✅ 12 kişiye kadar katılım</p>
                      <p>✅ 6 saat kullanım (07:00-13:00 veya 14:00-20:00)</p>
                      <p>✅ 12 olta ve takım dahil</p>
                      <p>✅ Özel hizmet</p>
                    </div>
                  </div>
                </>
              ) : tourType === 'fishing-swimming' ? (
                <>
                  <h2 className="text-xl sm:text-3xl font-bold text-slate-800 mb-4 sm:mb-6">
                    Balık + Yüzme Turu Seçtiniz
                  </h2>
                  
                  <div className="bg-cyan-50 border-2 border-cyan-200 rounded-xl sm:rounded-2xl p-4 sm:p-8 mb-6 sm:mb-8">
                    <div className="text-4xl sm:text-6xl mb-2 sm:mb-4">🏊‍♂️</div>
                    <h3 className="text-lg sm:text-2xl font-bold text-cyan-800 mb-2 sm:mb-4">Balık Avı + Yüzme Keyfi!</h3>
                    <div className="text-cyan-700 space-y-1 sm:space-y-2 text-sm sm:text-base">
                      <p>✅ 12 kişiye kadar katılım</p>
                      <p>✅ 6 saat özel tur</p>
                      <p>✅ Balık avı + yüzme molası</p>
                      <p>✅ Tüm ekipmanlar dahil</p>
                    </div>
                  </div>
                </>
              ) : (
                // Özel (Custom) Tur
                (() => {
                  const customTour = getSelectedCustomTour(tourType);
                  if (!customTour) return null;
                  
                  const colorSchemes = [
                    { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', icon: '🌟' },
                    { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-800', icon: '🎯' },
                    { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', icon: '⚡' },
                    { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-800', icon: '🚀' },
                    { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-800', icon: '💎' }
                  ];
                  
                  const scheme = colorSchemes[customTours.findIndex(tour => tour.id === tourType) % colorSchemes.length];
                  
                  return (
                    <>
                      <h2 className="text-xl sm:text-3xl font-bold text-slate-800 mb-4 sm:mb-6">
                        {customTour.name} Seçtiniz
                      </h2>
                      
                      <div className={`${scheme.bg} border-2 ${scheme.border} rounded-xl sm:rounded-2xl p-4 sm:p-8 mb-6 sm:mb-8`}>
                        <div className="text-4xl sm:text-6xl mb-2 sm:mb-4">{scheme.icon}</div>
                        <h3 className={`text-lg sm:text-2xl font-bold ${scheme.text} mb-2 sm:mb-4`}>
                          {customTour.name}
                        </h3>
                        <div className={`${scheme.text} space-y-1 sm:space-y-2 text-sm sm:text-base`}>
                          <p>✅ Koltuk seçilebilir tur</p>
                          <p>✅ {customTour.duration} deneyimi</p>
                          <p>✅ Özel tur fiyatlandırması</p>
                          <p>✅ {customTour.description || 'Benzersiz balık avı deneyimi'}</p>
                        </div>
                      </div>
                    </>
                  );
                })()
              )}
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <button
                  onClick={() => {
                    setCurrentStep(3);
                    // Geri giderken sayfayı üste scroll yap
                    setTimeout(() => {
                      if (typeof window !== 'undefined') {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }, 100);
                  }}
                  className="bg-gray-400 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-500 transition-all duration-300 touch-manipulation"
                >
                  ← Geri
                </button>
                <button
                  data-continue-button
                  onClick={() => {
                    // Normal tur ve olta kullanan kişi varsa olta seçim adımına git
                    if (tourType === 'normal' && (ageGroups.adults > 0 || ageGroups.children > 0)) {
                      setCurrentStep(3.5);
                    } else {
                      setCurrentStep(4);
                    }
                    // Adım geçişinde sayfayı üste scroll yap
                    setTimeout(() => {
                      if (typeof window !== 'undefined') {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }, 100);
                  }}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 touch-manipulation"
                >
                  Devam Et →
                </button>
              </div>
            </div>
          )}

          {/* Adım 3.5: Olta Seçimi (Sadece Normal Tur İçin) */}
          {currentStep === 3.5 && (
            <div className="text-center">
              <h2 className="text-xl sm:text-3xl font-bold text-slate-800 mb-4 sm:mb-6">
                🎣 Olta Seçimi
              </h2>
              
              <p className="text-slate-600 mb-6 sm:mb-8 text-sm sm:text-base">
                Her kişi için olta durumunu belirleyin
              </p>

              <div className="max-w-2xl mx-auto space-y-6 mb-6 sm:mb-8">
                {/* Yetişkinler için olta seçimi */}
                {ageGroups.adults > 0 && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-blue-800 mb-4">
                      👨‍👩‍👦 Yetişkinler ({ageGroups.adults} kişi)
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {/* Ekipman Dahil */}
                      <div className="bg-white rounded-lg p-4 border-2 border-orange-200">
                        <h4 className="font-bold text-orange-800 mb-2">🎣 Ekipman Dahil</h4>
                        <p className="text-sm text-orange-600 mb-3">{prices.normalWithEquipment.toLocaleString('tr-TR')} ₺/kişi</p>
                        
                        <div className="flex items-center justify-center space-x-3">
                          <button
                            onClick={() => setEquipmentChoices(prev => ({
                              ...prev,
                              adults: {
                                withEquipment: Math.max(0, prev.adults.withEquipment - 1),
                                ownEquipment: Math.min(ageGroups.adults, prev.adults.ownEquipment + 1)
                              }
                            }))}
                            className="w-8 h-8 bg-red-500 text-white rounded-full font-bold hover:bg-red-600 transition-all duration-300"
                          >
                            -
                          </button>
                          <span className="text-xl font-bold text-orange-800 w-8 text-center">
                            {equipmentChoices.adults.withEquipment}
                          </span>
                          <button
                            onClick={() => setEquipmentChoices(prev => ({
                              ...prev,
                              adults: {
                                withEquipment: Math.min(ageGroups.adults, prev.adults.withEquipment + 1),
                                ownEquipment: Math.max(0, prev.adults.ownEquipment - 1)
                              }
                            }))}
                            className="w-8 h-8 bg-green-500 text-white rounded-full font-bold hover:bg-green-600 transition-all duration-300"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Kendi Ekipmanı */}
                      <div className="bg-white rounded-lg p-4 border-2 border-green-200">
                        <h4 className="font-bold text-green-800 mb-2">🎒 Kendi Ekipmanı</h4>
                        <p className="text-sm text-green-600 mb-3">{prices.normalOwn.toLocaleString('tr-TR')} ₺/kişi</p>
                        
                        <div className="flex items-center justify-center space-x-3">
                          <button
                            onClick={() => setEquipmentChoices(prev => ({
                              ...prev,
                              adults: {
                                ownEquipment: Math.max(0, prev.adults.ownEquipment - 1),
                                withEquipment: Math.min(ageGroups.adults, prev.adults.withEquipment + 1)
                              }
                            }))}
                            className="w-8 h-8 bg-red-500 text-white rounded-full font-bold hover:bg-red-600 transition-all duration-300"
                          >
                            -
                          </button>
                          <span className="text-xl font-bold text-green-800 w-8 text-center">
                            {equipmentChoices.adults.ownEquipment}
                          </span>
                          <button
                            onClick={() => setEquipmentChoices(prev => ({
                              ...prev,
                              adults: {
                                ownEquipment: Math.min(ageGroups.adults, prev.adults.ownEquipment + 1),
                                withEquipment: Math.max(0, prev.adults.withEquipment - 1)
                              }
                            }))}
                            className="w-8 h-8 bg-green-500 text-white rounded-full font-bold hover:bg-green-600 transition-all duration-300"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Çocuklar için olta seçimi */}
                {ageGroups.children > 0 && (
                  <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-orange-800 mb-4">
                      👶 Çocuklar ({ageGroups.children} kişi)
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {/* Ekipman Dahil */}
                      <div className="bg-white rounded-lg p-4 border-2 border-orange-200">
                        <h4 className="font-bold text-orange-800 mb-2">🎣 Ekipman Dahil</h4>
                        <p className="text-sm text-orange-600 mb-3">{(prices.normalWithEquipment * 0.5).toLocaleString('tr-TR')} ₺/kişi (%50)</p>
                        
                        <div className="flex items-center justify-center space-x-3">
                          <button
                            onClick={() => setEquipmentChoices(prev => ({
                              ...prev,
                              children: {
                                withEquipment: Math.max(0, prev.children.withEquipment - 1),
                                ownEquipment: Math.min(ageGroups.children, prev.children.ownEquipment + 1)
                              }
                            }))}
                            className="w-8 h-8 bg-red-500 text-white rounded-full font-bold hover:bg-red-600 transition-all duration-300"
                          >
                            -
                          </button>
                          <span className="text-xl font-bold text-orange-800 w-8 text-center">
                            {equipmentChoices.children.withEquipment}
                          </span>
                          <button
                            onClick={() => setEquipmentChoices(prev => ({
                              ...prev,
                              children: {
                                withEquipment: Math.min(ageGroups.children, prev.children.withEquipment + 1),
                                ownEquipment: Math.max(0, prev.children.ownEquipment - 1)
                              }
                            }))}
                            className="w-8 h-8 bg-green-500 text-white rounded-full font-bold hover:bg-green-600 transition-all duration-300"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Kendi Ekipmanı */}
                      <div className="bg-white rounded-lg p-4 border-2 border-green-200">
                        <h4 className="font-bold text-green-800 mb-2">🎒 Kendi Ekipmanı</h4>
                        <p className="text-sm text-green-600 mb-3">{(prices.normalOwn * 0.5).toLocaleString('tr-TR')} ₺/kişi (%50)</p>
                        
                        <div className="flex items-center justify-center space-x-3">
                          <button
                            onClick={() => setEquipmentChoices(prev => ({
                              ...prev,
                              children: {
                                ownEquipment: Math.max(0, prev.children.ownEquipment - 1),
                                withEquipment: Math.min(ageGroups.children, prev.children.withEquipment + 1)
                              }
                            }))}
                            className="w-8 h-8 bg-red-500 text-white rounded-full font-bold hover:bg-red-600 transition-all duration-300"
                          >
                            -
                          </button>
                          <span className="text-xl font-bold text-green-800 w-8 text-center">
                            {equipmentChoices.children.ownEquipment}
                          </span>
                          <button
                            onClick={() => setEquipmentChoices(prev => ({
                              ...prev,
                              children: {
                                ownEquipment: Math.min(ageGroups.children, prev.children.ownEquipment + 1),
                                withEquipment: Math.max(0, prev.children.withEquipment - 1)
                              }
                            }))}
                            className="w-8 h-8 bg-green-500 text-white rounded-full font-bold hover:bg-green-600 transition-all duration-300"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bebekler bilgi notu */}
                {ageGroups.babies > 0 && (
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                    <div className="text-center">
                      <h3 className="text-lg font-bold text-green-800 mb-2">
                        🍼 Bebekler ({ageGroups.babies} kişi)
                      </h3>
                      <p className="text-sm text-green-600">
                        Bebekler olta kullanmadığı için herhangi bir ekipman seçimi gerektirmez
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Fiyat Özeti */}
              {(() => {
                const priceInfo = getCurrentPrice();
                if (!priceInfo) return null;
                
                return (
                  <div className="bg-slate-100 border-2 border-slate-300 rounded-xl p-6 mb-6 max-w-md mx-auto">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">💰 Fiyat Özeti</h3>
                    <div className="space-y-2 text-sm text-slate-800">
                      {/* Yetişkin Ekipman Dahil */}
                      {priceInfo.breakdown.adults.withEquipment.count > 0 && (
                        <div className="flex justify-between">
                          <span>{priceInfo.breakdown.adults.withEquipment.count} Yetişkin (Ekipman Dahil)</span>
                          <span>{priceInfo.breakdown.adults.withEquipment.totalPrice.toLocaleString('tr-TR')} ₺</span>
                        </div>
                      )}
                      {/* Yetişkin Kendi Ekipmanı */}
                      {priceInfo.breakdown.adults.ownEquipment.count > 0 && (
                        <div className="flex justify-between">
                          <span>{priceInfo.breakdown.adults.ownEquipment.count} Yetişkin (Kendi Ekipmanı)</span>
                          <span>{priceInfo.breakdown.adults.ownEquipment.totalPrice.toLocaleString('tr-TR')} ₺</span>
                        </div>
                      )}
                      {/* Çocuk Ekipman Dahil */}
                      {priceInfo.breakdown.children.withEquipment.count > 0 && (
                        <div className="flex justify-between">
                          <span>{priceInfo.breakdown.children.withEquipment.count} Çocuk (Ekipman Dahil)</span>
                          <span>{priceInfo.breakdown.children.withEquipment.totalPrice.toLocaleString('tr-TR')} ₺</span>
                        </div>
                      )}
                      {/* Çocuk Kendi Ekipmanı */}
                      {priceInfo.breakdown.children.ownEquipment.count > 0 && (
                        <div className="flex justify-between">
                          <span>{priceInfo.breakdown.children.ownEquipment.count} Çocuk (Kendi Ekipmanı)</span>
                          <span>{priceInfo.breakdown.children.ownEquipment.totalPrice.toLocaleString('tr-TR')} ₺</span>
                        </div>
                      )}
                      {/* Bebek */}
                      {priceInfo.breakdown.babies.count > 0 && (
                        <div className="flex justify-between">
                          <span>{priceInfo.breakdown.babies.count} Bebek (Ücretsiz)</span>
                          <span>{priceInfo.breakdown.babies.totalPrice.toLocaleString('tr-TR')} ₺</span>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between mt-4 pt-4 border-t border-slate-400 font-bold text-lg">
                      <span className="text-slate-800">Toplam Tutar:</span>
                      <span className="text-blue-700">{priceInfo.totalPrice.toLocaleString('tr-TR')} ₺</span>
                    </div>
                  </div>
                );
              })()}

              {/* Navigasyon Butonları */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <button
                  onClick={() => {
                    setCurrentStep(3);
                    // Geri giderken sayfayı üste scroll yap
                    setTimeout(() => {
                      if (typeof window !== 'undefined') {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }, 100);
                  }}
                  className="bg-gray-400 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-500 transition-all duration-300 touch-manipulation"
                >
                  ← Geri
                </button>
                <button
                  data-continue-button
                  onClick={() => {
                    setCurrentStep(4);
                    // Adım geçişinde sayfayı üste scroll yap
                    setTimeout(() => {
                      if (typeof window !== 'undefined') {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }, 100);
                  }}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 touch-manipulation"
                >
                  Devam Et →
                </button>
              </div>
            </div>
          )}

                    {/* Adım 4: Tarih ve Saat Seçimi */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-lg sm:text-3xl font-bold text-slate-800 mb-4 sm:mb-6 text-center">
                Tarih {tourType === 'normal' ? 've Saat' : ''} Seçin
              </h2>
              
              {/* Seçim Özeti */}
              {selectedDate && ((tourType === 'private' || tourType === 'fishing-swimming') || selectedTime) && (
                <div className="mb-4 sm:mb-6 bg-green-50 border border-green-200 rounded-xl p-3 sm:p-4 text-center">
                  <h4 className="font-bold text-green-800 mb-2 text-sm sm:text-base">✅ Seçimleriniz</h4>
                  <p className="text-green-700 text-xs sm:text-sm">
                    📅 {new Date(selectedDate).toLocaleDateString('tr-TR', { 
                      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
                    })}
                  </p>
                                      <p className="text-green-700 text-xs sm:text-sm">
                      🕐 {isSpecialTour(tourType) ? 
                           (() => {
                             const customTour = getSelectedCustomTour(tourType);
                             if (customTour) return `${customTour.duration} Özel Tur`;
                             if (tourType === 'fishing-swimming') return '6 Saat Özel Tur';
                             if (tourType === 'private') return '6 Saat Özel Tur (07:00-13:00 veya 14:00-20:00)';
                             return selectedTime;
                           })() : 
                           selectedTime}
                    </p>
                    <p className="text-green-700 text-xs sm:text-sm">
                      👥 {isSpecialTour(tourType) ? 
                           (() => {
                             const customTour = getSelectedCustomTour(tourType);
                             if (customTour) return `${customTour.capacity} kişi (${customTour.name})`;
                             if (tourType === 'fishing-swimming') return '12 kişi (Balık+Yüzme Tur)';
                             if (tourType === 'private') return '12 kişi (Özel Tur)';
                             return `${getTotalGuestCount()} kişi`;
                           })() : 
                           `${getTotalGuestCount()} kişi`}
                    </p>
                    {tourType === 'normal' && (getTotalGuestCount() > ageGroups.adults) && (
                      <div className="text-xs text-gray-600 ml-4 mt-1">
                        {ageGroups.adults > 0 && <span>• {ageGroups.adults} Yetişkin </span>}
                        {ageGroups.children > 0 && <span>• {ageGroups.children} Çocuk </span>}
                        {ageGroups.babies > 0 && <span>• {ageGroups.babies} Bebek</span>}
                      </div>
                    )}
                </div>
              )}

              {/* Responsive Layout: Takvim + Koltuk Seçimi */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 mb-4 sm:mb-6">
                
                {/* Sol Taraf: Takvim ve Saat Seçimi */}
                <div className="space-y-4 sm:space-y-6">
                  {/* Takvim */}
                  <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-3 sm:p-6">
                    <h3 className="text-base sm:text-xl font-bold text-slate-800 mb-3 sm:mb-4 text-center">📅 Tarih Seçin</h3>
                    
                    {/* Takvim Başlığı */}
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <button
                        onClick={prevMonth}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center transition-all duration-300 touch-manipulation"
                      >
                        <span className="text-blue-600 font-bold text-sm sm:text-base">‹</span>
                      </button>
                      
                      <h4 className="text-sm sm:text-lg font-bold text-slate-800">
                        {currentMonth.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                      </h4>
                      
                      <button
                        onClick={nextMonth}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center transition-all duration-300 touch-manipulation"
                      >
                        <span className="text-blue-600 font-bold text-sm sm:text-base">›</span>
                      </button>
                    </div>

                    {/* Hafta Günleri */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day) => (
                        <div key={day} className="text-center py-1 sm:py-2">
                          <span className="text-xs font-bold text-slate-600">{day}</span>
                        </div>
                      ))}
                    </div>

                    {/* Takvim Günleri */}
                    <div className="grid grid-cols-7 gap-1">
                      {calendarDays.map((dayInfo, index) => {
                        const occupiedCount = selectedBoat?.id ? (occupiedDates[selectedBoat.id]?.[dayInfo.date] || 0) : 0;
                        const isSelected = selectedDate === dayInfo.date;
                        
                        // Teknenin toplam kapasitesini hesapla (saat sayısı × 12 koltuk)
                        const totalCapacity = availableTimes.length * 12;
                        const isFullyOccupied = occupiedCount >= totalCapacity; // Tüm seanslar dolu
                        const isPartiallyOccupied = occupiedCount > 0 && occupiedCount < totalCapacity;
                        
                        // Debug log
                        if (occupiedCount > 0) {
                          console.log(`📅 Takvim Debug - ${dayInfo.date}:`, {
                            occupiedCount,
                            availableTimesLength: availableTimes.length,
                            totalCapacity,
                            isFullyOccupied,
                            isPartiallyOccupied,
                            selectedBoat: selectedBoat?.name
                          });
                        }
                        
                        // Bu tarih için hangi seansların dolu olduğunu hesapla
                        const getSessionStatusForDate = (date: string) => {
                          // Bu implementation daha sonra eklenecek - şimdilik basit mesaj
                          if (isFullyOccupied) return "Tüm seanslar dolu";
                          if (isPartiallyOccupied) return "Bazı seanslar dolu";
                          return "Tüm seanslar boş";
                        };
                        
                        const isDateNotSelectable = !isDateSelectable(dayInfo.date);
                        
                        return (
                          <button
                            key={index}
                            onClick={() => {
                              if (!dayInfo.isDisabled && !isFullyOccupied && !isDateNotSelectable) {
                                // Tarih seçimi - özel tur kontrolü saat seçiminde yapılacak
                                setSelectedDate(dayInfo.date);
                                // Tarih seçiminde hafif scroll yap
                                setTimeout(() => scrollToContinueButton(), 400);
                              } else if (isDateNotSelectable && dayInfo.isCurrentMonth) {
                                // Tekne tarih aralığı kontrolü
                                if (selectedBoat && selectedBoat.dateRange?.enabled && !isDateInBoatRange(dayInfo.date, selectedBoat)) {
                                  let alertMessage = '❌ Bu tarih seçilemez!\n\n';
                                  alertMessage += `🚤 Seçili tekne (${selectedBoat.name}) bu tarihte hizmet vermiyor.\n\n`;
                                  alertMessage += `📅 Bu tekne için geçerli tarihler:\n${new Date(selectedBoat.dateRange.startDate).toLocaleDateString('tr-TR')} - ${new Date(selectedBoat.dateRange.endDate).toLocaleDateString('tr-TR')}`;
                                  if (selectedBoat.dateRange.note) {
                                    alertMessage += `\n\n💬 Not: ${selectedBoat.dateRange.note}`;
                                  }
                                  alert(alertMessage);
                                }
                              }
                            }}
                            disabled={dayInfo.isDisabled || isFullyOccupied || isDateNotSelectable}
                            className={`aspect-square rounded-md sm:rounded-lg text-xs sm:text-sm font-bold transition-all duration-300 relative touch-manipulation ${
                              dayInfo.isDisabled 
                                ? 'text-gray-300 cursor-not-allowed' 
                                : isDateNotSelectable && dayInfo.isCurrentMonth
                                ? 'bg-gradient-to-br from-purple-400 to-purple-500 text-white cursor-not-allowed opacity-60 line-through'
                                : isSelected
                                ? 'bg-gradient-to-br from-green-400 to-green-600 text-white scale-110 shadow-lg'
                                : isFullyOccupied && dayInfo.isCurrentMonth
                                ? 'bg-gradient-to-br from-red-500 to-red-600 text-white cursor-not-allowed opacity-75'
                                : isPartiallyOccupied && dayInfo.isCurrentMonth
                                ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-white hover:from-orange-500 hover:to-orange-600 hover:scale-105 shadow-md'
                                : dayInfo.isCurrentMonth
                                ? 'text-slate-700 hover:bg-blue-100 hover:scale-105'
                                : 'text-gray-400'
                            }`}
                            title={
                              dayInfo.isDisabled
                                ? 'Geçmiş tarih seçilemez'
                                : isDateNotSelectable && dayInfo.isCurrentMonth
                                ? `${new Date(dayInfo.date).toLocaleDateString('tr-TR')} - ${selectedBoat?.name} bu tarihte hizmet vermiyor`
                                : isFullyOccupied && dayInfo.isCurrentMonth
                                ? `${new Date(dayInfo.date).toLocaleDateString('tr-TR')} - Tamamen dolu (tüm seanslar) - Hiçbir tur türü için müsait değil`
                                : isPartiallyOccupied && dayInfo.isCurrentMonth
                                ? `${new Date(dayInfo.date).toLocaleDateString('tr-TR')} - Kısmi dolu (${occupiedCount}/${totalCapacity}) - Müsait seanslar var, saat seçiminde kontrol edin`
                                : dayInfo.isCurrentMonth
                                ? `${new Date(dayInfo.date).toLocaleDateString('tr-TR')} - Tamamen boş - Tüm seanslar müsait`
                                : ''
                            }
                          >
                            {dayInfo.day}
                            {/* Dolu günler için küçük nokta ve sayı */}
                            {occupiedCount > 0 && dayInfo.isCurrentMonth && !isSelected && (
                              <div className="absolute top-0.5 right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-red-600" style={{fontSize: '6px'}}>
                                  {occupiedCount}
                                </span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    
                    {/* Takvim Renk Açıklaması */}
                    <div className="grid grid-cols-2 sm:flex sm:justify-center gap-2 text-xs mt-3 sm:mt-4">
                      <div className="flex items-center space-x-1 bg-white/95 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full shadow-lg border border-green-200">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-br from-green-400 to-green-600 rounded shadow-sm"></div>
                        <span className="font-bold text-slate-800 text-xs">Seçili</span>
                      </div>
                      <div className="flex items-center space-x-1 bg-white/95 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full shadow-lg border border-red-200">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-br from-red-500 to-red-600 rounded shadow-sm"></div>
                        <span className="font-bold text-slate-800 text-xs">Tamamen Dolu</span>
                      </div>
                      <div className="flex items-center space-x-1 bg-white/95 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full shadow-lg border border-orange-200">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-br from-orange-400 to-orange-500 rounded shadow-sm"></div>
                        <span className="font-bold text-slate-800 text-xs">Kısmi Dolu</span>
                      </div>
                      <div className="flex items-center space-x-1 bg-white/95 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full shadow-lg border border-blue-200">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-100 rounded shadow-sm"></div>
                        <span className="font-bold text-slate-800 text-xs">Boş</span>
                      </div>
                    </div>
                  </div>

                  {/* Saat Seçimi - Tüm Tur Tipleri İçin */}
                  {selectedDate && (
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-3 sm:p-6">
                      <h3 className="text-base sm:text-xl font-bold text-slate-800 mb-3 sm:mb-4 text-center">🕐 Saat Seçin</h3>
                      
                      {/* Seçili Tarih ve Tekne Bilgisi */}
                      <div className="mb-4 space-y-3">
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                          <div className="text-center">
                            <p className="text-blue-800 font-bold text-sm mb-2">
                              📅 {new Date(selectedDate).toLocaleDateString('tr-TR', { 
                                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
                              })}
                            </p>
                            {selectedBoat && (
                              <p className="text-blue-700 font-medium text-sm">
                                ⛵ {selectedBoat.name}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Özel tur saatleri uyarısı */}
                        {tourType !== 'normal' && tourType !== 'private' && tourType !== 'fishing-swimming' && (() => {
                          const selectedCustomTour = customTours.find(tour => tour.id === tourType);
                          return (
                            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl">
                              <div className="flex items-center justify-center space-x-2 mb-2">
                                <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                                <p className="text-purple-700 font-bold text-sm">
                                  🎆 {selectedCustomTour?.name || 'Özel Tur'} - Özel Program
                                </p>
                              </div>
                              <p className="text-purple-600 text-xs text-center">
                                Bu teknenin özel çalışma saatleri
                              </p>
                              <p className="text-purple-600 text-xs text-center mt-1">
                                Sadece aşağıdaki saatlerde rezervasyon yapılabilir
                              </p>
                              {selectedCustomTour?.customSchedule?.note && (
                                <p className="text-purple-600 text-xs text-center mt-1">
                                  💬 {selectedCustomTour.customSchedule.note}
                                </p>
                              )}
                              {selectedCustomTour?.description && (
                                <p className="text-purple-600 text-xs text-center mt-1">
                                  📝 {selectedCustomTour.description}
                                </p>
                              )}
                            </div>
                          );
                        })()}
                        
                        {/* Tekne özel saatleri uyarısı (sadece özel tur aktif değilse) */}
                        {(tourType === 'normal' || tourType === 'private' || !(() => {
                          const selectedCustomTour = customTours.find(tour => tour.id === tourType);
                          return selectedCustomTour?.customSchedule?.enabled;
                        })()) && selectedBoat?.customSchedule?.enabled && (
                          <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                            <div className="flex items-center justify-center space-x-2 mb-2">
                              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                              </svg>
                              <p className="text-green-700 font-bold text-sm">
                                🕰️ Bu teknenin özel çalışma saatleri
                              </p>
                            </div>
                            <p className="text-green-600 text-xs text-center">
                              Sadece aşağıdaki saatlerde rezervasyon yapılabilir
                            </p>
                            {selectedBoat.customSchedule.note && (
                              <p className="text-green-600 text-xs text-center mt-1">
                                💬 {selectedBoat.customSchedule.note}
                              </p>
                            )}
                          </div>
                        )}
                      
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                          <div className="text-center">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                            <div className="flex items-center justify-center space-x-1 bg-white/60 px-2 py-1 rounded-full">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-green-700 font-bold">Boş Seans</span>
                            </div>
                            <div className="flex items-center justify-center space-x-1 bg-white/60 px-2 py-1 rounded-full">
                              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                              <span className="text-orange-700 font-bold">Kısmi Dolu</span>
                            </div>
                            <div className="flex items-center justify-center space-x-1 bg-white/60 px-2 py-1 rounded-full">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              <span className="text-red-700 font-bold">Tamamen Dolu</span>
                            </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 sm:gap-3">
                        {(() => {
                          console.log(`🎯 Saat gösterim kontrolü - Tur: ${tourType}, availableTimes:`, availableTimes);
                          return availableTimes.length === 0;
                        })() ? (
                          <div className="text-center py-8 bg-gray-50 rounded-lg">
                            <div className="text-4xl mb-2">⏰</div>
                            <p className="text-gray-600 font-medium">Bu tarih için saat bulunamadı</p>
                            <p className="text-sm text-gray-500 mt-2">
                              {tourType !== 'normal' && tourType !== 'private' && tourType !== 'fishing-swimming' 
                                ? 'Bu özel tur için admin tarafından saat tanımlanmamış'
                                : 'Lütfen başka bir tarih seçin'
                              }
                            </p>
                          </div>
                        ) : (
                          availableTimes.map((time) => {
                          const timeOccupancy = selectedBoat?.id ? (sessionOccupancy[selectedBoat.id]?.[time] || 0) : 0;
                          const isFullyOccupied = timeOccupancy >= 12;
                          const isPartiallyOccupied = timeOccupancy > 0 && timeOccupancy < 12;
                          const canSelectPrivate = timeOccupancy === 0; // Özel tur için tamamen boş olmalı
                          
                          // Özel tur seçildi ama seans dolu
                          const isPrivateBlocked = isSpecialTour(tourType) && !canSelectPrivate;
                          
                          // 🌙 Gece seansı (örn. 20:00-02:00 => start > end)
                          const [startStr, endStr] = (time || '').split('-');
                          const isNightSession = !!(startStr && endStr && startStr > endStr);
                          
                          // 🎨 DisplayName'e göre renk belirleme
                          const getSessionColor = () => {
                            const displayName = timeSlotDetails[time]?.displayName?.toLowerCase() || '';
                            
                            // Gece seansları - Mor
                            if (isNightSession || displayName.includes('gece') || displayName.includes('night')) {
                              return 'from-purple-600 to-indigo-700';
                            }
                            
                            // Çinekop seansları - Mavi (varsayılan)
                            if (displayName.includes('çine') || displayName.includes('cine')) {
                              return 'from-blue-600 to-blue-700';
                            }
                            
                            // İstavrit seansları - Turuncu
                            if (displayName.includes('istavrit') || displayName.includes('stavrit')) {
                              return 'from-orange-600 to-orange-700';
                            }
                            
                            // Akşam seansları - Kırmızı
                            if (displayName.includes('akşam') || displayName.includes('aksam')) {
                              return 'from-red-600 to-red-700';
                            }
                            
                            // Sabah seansları - Yeşil
                            if (displayName.includes('sabah') || displayName.includes('morning')) {
                              return 'from-green-600 to-green-700';
                            }
                            
                            // Varsayılan - Mavi
                            return 'from-blue-600 to-blue-700';
                          };
                          
                          return (
                          <button
                            key={time}
                            onClick={() => {
                                console.log(`🎯 Saat tıklandı: ${time}`);
                                console.log(`📊 timeOccupancy: ${timeOccupancy}`);
                                console.log(`🔍 canSelectPrivate: ${canSelectPrivate}`);
                                console.log(`⚠️ isPrivateBlocked: ${isPrivateBlocked}`);
                                console.log(`🚢 selectedBoat.id: ${selectedBoat?.id}`);
                                console.log(`📋 sessionOccupancy[selectedBoat.id]:`, sessionOccupancy[selectedBoat?.id || '']);
                                
                                if (isPrivateBlocked) {
                                  alert(`❌ ${getTourDisplayName(tourType)} için bu seans müsait değil!\n\n🕐 ${time} seansında ${timeOccupancy} koltuk dolu\n\n${getTourDisplayName(tourType)} tüm tekneyi kiralama sistemidir. Bu seansın tamamen boş olması gerekir.\n\n💡 Çözüm önerileri:\n• Başka bir saat seçin (tamamen boş seanslar)\n• Normal tur seçeneğini tercih edin\n• Başka bir tarih deneyin`);
                                  return;
                                }
                                if (isFullyOccupied) {
                                  alert(`❌ Bu seans tamamen dolu!\n\n${time} seansında tüm koltuklar (12/12) dolu.\nLütfen başka bir saat seçin.`);
                                  return;
                                }
                              // Gerçek saat formatını kaydet, displayName değil
                              // time zaten gerçek saat formatında olmalı (availableTimes'dan geliyor)
                              setSelectedTime(time);
                              // Saat seçiminde hafif scroll yap
                              setTimeout(() => scrollToContinueButton(), 400);
                            }}
                              disabled={isFullyOccupied || isPrivateBlocked}
                              className={`px-4 sm:px-6 py-3 rounded-xl font-bold transition-all duration-300 touch-manipulation text-sm sm:text-base relative ${
                              selectedTime === time
                                ? 'bg-gradient-to-br from-green-400 to-green-600 text-white scale-105'
                                  : isFullyOccupied || isPrivateBlocked
                                  ? 'bg-gradient-to-br from-red-400 to-red-500 text-white cursor-not-allowed opacity-75'
                                  : isPartiallyOccupied
                                  ? 'bg-gradient-to-br from-orange-100 to-orange-200 hover:from-orange-200 hover:to-orange-300 text-slate-800 border-2 border-orange-300'
                                  : isSpecialTour(tourType)
                                  ? 'bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 text-green-800 border-2 border-green-300 shadow-md'
                                  : 'bg-blue-50 hover:bg-blue-100 text-slate-800 border-2 border-blue-200'
                            }`}
                              title={
                                isPrivateBlocked
                                  ? `${getTourDisplayName(tourType)} için müsait değil (${timeOccupancy}/12 dolu)`
                                  : isFullyOccupied
                                  ? `Tamamen dolu (${timeOccupancy}/12)`
                                  : isPartiallyOccupied
                                  ? `Kısmi dolu (${timeOccupancy}/12) - Normal tur için müsait${isNightSession ? ' • 🌙 Gece Seansı' : ''}`
                                  : isSpecialTour(tourType)
                                  ? `Tamamen boş (${timeOccupancy}/12) - ${getTourDisplayName(tourType)} için müsait${isNightSession ? ' • 🌙 Gece Seansı' : ''}`
                                  : `Tamamen boş (${timeOccupancy}/12) - Tüm tur tipleri için müsait${isNightSession ? ' • 🌙 Gece Seansı' : ''}`
                              }
                            >
                              <div className="flex items-center justify-between">
                                <span>
                                  {time}
                                </span>
                                {/* Doluluk Göstergesi */}
                                <div className="flex items-center space-x-1">
                                  <div className={`w-2 h-2 rounded-full ${
                                    isFullyOccupied 
                                      ? 'bg-white/80' 
                                      : isPartiallyOccupied 
                                      ? 'bg-orange-600' 
                                      : 'bg-green-500'
                                  }`}></div>
                                  <span className="text-xs font-bold">
                                    {timeOccupancy}/12
                                  </span>
                                </div>
                              </div>
                              
                              {/* Tur Tipi ve Gece Seansı Bilgileri */}
                              <div className="mt-1 flex flex-wrap items-center gap-2">
                                {/* Özel Tur Rozeti (boatSchedules üzerinden gelen özel seanslar için) */}
                                {activeBoatSchedule && (
                                  <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r ${getSessionColor()} text-white text-[10px] sm:text-xs shadow`}>
                                    <span>🎣</span>
                                    <span>{timeSlotDetails[time]?.displayName || getTourDisplayName(activeBoatSchedule.tourType || tourType)}</span>
                                  </div>
                                )}
                                
                                {/* Özel turlar için tur adını göster */}
                                {!activeBoatSchedule && tourType !== 'normal' && tourType !== 'private' && tourType !== 'fishing-swimming' && (() => {
                                  const selectedCustomTour = customTours.find(tour => tour.id === tourType);
                                  return selectedCustomTour ? (
                                    <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r ${getSessionColor()} text-white text-[10px] sm:text-xs shadow`}>
                                      <span>🎣</span>
                                      <span>{timeSlotDetails[time]?.displayName || selectedCustomTour.name}</span>
                                    </div>
                                  ) : null;
                                })()}
                                
                                {/* Normal tur için "Normal Tur" rozeti */}
                                {!activeBoatSchedule && tourType === 'normal' && (
                                  <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r ${getSessionColor()} text-white text-[10px] sm:text-xs shadow`}>
                                    <span>🎣</span>
                                    <span>{timeSlotDetails[time]?.displayName || 'Normal Tur'}</span>
                                  </div>
                                )}
                                
                                {/* Gece seansı rozeti */}
                                {isNightSession && (
                                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-700 text-white text-[10px] sm:text-xs shadow">
                                    <span>🌙</span>
                                    <span>Gece Seansı</span>
                                  </div>
                                )}
                              </div>

                              {(tourType === 'private' || tourType === 'fishing-swimming') && (
                                <div className="text-xs mt-1 opacity-80">
                                  {tourType === 'fishing-swimming' ? 'Balık+Yüzme' : 'Özel Tur'} - 6 Saat
                                    {isPrivateBlocked && (
                                      <div className="text-xs mt-1 font-bold">
                                        ⚠️ Bu seans için özel tur alınamaz
                              </div>
                              )}
                                </div>
                              )}
                              
                              {/* Admin Notu (özel tur için) */}
                              {activeBoatSchedule?.note && (
                                <div className="text-[10px] sm:text-xs mt-1 text-purple-900/90 bg-purple-50 border border-purple-200 rounded px-2 py-1">
                                  💬 {activeBoatSchedule.note}
                                </div>
                              )}

                              {/* Durum açıklaması */}
                              <div className="text-xs mt-1 opacity-75">
                                {isFullyOccupied 
                                  ? '🔴 Tamamen Dolu' 
                                  : isPartiallyOccupied 
                                  ? '🟡 Kısmi Dolu' 
                                  : '🟢 Tamamen Boş'}
                              </div>
                            </button>
                          );
                        }))}
                      </div>
                      
                      {(tourType === 'private' || tourType === 'fishing-swimming') && (
                        <div className={`mt-3 p-3 rounded-xl border ${
                          tourType === 'fishing-swimming' 
                            ? 'bg-cyan-50 border-cyan-200'
                            : 'bg-purple-50 border-purple-200'
                        }`}>
                          <p className={`text-xs text-center font-bold mb-2 ${
                            tourType === 'fishing-swimming' ? 'text-cyan-800' : 'text-purple-800'
                          }`}>
                            ⭐ {tourType === 'fishing-swimming' ? 'Balık+Yüzme' : 'Özel'} Tur Seçimi
                          </p>
                          <p className={`text-xs text-center mb-1 ${
                            tourType === 'fishing-swimming' ? 'text-cyan-700' : 'text-purple-700'
                          }`}>
                            🚤 Seçtiğiniz saat dilimi boyunca tüm tekne (12 koltuk) sizin olacak
                          </p>
                          <p className={`text-xs text-center ${
                            tourType === 'fishing-swimming' ? 'text-cyan-600' : 'text-purple-600'
                          }`}>
                            ℹ️ Diğer seans boşsa başka müşteriler o seansı alabilir
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Sağ Taraf: Koltuk Seçimi */}
                {selectedDate && ((tourType === 'private' || tourType === 'fishing-swimming') || selectedTime) && (
                  <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-3 sm:p-6">
                    <h3 className="text-base sm:text-xl font-bold text-slate-800 mb-3 sm:mb-4 text-center">
                      {(tourType === 'private' || tourType === 'fishing-swimming') ? 
                        (tourType === 'fishing-swimming' ? '🏊‍♂️ Balık+Yüzme Turu - Tüm Koltuklar Sizin' : '⭐ Özel Tur - Tüm Koltuklar Sizin') : 
                        '🪑 Koltuk Seçin'}
                    </h3>
                    
                    {/* Koltuk Seçim Bilgilendirmesi */}
                    {tourType === 'normal' && (
                      <div className="mb-3 sm:mb-4 text-center">
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-2 sm:p-3 inline-block">
                                                      <div className="text-blue-800 text-xs sm:text-sm font-medium">
                                <p>💡 <strong>{getTotalGuestCount()} kişi</strong> için <strong>{getRequiredSeatCount()} koltuk</strong> seçin</p>
                              {ageGroups.babies > 0 && (
                                <p className="text-xs text-blue-600 mt-1">
                                  🍼 Bebekler kucakta oturacağı için koltuk gerekmez
                                </p>
                              )}
                              {selectedBoat?.seatingLayout === 'double' && (
                                <p className="text-xs text-blue-600 mt-1">
                                  👥 Koltuklar çiftli görünür ama her kişi için ayrı koltuk seçin
                                </p>
                              )}
                            </div>
                                                      {selectedSeats.length < getRequiredSeatCount() ? (
                              <p className="text-blue-700 text-xs mt-1">
                                  Henüz {getRequiredSeatCount() - selectedSeats.length} koltuk daha seçmelisiniz
                              </p>
                            ) : (
                              <p className="text-green-700 text-xs mt-1">
                                ✅ Tüm koltuklar seçildi!
                              </p>
                            )}
                        </div>
                      </div>
                    )}

                    {/* Real-time Doluluk Bilgisi */}
                    {tourType === 'normal' && (
                      <div className="mb-3 sm:mb-4 text-center">
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-2 sm:p-3 inline-block">
                          <p className="text-blue-800 text-xs font-medium mb-1">
                            🔄 <strong>Seçili Saat:</strong> {selectedTime}
                          </p>
                          <div className="flex items-center space-x-2 justify-center">
                            <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${occupiedSeats.length === 0 ? 'bg-green-500' : occupiedSeats.length >= 10 ? 'bg-red-500' : 'bg-orange-500'}`}></div>
                            <p className="text-blue-800 text-xs font-medium">
                              <strong>Doluluk:</strong> {occupiedSeats.length}/12
                            </p>
                          </div>
                          {occupiedSeats.length === 0 && (
                            <p className="text-green-700 text-xs mt-1">
                              ✅ Tüm koltuklar müsait!
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Özel Tur Bilgilendirmesi */}
                    {(tourType === 'private' || tourType === 'fishing-swimming') && (
                      <div className="mb-3 sm:mb-4 text-center">
                        <div className={`border rounded-xl p-2 sm:p-3 inline-block ${
                          tourType === 'fishing-swimming'
                            ? 'bg-cyan-50 border-cyan-200'
                            : 'bg-purple-50 border-purple-200'
                        }`}>
                          <p className={`text-xs font-medium mb-1 ${
                            tourType === 'fishing-swimming' ? 'text-cyan-800' : 'text-purple-800'
                          }`}>
                            {tourType === 'fishing-swimming' ? '🏊‍♂️' : '⭐'} <strong>
                              {tourType === 'fishing-swimming' ? 'Balık + Yüzme:' : 'Özel Tur:'} 
                            </strong> {tourType === 'fishing-swimming' ? '6 Saat' : '6 Saat'}
                          </p>
                          <div className="flex items-center space-x-2 justify-center">
                            <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${
                              tourType === 'fishing-swimming' ? 'bg-cyan-500' : 'bg-purple-500'
                            }`}></div>
                            <p className={`text-xs font-medium ${
                              tourType === 'fishing-swimming' ? 'text-cyan-800' : 'text-purple-800'
                            }`}>
                              🚤 Tüm tekne sizin
                            </p>
                          </div>
                          <p className={`text-xs mt-1 ${
                            tourType === 'fishing-swimming' ? 'text-cyan-700' : 'text-purple-700'
                          }`}>
                            ✅ 12 koltuk otomatik seçildi
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* Tekne Krokisi */}
                    <div className="relative max-w-xs mx-auto">
                      {/* BAŞ - Üçgen Kısım */}
                      <div className="relative">
                        <div className="text-center mb-2 sm:mb-3">
                          <span className="text-xs sm:text-sm font-bold text-slate-800 bg-white/95 px-2 sm:px-4 py-1 sm:py-2 rounded-full shadow-xl border border-slate-300">⚓ BAŞ</span>
                        </div>
                        
                        <div 
                          className="relative mx-auto w-28 h-16 sm:w-32 sm:h-20 bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 shadow-2xl border-2 border-slate-400"
                          style={{
                            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
                          }}
                        >
                          <div className="absolute bottom-1 sm:bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1 sm:space-x-2">
                            <div className="bg-white/90 p-1 sm:p-1.5 rounded-full shadow-lg border border-slate-300">
                              <span className="text-sm sm:text-lg">⚓</span>
                            </div>
                            <div className="bg-white/90 p-1 sm:p-1.5 rounded-full shadow-lg border border-slate-300">
                              <span className="text-xs sm:text-sm">🚽</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ANA GÖVDE - Dikdörtgen Kısım */}
                      <div className="relative bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 w-28 sm:w-32 mx-auto shadow-2xl rounded-b-2xl border-2 border-slate-400 border-t-0">
                        {/* İskele (Sol) Label */}
                        <div className="absolute -left-12 sm:-left-16 top-1/2 transform -translate-y-1/2 -rotate-90">
                          <span className="text-xs font-bold text-black bg-white/95 px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-xl border border-blue-600">🌊 İSKELE</span>
                        </div>
                        
                        {/* Sancak (Sağ) Label */}
                        <div className="absolute -right-12 sm:-right-16 top-1/2 transform -translate-y-1/2 rotate-90">
                          <span className="text-xs font-bold text-slate-800 bg-white/95 px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-xl border border-slate-300">🌊 SANCAK</span>
                        </div>

                        {/* Koltuk Düzeni */}
                        <div className="flex justify-between p-2 sm:p-3">
                          {/* İskele Koltukları (Sol) */}
                          <div className="flex flex-col space-y-1.5 sm:space-y-2">
                            {iskeleSeat.map(seatId => renderSeat(seatId))}
                          </div>

                          {/* Orta Koridor */}
                          <div className="w-4 sm:w-6 bg-gradient-to-b from-slate-400 via-slate-450 to-slate-500 rounded-lg shadow-inner border border-slate-500">
                            <div className="space-y-1 pt-2 sm:pt-3">
                              <div className="w-2 sm:w-3 h-0.5 bg-slate-600 rounded-full mx-auto"></div>
                              <div className="w-1.5 sm:w-2 h-0.5 bg-slate-600 rounded-full mx-auto"></div>
                              <div className="w-2 sm:w-3 h-0.5 bg-slate-600 rounded-full mx-auto"></div>
                            </div>
                          </div>

                          {/* Sancak Koltukları (Sağ) */}
                          <div className="flex flex-col space-y-1.5 sm:space-y-2">
                            {sancakSeat.map(seatId => renderSeat(seatId))}
                          </div>
                        </div>
                      </div>

                      {/* KIÇ */}
                      <div className="text-center mt-2 sm:mt-3">
                        <span className="text-xs sm:text-sm font-bold text-slate-800 bg-white/95 px-2 sm:px-4 py-1 sm:py-2 rounded-full shadow-xl border border-slate-300">🚤 KIÇ</span>
                      </div>
                    </div>

                    {/* Koltuk Durumu Açıklamaları - Sadece Normal Tur */}
                    {tourType === 'normal' && (
                      <div className="grid grid-cols-3 gap-1.5 sm:flex sm:justify-center sm:space-x-2 text-xs mt-3 sm:mt-4">
                        <div className="flex items-center space-x-1 bg-white/95 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full shadow-lg border border-blue-200">
                          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-br from-blue-400 to-blue-600 rounded shadow-sm"></div>
                          <span className="font-bold text-slate-800 text-xs">Boş</span>
                        </div>
                        <div className="flex items-center space-x-1 bg-white/95 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full shadow-lg border border-green-200">
                          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-br from-green-400 to-green-600 rounded shadow-sm"></div>
                          <span className="font-bold text-slate-800 text-xs">Seçili</span>
                        </div>
                        <div className="flex items-center space-x-1 bg-white/95 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full shadow-lg border border-red-200">
                          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded shadow-sm"></div>
                          <span className="font-bold text-slate-800 text-xs">Dolu</span>
                        </div>
                      </div>
                    )}

                    {/* Seçili Koltuklar */}
                    {selectedSeats.length > 0 && (
                      <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl border border-green-200 shadow-lg">
                        <p className="text-green-800 font-bold text-center text-xs sm:text-sm mb-2">
                          ✅ Seçili Koltuklar ({selectedSeats.length}/{(tourType === 'private' || tourType === 'fishing-swimming') ? 12 : getRequiredSeatCount()})
                        </p>
                        <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
                          {selectedSeats.map((seat) => (
                            <span key={seat} className="bg-green-600 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-bold">
                              {seat}
                            </span>
                          ))}
                        </div>
                        {tourType === 'normal' && selectedSeats.length < getRequiredSeatCount() && (
                          <p className="text-green-700 text-xs text-center mt-2">
                            {getRequiredSeatCount() - selectedSeats.length} koltuk daha seçin
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
               
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <button
                  onClick={() => {
                    setCurrentStep(3);
                    // Geri giderken sayfayı üste scroll yap
                    setTimeout(() => {
                      if (typeof window !== 'undefined') {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }, 100);
                  }}
                  className="bg-gray-400 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-500 transition-all duration-300 touch-manipulation"
                >
                  ← Geri
                </button>
                <button
                  data-continue-button
                  onClick={() => {
                    setCurrentStep(5);
                    // Adım geçişinde sayfayı üste scroll yap
                    setTimeout(() => {
                      if (typeof window !== 'undefined') {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }, 100);
                  }}
                  disabled={
                    !selectedDate || 
                    !selectedTime ||  // TÜM TUR TİPLERİ İÇİN SAAT SEÇİMİ ZORUNLU
                    (tourType === 'normal' && selectedSeats.length !== getRequiredSeatCount()) ||
                    (isSpecialTour(tourType) && selectedSeats.length !== 12)
                  }
                  className={`px-6 sm:px-8 py-3 rounded-xl font-bold transition-all duration-300 touch-manipulation text-sm sm:text-base ${
                    selectedDate && 
                    selectedTime &&  // TÜM TUR TİPLERİ İÇİN SAAT SEÇİMİ ZORUNLU
                    ((tourType === 'normal' && selectedSeats.length === getRequiredSeatCount()) || 
                     (isSpecialTour(tourType) && selectedSeats.length === 12))
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                                  {tourType === 'normal' && selectedSeats.length < getRequiredSeatCount()
                ? `${getRequiredSeatCount() - selectedSeats.length} koltuk daha seçin`
                    : 'Devam Et →'
                  }
                </button>
              </div>
            </div>
          )}

          {/* Adım 5: İletişim Bilgileri */}
          {currentStep === 5 && (
            <div className="text-center">
              <h2 className="text-xl sm:text-3xl font-bold text-slate-800 mb-4 sm:mb-6">
                İletişim Bilgileriniz
              </h2>
              
              <div className="max-w-md mx-auto space-y-4 mb-6 sm:mb-8">
                <div>
                  <label className="block text-left text-sm font-bold text-slate-700 mb-2">
                    Ad Soyad *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={guestInfo.name}
                      onChange={(e) => setGuestInfo({...guestInfo, name: e.target.value})}
                      className="px-4 py-3 rounded-xl border border-gray-300 text-slate-800 focus:ring-2 focus:ring-blue-400 focus:border-transparent text-base touch-manipulation"
                      placeholder="Ad"
                    />
                    <input
                      type="text"
                      value={guestInfo.surname}
                      onChange={(e) => setGuestInfo({...guestInfo, surname: e.target.value})}
                      className="px-4 py-3 rounded-xl border border-gray-300 text-slate-800 focus:ring-2 focus:ring-blue-400 focus:border-transparent text-base touch-manipulation"
                      placeholder="Soyad"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-left text-sm font-bold text-slate-700 mb-2">
                    Telefon *
                  </label>
                  <input
                    type="tel"
                    value={guestInfo.phone}
                    onChange={(e) => {
                      const rawValue = e.target.value;
                      const formattedPhone = formatPhoneNumber(rawValue);
                      setGuestInfo({...guestInfo, phone: formattedPhone});
                      
                      // Gerçek zamanlı validasyon
                      if (formattedPhone.trim()) {
                        const validation = validatePhoneNumber(formattedPhone);
                        setPhoneError(validation.isValid ? '' : validation.message);
                      } else {
                        setPhoneError('');
                      }
                    }}
                    className={`w-full px-4 py-3 rounded-xl border text-slate-800 focus:ring-2 focus:border-transparent text-base touch-manipulation ${
                      phoneError 
                        ? 'border-red-500 focus:ring-red-400' 
                        : 'border-gray-300 focus:ring-blue-400'
                    }`}
                    placeholder="05XX XXX XX XX"
                    maxLength={14}
                  />
                  {phoneError && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <span className="mr-1">⚠️</span>
                      {phoneError}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-left text-sm font-bold text-slate-700 mb-2">
                    E-posta (İsteğe bağlı)
                  </label>
                  <input
                    type="email"
                    value={guestInfo.email}
                    onChange={(e) => setGuestInfo({...guestInfo, email: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 text-slate-800 focus:ring-2 focus:ring-blue-400 focus:border-transparent text-base touch-manipulation"
                    placeholder="ornek@email.com"
                  />
                </div>
              </div>

              {/* Son Özet */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
                <h4 className="font-bold text-blue-800 mb-3 sm:mb-4 text-sm sm:text-base">📋 Rezervasyon Özeti</h4>
                <div className="text-left space-y-2 text-blue-700 text-sm sm:text-base">
                  <p>🎣 <strong>Tur Tipi:</strong> {getTourDisplayName(tourType)}</p>
                  <p>👥 <strong>Kişi Sayısı:</strong> {
                    isSpecialTour(tourType) ? 
                    (() => {
                      const customTour = getSelectedCustomTour(tourType);
                      return customTour ? `${customTour.capacity} kişi (Tüm Tekne)` : '12 kişi (Tüm Tekne)';
                    })() : 
                    `${getTotalGuestCount()} kişi`
                  }</p>
                  {tourType === 'normal' && (getTotalGuestCount() > ageGroups.adults) && (
                    <div className="ml-6 text-xs space-y-1">
                      {ageGroups.adults > 0 && <p>• {ageGroups.adults} Yetişkin</p>}
                      {ageGroups.children > 0 && <p>• {ageGroups.children} Çocuk (3-6 yaş, %50 indirimli)</p>}
                      {ageGroups.babies > 0 && <p>• {ageGroups.babies} Bebek (0-3 yaş, ücretsiz)</p>}
                    </div>
                  )}
                  <p>📅 <strong>Tarih:</strong> {new Date(selectedDate).toLocaleDateString('tr-TR', { 
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
                  })}</p>
                  <p>🕐 <strong>Saat:</strong> {
                    isSpecialTour(tourType) ? 
                    (() => {
                      const customTour = getSelectedCustomTour(tourType);
                      if (customTour) return `${customTour.duration} Özel Tur`;
                      if (tourType === 'fishing-swimming') return '6 Saat Özel Tur';
                      if (tourType === 'private') return `${selectedTime} (6 Saat Özel Tur)`;
                      return selectedTime;
                    })() : 
                    selectedTime
                  }</p>
                  <p>🪑 <strong>Koltuklar:</strong> {
                    isSpecialTour(tourType) ? 
                    (() => {
                      const customTour = getSelectedCustomTour(tourType);
                      return customTour ? `Tüm Tekne (${customTour.capacity} Koltuk)` : 'Tüm Tekne (12 Koltuk)';
                    })() :
                    selectedSeats.join(', ')
                  }</p>
                  <p>👤 <strong>İletişim:</strong> {guestInfo.name} {guestInfo.surname}</p>
                  <p>📞 <strong>Telefon:</strong> {guestInfo.phone}</p>
                  {tourType === 'normal' && (
                    <p>⚓ <strong>Ekipman:</strong> {priceOption === 'own-equipment' ? 'Kendi ekipmanım var' : 'Ekipman dahil'}</p>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <button
                  onClick={() => {
                    setCurrentStep(5);
                    // Geri giderken sayfayı üste scroll yap
                    setTimeout(() => {
                      if (typeof window !== 'undefined') {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }, 100);
                  }}
                  className="bg-gray-400 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-500 transition-all duration-300 touch-manipulation"
                >
                  ← Geri
                </button>
                <button
                  onClick={() => saveReservation()}
                  disabled={!guestInfo.name || !guestInfo.surname || !guestInfo.phone || loading || !!phoneError || !validatePhoneNumber(guestInfo.phone).isValid}
                  className={`px-6 sm:px-8 py-3 rounded-xl font-bold transition-all duration-300 touch-manipulation text-sm sm:text-base ${
                    guestInfo.name && guestInfo.surname && guestInfo.phone && !loading && !phoneError && validatePhoneNumber(guestInfo.phone).isValid
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {loading ? '💾 Kaydediliyor...' : '✅ Rezervasyonu Tamamla'}
                </button>
              </div>
            </div>
          )}

          {/* Adım 6: Başarı Sayfası */}
          {currentStep === 6 && (
            <div className="text-center">
              <div className="relative max-w-2xl mx-auto">
                {/* Kutlama Animasyonu */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-0 left-1/4 animate-bounce delay-100">
                    <span className="text-4xl">🎉</span>
                  </div>
                  <div className="absolute top-0 right-1/4 animate-bounce delay-300">
                    <span className="text-4xl">🎊</span>
                  </div>
                  <div className="absolute top-10 left-1/3 animate-bounce delay-500">
                    <span className="text-3xl">⚓</span>
                  </div>
                  <div className="absolute top-10 right-1/3 animate-bounce delay-700">
                    <span className="text-3xl">🚤</span>
                  </div>
                </div>

                                    {/* Ana Kart */}
                <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-blue-50 border-2 border-green-200 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl relative overflow-hidden">
                  
                  {/* Arka Plan Dekorasyonu */}
                  <div className="absolute inset-0 bg-gradient-to-r from-green-100/20 to-blue-100/20 rounded-2xl sm:rounded-3xl"></div>
                  <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-green-200/30 to-emerald-200/30 rounded-full -translate-y-12 sm:-translate-y-16 translate-x-12 sm:translate-x-16"></div>
                  <div className="absolute bottom-0 left-0 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-tr from-blue-200/30 to-green-200/30 rounded-full translate-y-10 sm:translate-y-12 -translate-x-10 sm:-translate-x-12"></div>
                  
                  {/* İçerik */}
                  <div className="relative z-10">
                    {/* Başlık */}
                    <div className="text-5xl sm:text-8xl mb-4 sm:mb-6 animate-pulse">
                      ✅
                    </div>
                    
                    <h2 className="text-xl sm:text-4xl font-bold text-green-800 mb-3 sm:mb-4 animate-fade-in">
                      🎉 Rezervasyonunuz Başarıyla Oluşturuldu!
                    </h2>
                    
                    {/* Durum Bilgisi */}
                    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 animate-pulse">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full animate-ping"></div>
                        <span className="text-yellow-800 font-bold text-sm sm:text-lg">
                          📋 Randevunuz Onay Aşamasında
                        </span>
                      </div>
                      <p className="text-yellow-700 text-xs sm:text-sm mt-2">
                        Rezervasyon detaylarınız inceleniyor...
                      </p>
                    </div>

                    {/* Bilgilendirme Kartları */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                      
                      {/* WhatsApp Bilgisi */}
                      <div className="bg-white/80 border border-green-200 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">📱</div>
                        <h3 className="text-green-800 font-bold text-sm sm:text-lg mb-1 sm:mb-2">
                          WhatsApp İletişim
                        </h3>
                        <p className="text-green-700 text-xs sm:text-sm">
                          Size WhatsApp üzerinden yazacağız ve rezervasyon detaylarınızı paylaşacağız.
                        </p>
                      </div>

                      {/* Ödeme Bilgisi */}
                      <div className="bg-white/80 border border-blue-200 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">💰</div>
                        <h3 className="text-blue-800 font-bold text-sm sm:text-lg mb-1 sm:mb-2">
                          Ödeme Şekli
                        </h3>
                        <p className="text-blue-700 text-xs sm:text-sm">
                          Tekne ücretleri elden teslim alınır. Peşin ödeme yapmanıza gerek yoktur.
                        </p>
                      </div>

                      {/* Onay Süreci */}
                      <div className="bg-white/80 border border-purple-200 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">⏰</div>
                        <h3 className="text-purple-800 font-bold text-sm sm:text-lg mb-1 sm:mb-2">
                          Onay Süreci
                        </h3>
                        <p className="text-purple-700 text-xs sm:text-sm">
                          Rezervasyonunuz 24 saat içinde onaylanacak ve size bilgi verilecektir.
                        </p>
                      </div>

                      {/* Tekne Bilgisi */}
                      <div className="bg-white/80 border border-teal-200 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">🚤</div>
                        <h3 className="text-teal-800 font-bold text-sm sm:text-lg mb-1 sm:mb-2">
                          Tekne Hazırlığı
                        </h3>
                        <p className="text-teal-700 text-xs sm:text-sm">
                          Teknemiz sizin için hazırlanacak ve tüm güvenlik önlemleri alınacaktır.
                        </p>
                      </div>

                    </div>

                    {/* Rezervasyon Özeti */}
                    <div className="bg-white/90 border-2 border-blue-200 rounded-xl sm:rounded-2xl p-3 sm:p-6 mb-4 sm:mb-6 shadow-lg">
                      <h3 className="text-blue-800 font-bold text-base sm:text-xl mb-3 sm:mb-4 flex items-center justify-center">
                        <span className="mr-2">📋</span>
                        Rezervasyon Özeti
                      </h3>
                      <div className="text-left space-y-2 sm:space-y-3 text-sm sm:text-base">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">👤 Misafir:</span>
                          <span className="font-bold text-slate-800 text-xs sm:text-sm">{guestInfo.name} {guestInfo.surname}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">📱 Telefon:</span>
                          <span className="font-bold text-slate-800 text-xs sm:text-sm">{guestInfo.phone}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">🚤 Tur Tipi:</span>
                          <span className="font-bold text-slate-800 text-xs sm:text-sm">
                            {tourType === 'private' ? '⭐ Kapalı Tur (Özel)' : 
                             tourType === 'fishing-swimming' ? '🏊‍♂️ Balık + Yüzme' : 
                             '👥 Normal Tur'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">📅 Tarih:</span>
                          <span className="font-bold text-slate-800 text-xs sm:text-sm">
                            {new Date(selectedDate).toLocaleDateString('tr-TR', { 
                              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">🕐 Saat:</span>
                          <span className="font-bold text-slate-800 text-xs sm:text-sm">
                            {tourType === 'private' ? `${selectedTime} (6 Saat Özel Tur)` : 
                             tourType === 'fishing-swimming' ? `${selectedTime} (6 Saat Özel Tur)` :
                             selectedTime}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">👥 Kişi Sayısı:</span>
                          <span className="font-bold text-slate-800 text-xs sm:text-sm">
                            {isSpecialTour(tourType) ? (() => {
                              const customTour = getSelectedCustomTour(tourType);
                              return customTour ? `${customTour.capacity} kişi` : '12 kişi';
                            })() : `${getTotalGuestCount()} kişi`}
                          </span>
                        </div>
                        {tourType === 'normal' && (getTotalGuestCount() > ageGroups.adults) && (
                          <div className="text-xs text-slate-600 space-y-1 ml-4">
                            {ageGroups.adults > 0 && <p>• {ageGroups.adults} Yetişkin</p>}
                            {ageGroups.children > 0 && <p>• {ageGroups.children} Çocuk (%50 indirimli)</p>}
                            {ageGroups.babies > 0 && <p>• {ageGroups.babies} Bebek (ücretsiz)</p>}
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">🪑 Koltuklar:</span>
                          <span className="font-bold text-slate-800 text-xs sm:text-sm">
                            {selectedSeats.join(', ')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center border-t pt-2">
                          <span className="text-slate-600">💰 Paket:</span>
                          <span className="font-bold text-slate-800 text-xs sm:text-sm">
                            {tourType === 'normal' ? 
                              (priceOption === 'own-equipment' ? 'Kendi Ekipmanı' : 'Ekipman Dahil') :
                              tourType === 'private' ? 'Kapalı Tur (Özel)' : 'Balık + Yüzme Turu'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">💵 Fiyat:</span>
                          <span className="font-bold text-green-600 text-xs sm:text-sm">
                            {tourType === 'normal' ? 
                              (priceOption === 'own-equipment' ? 
                                `${prices.normalOwn.toLocaleString('tr-TR')} TL/kişi` : 
                                `${prices.normalWithEquipment.toLocaleString('tr-TR')} TL/kişi`) :
                              tourType === 'private' ? 
                                `${prices.privateTour.toLocaleString('tr-TR')} TL (Grup)` : 
                                `${prices.fishingSwimming.toLocaleString('tr-TR')} TL (Grup)`}
                          </span>
                        </div>
                        <div className="flex justify-between items-center border-t pt-2">
                          <span className="text-slate-600 font-bold">🧾 Toplam Tutar:</span>
                          <span className="font-bold text-green-700 text-sm sm:text-base">
                            {(() => {
                              if (tourType === 'private') {
                                return `${prices.privateTour.toLocaleString('tr-TR')} TL`;
                              } else if (tourType === 'fishing-swimming') {
                                return `${prices.fishingSwimming.toLocaleString('tr-TR')} TL`;
                              } else {
                                // Normal tur için esnek fiyatlama sistemini kullan
                                const priceInfo = getCurrentPrice();
                                return priceInfo ? `${priceInfo.totalPrice.toLocaleString('tr-TR')} TL` : '0 TL';
                              }
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Teşekkür Mesajı */}
                    <div className="bg-gradient-to-r from-blue-100 to-green-100 border border-blue-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
                      <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">🙏</div>
                      <h3 className="text-blue-800 font-bold text-base sm:text-xl mb-2">
                        Balık Sefası'nı Tercih Ettiğiniz İçin Teşekkürler!
                      </h3>
                      <p className="text-blue-700 text-sm sm:text-base">
                        İstanbul Boğazı'nda unutulmaz anlar yaşayacaksınız. 
                        Profesyonel ekibimiz sizlere en iyi hizmeti sunmak için hazır!
                      </p>
                    </div>

                    {/* Butonlar */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                      <button
                        onClick={() => {
                          setCurrentStep(1);
                          setTourType('normal');
                          setPriceOption('own-equipment');
                          setGuestCount(1);
                          setSelectedDate('');
                          setSelectedTime('');
                          setSelectedSeats([]);
                          setGuestInfo({
                            name: '',
                            surname: '',
                            phone: '',
                            email: ''
                          });
                          // Yeni rezervasyon başlarken sayfayı üste scroll yap
                          setTimeout(() => {
                            if (typeof window !== 'undefined') {
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                          }, 100);
                        }}
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl text-sm sm:text-base touch-manipulation"
                      >
                        🚤 Yeni Rezervasyon Yap
                      </button>
                      
                      <Link
                        href="/"
                        className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl text-sm sm:text-base touch-manipulation"
                      >
                        🏠 Ana Sayfaya Dön
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
      
      {/* Floating WhatsApp Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <a
          href="https://wa.me/905310892537?text=Merhaba,%20Balık%20Sefası%20balık%20avı%20turları%20hakkında%20bilgi%20almak%20istiyorum.%20Konum:%20https://maps.app.goo.gl/fVPxCBB9JphkEMBH7"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center animate-pulse"
          title="WhatsApp ile iletişim kurun"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488"/>
          </svg>
        </a>
      </div>

    </div>
  );
} 

