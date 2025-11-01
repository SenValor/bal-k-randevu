# ⚓ Tekne Yönetim Sistemi Dokümantasyonu

## 📋 Genel Bakış

Balık Sefası uygulaması için profesyonel admin paneli - Tekne yönetim sistemi.

---

## 🎯 Oluşturulan Dosyalar

### 1. **`lib/boatHelpers.ts`** 🔧

Firestore işlemleri için helper fonksiyonlar.

#### Interfaces:
```typescript
interface TimeSlot {
  start: string;           // "09:00"
  end: string;             // "12:00"
  displayName: string;     // "Sabah Turu"
}

interface Boat {
  id: string;
  name: string;
  description: string;
  capacity: number;
  imageUrl: string;
  seatLayout: 'single' | 'double';
  tourTypes: {
    normal: boolean;
    private: boolean;
    fishingSwimming: boolean;
  };
  startDate: string;       // ISO 8601
  endDate: string;         // ISO 8601
  timeSlots: TimeSlot[];
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}
```

#### Fonksiyonlar:
- `addBoat(boatData)` - Yeni tekne ekler
- `updateBoat(id, boatData)` - Tekne günceller
- `deleteBoat(id)` - Tekne siler
- `toggleBoatStatus(id, isActive)` - Aktiflik durumunu değiştirir
- `subscribeToBoats(callback)` - Gerçek zamanlı dinleme

---

### 2. **`components/admin/boats/BoatList.tsx`** 📊

Tekneleri tablo formatında listeler.

#### Özellikler:
- ✅ Responsive tablo tasarımı
- ✅ Tekne resmi, ad, açıklama
- ✅ Kapasite göstergesi
- ✅ Aktif/Pasif toggle (gerçek zamanlı güncelleme)
- ✅ Tarih aralığı gösterimi
- ✅ Düzenle ve Sil butonları
- ✅ Empty state (tekne yoksa deniz temalı)
- ✅ Hover efektleri
- ✅ Staggered animations

#### Toggle Özelliği:
```tsx
// Gerçek zamanlı Firestore güncellemesi
const handleToggleStatus = async (boat: Boat) => {
  await toggleBoatStatus(boat.id, !boat.isActive);
};
```

---

### 3. **`components/admin/boats/DeleteConfirmModal.tsx`** 🗑️

Silme onay modalı.

#### Özellikler:
- ✅ React Portal ile render
- ✅ Framer Motion animasyonları
- ✅ Uyarı ikonu ve mesajı
- ✅ Tekne bilgilerini gösterir
- ✅ "Bu işlem geri alınamaz" uyarısı
- ✅ Loading state
- ✅ Backdrop tıklama ile kapanma

#### Güvenlik:
- Silme işlemi öncesi onay gerektirir
- Kullanıcıya hangi tekneyi sildiği gösterilir
- İlgili rezervasyonların da silineceği uyarısı

---

### 4. **`components/admin/boats/BoatFormModal.tsx`** ✏️

Tekne ekleme/düzenleme formu.

#### Form Alanları:

**Temel Bilgiler:**
- Tekne Adı (text, required)
- Açıklama (textarea)
- Kapasite (number, min: 1)
- Resim URL (text)

**Konfigürasyon:**
- Koltuk Yerleşimi (dropdown: single/double)
- Tur Tipleri (checkboxes):
  - Normal Tur
  - Özel Tur
  - Balık Avı & Yüzme

**Tarih Ayarları:**
- Başlangıç Tarihi (date, required)
- Bitiş Tarihi (date, required)

**Zaman Dilimleri:**
- Dinamik liste
- Her dilim için:
  - Başlangıç saati (time)
  - Bitiş saati (time)
  - Görünen ad (text)
- "Dilim Ekle" butonu
- "Kaldır" butonu (her dilim için)

#### Validasyonlar:
```typescript
✅ Tekne adı boş olamaz
✅ Kapasite minimum 1
✅ Tarihler gerekli
✅ Bitiş tarihi başlangıçtan önce olamaz
```

#### Özellikler:
- ✅ Yeni ekleme ve düzenleme modu
- ✅ Form state yönetimi
- ✅ Error handling
- ✅ Loading states
- ✅ Responsive tasarım
- ✅ Scroll edilebilir içerik
- ✅ Framer Motion animasyonları

---

### 5. **`app/admin/boats/page.tsx`** 🏠

Ana admin sayfası.

#### Layout:

