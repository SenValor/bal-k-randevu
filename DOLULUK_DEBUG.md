# Doluluk Sistemi Debug Rehberi 🔍

## Sorun
Rezervasyon yapılıyor ama takvim, saat dilimleri ve koltuklarda doluluk gözükmüyor.

## Test Adımları

### 1. Rezervasyon Yap
1. Tekne seç
2. Tarih seç
3. Saat seç
4. Koltuk seç
5. Tur seç
6. Rezervasyonu tamamla

### 2. Console'u Aç (F12)
Rezervasyon yaparken console'da şunları kontrol et:

#### ✅ Rezervasyon Oluşturulurken:
```
🔍 Rezervasyon oluşturuluyor: {
  boatId: "abc123",
  boatName: "Deniz Yıldızı",
  date: "2025-10-28",
  timeSlotId: "0",           ← ÖNEMLİ!
  timeSlotDisplay: "09:00 - 12:00",
  seats: [1, 2, 3, 4],
  userId: "user123"
}

📦 Raw reservationData: { ... }
🚢 Boat data: { ... }
🎫 Tour type: { ... }

Firestore'a kaydedilecek rezervasyon: { ... }
Rezervasyon sonucu: { success: true, id: "res123" }
```

**Kontrol Et:**
- ✅ `timeSlotId` string mi? ("0", "1", "2")
- ✅ `date` formatı "YYYY-MM-DD" mi?
- ✅ `boatId` doğru mu?
- ✅ `success: true` mu?

---

### 3. Doluluk Hesaplanırken
Takvimde veya saat diliminde doluluk hesaplanırken:

```
🔍 Rezervasyonlar çekiliyor: {
  boatId: "abc123",
  date: "2025-10-28",
  timeSlotId: "0",
  timeSlotIdType: "string"   ← ÖNEMLİ!
}

✅ Bulunan rezervasyon sayısı: 1

📋 Rezervasyon detayı: {
  id: "res123",
  boatId: "abc123",
  date: "2025-10-28",
  timeSlotId: "0",           ← ÖNEMLİ!
  timeSlotIdType: "string",
  seats: [1, 2, 3, 4],
  status: "pending"
}

Saat doluluk - 2025-10-28 0: {
  rezervasyonSayisi: 1,
  doluKoltuklar: [1, 2, 3, 4],
  kapasite: 10,
  doluluk: 0.4               ← %40 dolu
}
```

**Kontrol Et:**
- ✅ `timeSlotId` eşleşiyor mu? (kayıt: "0", query: "0")
- ✅ `date` eşleşiyor mu?
- ✅ `boatId` eşleşiyor mu?
- ✅ Rezervasyon bulundu mu? (sayı > 0)
- ✅ Doluluk hesaplandı mı? (0.4 = %40)

---

### 4. Eğer Rezervasyon Bulunamadıysa

```
⚠️ Hiç rezervasyon bulunamadı! Query parametreleri: {
  boatId: "abc123",
  date: "2025-10-28",
  timeSlotId: "0"
}
```

**Olası Sorunlar:**

#### A) timeSlotId Uyumsuzluğu
```
Kayıt: timeSlotId: "0"     (string)
Query: timeSlotId: 0       (number)
❌ EŞLEŞMEZ!

Çözüm: Her ikisi de string olmalı
```

#### B) Tarih Formatı
```
Kayıt: date: "2025-10-28"
Query: date: "28/10/2025"
❌ EŞLEŞMEZ!

Çözüm: Her ikisi de "YYYY-MM-DD" formatında olmalı
```

#### C) boatId Uyumsuzluğu
```
Kayıt: boatId: "abc123"
Query: boatId: "xyz789"
❌ EŞLEŞMEZ!

Çözüm: Aynı tekne seçilmeli
```

---

## Firestore Kontrolü

### 1. Firebase Console'a Git
```
https://console.firebase.google.com
→ Projenizi seçin
→ Firestore Database
→ reservations koleksiyonu
```

### 2. Rezervasyonu Bul
En son eklenen rezervasyonu kontrol et:

```json
{
  "boatId": "abc123",
  "boatName": "Deniz Yıldızı",
  "date": "2025-10-28",
  "timeSlotId": "0",        ← STRING olmalı!
  "timeSlotDisplay": "09:00 - 12:00",
  "selectedSeats": [1, 2, 3, 4],
  "status": "pending",
  "userId": "user123",
  "createdAt": "2025-10-28T12:00:00.000Z"
}
```

**Kontrol Et:**
- ✅ `timeSlotId` tırnak içinde mi? ("0" ✅, 0 ❌)
- ✅ `date` doğru formatta mı? ("YYYY-MM-DD")
- ✅ `selectedSeats` array mi?
- ✅ `status` "pending" veya "confirmed" mi?

---

## Çözüm Adımları

### Sorun 1: timeSlotId Number Olarak Kaydediliyor
```typescript
// ❌ Yanlış
timeSlotId: reservationData.tour?.id  // number

// ✅ Doğru
timeSlotId: reservationData.tour?.id.toString()  // string
```

### Sorun 2: Tarih Formatı Yanlış
```typescript
// ❌ Yanlış
date: selectedDate.toLocaleDateString()  // "28/10/2025"

// ✅ Doğru
date: selectedDate.toISOString().split('T')[0]  // "2025-10-28"
```

### Sorun 3: Doluluk Hesaplanmıyor
```typescript
// Component'te useEffect dependency'leri kontrol et
useEffect(() => {
  fetchFullness();
}, [selectedDate, boatId, boatCapacity]);  // ← Bunlar değişince yeniden hesapla
```

---

## Başarılı Senaryo

### Console Çıktısı:
```
✅ Rezervasyon Kaydedildi
🔍 Rezervasyon oluşturuluyor: { timeSlotId: "0", date: "2025-10-28" }
✅ Firestore'a kaydedildi: { success: true }

✅ Doluluk Hesaplandı
🔍 Rezervasyonlar çekiliyor: { timeSlotId: "0", date: "2025-10-28" }
✅ Bulunan rezervasyon sayısı: 1
📋 Rezervasyon detayı: { seats: [1,2,3,4] }
✅ Saat doluluk: { doluluk: 0.4 }

✅ UI Güncellendi
📅 Takvim: 28 Ekim → 🟡 %40 dolu
⏰ Saat: 09:00-12:00 → 🟡 %40 dolu
💺 Koltuklar: 1,2,3,4 → 🔴 Dolu
```

---

## Hızlı Kontrol Listesi

- [ ] Console'da "Rezervasyon oluşturuluyor" görünüyor mu?
- [ ] `timeSlotId` string mi? ("0", "1", "2")
- [ ] `date` formatı "YYYY-MM-DD" mi?
- [ ] `success: true` görünüyor mu?
- [ ] Firestore'da rezervasyon var mı?
- [ ] "Rezervasyonlar çekiliyor" görünüyor mu?
- [ ] "Bulunan rezervasyon sayısı: 1" görünüyor mu?
- [ ] Doluluk hesaplandı mı? (0.4 = %40)
- [ ] UI'da doluluk gözüküyor mu?

---

## İletişim

Sorun devam ediyorsa console çıktısını paylaşın:
1. F12 → Console
2. Tüm log'ları kopyala
3. Paylaş

Özellikle şunları paylaşın:
- 🔍 Rezervasyon oluşturuluyor
- 📦 Raw reservationData
- ✅ Rezervasyon sonucu
- 🔍 Rezervasyonlar çekiliyor
- ✅ Bulunan rezervasyon sayısı
- ⚠️ Hiç rezervasyon bulunamadı (varsa)