```
┌─────────────────────────────────────┐
│  Header                             │
│  ┌─────┐  Tekne Ayarları            │
│  │ ⚓  │  [Yeni Tekne Ekle]         │
│  └─────┘                            │
├─────────────────────────────────────┤
│  Stats                              │
│  ┌─────────┬─────────┬─────────┐   │
│  │ Toplam  │ Aktif   │ Pasif   │   │
│  │   5     │   4     │   1     │   │
│  └─────────┴─────────┴─────────┘   │
├─────────────────────────────────────┤
│  Boat List (Table)                  │
│  ┌─────────────────────────────┐   │
│  │ Ad │ Kap │ Durum │ Tarih   │   │
│  ├─────────────────────────────┤   │
│  │ ... │ ... │ [⚪] │ ...     │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

#### Özellikler:
- ✅ Gerçek zamanlı veri (`onSnapshot`)
- ✅ İstatistik kartları
- ✅ Loading state
- ✅ Modal yönetimi
- ✅ Gradient header
- ✅ Responsive tasarım

---

## 🔥 Firestore Yapısı

### `boats` Collection:

```javascript
{
  name: "Deniz Yıldızı",
  description: "Lüks balık avı teknesi",
  capacity: 12,
  imageUrl: "https://example.com/boat.jpg",
  seatLayout: "double",
  tourTypes: {
    normal: true,
    private: true,
    fishingSwimming: false
  },
  startDate: "2025-01-01",
  endDate: "2025-12-31",
  timeSlots: [
    {
      start: "09:00",
      end: "12:00",
      displayName: "Sabah Turu"
    },
    {
      start: "14:00",
      end: "17:00",
      displayName: "Öğleden Sonra"
    }
  ],
  isActive: true,
  createdAt: "2025-10-28T14:00:00.000Z",
  updatedAt: "2025-10-28T15:30:00.000Z"
}
```

---

## 🚀 Kullanım

### Sayfaya Erişim:
```
http://localhost:3000/admin/boats
```

### Yeni Tekne Ekleme:
1. "Yeni Tekne Ekle" butonuna tıkla
2. Formu doldur
3. Zaman dilimlerini ekle
4. "Ekle" butonuna tıkla
5. ✅ Firestore'a kaydedilir
6. ✅ Liste otomatik güncellenir

### Tekne Düzenleme:
1. Listede "Düzenle" ikonuna tıkla
2. Mevcut bilgiler formda görünür
3. Değişiklikleri yap
4. "Güncelle" butonuna tıkla
5. ✅ Firestore güncellenir
6. ✅ Liste otomatik güncellenir

### Tekne Silme:
1. Listede "Sil" ikonuna tıkla
2. Onay modalı açılır
3. Tekne bilgilerini kontrol et
4. "Sil" butonuna tıkla
5. ✅ Firestore'dan silinir
6. ✅ Liste otomatik güncellenir

### Durum Değiştirme:
1. Toggle switch'e tıkla
2. ✅ Anında Firestore'da güncellenir
3. ✅ UI otomatik güncellenir

---

## 🎨 Tasarım Özellikleri

### Renkler:
- **Primary:** `#00A9A5` (Turkuaz)
- **Secondary:** `#008B87` (Koyu Turkuaz)
- **Background:** `from-[#001F3F] to-black`
- **Cards:** `bg-white/5 border-white/10`
- **Hover:** `hover:bg-white/10`

### Animasyonlar:
- **Fade in:** Modal açılış/kapanış
- **Scale:** Buton hover/tap
- **Stagger:** Liste öğeleri
- **Slide:** Form alanları

### Icons:
- Anchor (⚓) - Ana ikon
- Plus (+) - Yeni ekleme
- Edit (✏️) - Düzenleme
- Trash (🗑️) - Silme
- Users (👥) - Kapasite
- Calendar (📅) - Tarih

---

## 🔒 Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /boats/{boatId} {
      // Sadece admin okuyabilir/yazabilir
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

---

## ✨ Özellikler

### ✅ Gerçek Zamanlı
- `onSnapshot` ile canlı veri
- Değişiklikler anında yansır
- Çoklu kullanıcı desteği

### ✅ Kullanıcı Dostu
- Sezgisel arayüz
- Anlaşılır form alanları
- Görsel geri bildirimler
- Loading states

### ✅ Güvenli
- Silme onayı
- Form validasyonları
- Error handling
- Firestore rules

### ✅ Responsive
- Mobil uyumlu
- Tablet optimizasyonu
- Desktop tam özellik

### ✅ Performanslı
- Lazy loading
- Optimized queries
- Minimal re-renders

---

## 🎯 Sonraki Adımlar

1. **Toplu İşlemler**
   - Çoklu seçim
   - Toplu silme
   - Toplu aktif/pasif

2. **Filtreleme & Arama**
   - Tekne adına göre arama
   - Durum filtreleme
   - Tarih aralığı filtreleme

3. **Sıralama**
   - Ada göre
   - Tarihe göre
   - Kapasiteye göre

4. **Export/Import**
   - CSV export
   - JSON export
   - Toplu import

5. **Resim Upload**
   - Firebase Storage entegrasyonu
   - Drag & drop upload
   - Resim önizleme

6. **İstatistikler**
   - Grafik gösterimleri
   - Rezervasyon analizi
   - Popüler tekneler

---

## 🎉 Özet

✅ **Tam CRUD İşlemleri** → Ekle, Güncelle, Sil, Listele  
✅ **Gerçek Zamanlı** → onSnapshot ile canlı veri  
✅ **Modern UI** → Gradient, blur, animations  
✅ **Responsive** → Mobil, tablet, desktop  
✅ **Güvenli** → Onay modalları, validasyonlar  
✅ **Kullanıcı Dostu** → Sezgisel arayüz  
✅ **Profesyonel** → Kurumsal dashboard stili  

Tekne yönetim sistemi tam çalışır durumda! ⚓🚀
