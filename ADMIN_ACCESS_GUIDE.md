# 🔑 Admin Panel Erişim Rehberi

## 🎯 Admin Panele Nasıl Ulaşılır?

### 1️⃣ **Dock Menüsünden** ⚓ (EN KOLAY)

Sayfanın altındaki Dock menüsünde yeni bir buton eklendi:

```
┌─────────────────────────────────────┐
│  🏠    📅    👤    ⚓    ⚙️         │
│  Ana  Rez.  Prof  Admin Ayar       │
└─────────────────────────────────────┘
```

**Adımlar:**
1. Sayfanın altındaki Dock menüsüne bak
2. **⚓ Anchor (Çapa)** ikonuna tıkla
3. ✅ Admin Panel açılır!

**Tooltip:** "Admin Panel"

---

### 2️⃣ **Direkt URL** 🔗

Tarayıcının adres çubuğuna yazarak:

```
http://localhost:3000/admin/boats
```

veya production'da:

```
https://yourdomain.com/admin/boats
```

---

### 3️⃣ **Navigation Menüsü** (Opsiyonel)

Eğer bir navbar eklerseniz, oraya da link ekleyebilirsiniz:

```tsx
<Link href="/admin/boats">
  <Anchor className="w-5 h-5" />
  Admin Panel
</Link>
```

---

## 🎨 Dock'taki Admin Butonu

### Görünüm:
- **İkon:** ⚓ Anchor (Çapa)
- **Label:** "Admin Panel"
- **Renk:** Diğer butonlarla aynı stil
- **Animasyon:** Hover'da büyüme efekti

### Konum:
```
Ana Sayfa → Rezervasyonlarım → Profil → [ADMIN PANEL] → Ayarlar
```

---

## 🔒 Güvenlik (Gelecek Adımlar)

Şu anda admin panel herkese açık. Güvenlik için:

### 1. Auth Kontrolü Ekle:

```tsx
// app/admin/boats/page.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function BoatsAdminPage() {
  const { user, userData } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Admin kontrolü
    if (!user || userData?.role !== 'admin') {
      router.push('/');
    }
  }, [user, userData, router]);

  // ... rest of code
}
```

### 2. Firestore'da Role Ekle:

```javascript
// users collection
{
  uid: "abc123",
  name: "Admin User",
  email: "admin@example.com",
  phone: "05551234567",
  role: "admin", // ← Ekle
  createdAt: "..."
}
```

### 3. Dock'ta Conditional Rendering:

```tsx
// DockWrapper.tsx
import { useAuth } from '@/context/AuthContext';

export default function DockWrapper() {
  const { userData } = useAuth();

  const items = [
    // ... diğer butonlar
    
    // Sadece admin görsün
    ...(userData?.role === 'admin' ? [{
      icon: <Anchor size={20} />,
      label: "Admin Panel",
      onClick: () => window.location.href = "/admin/boats",
    }] : []),
  ];

  return <Dock items={items} />;
}
```

---

## 📍 Admin Panel Sayfaları

### Mevcut:
- ✅ `/admin/boats` - Tekne Yönetimi

### Gelecekte Eklenebilir:
- `/admin/reservations` - Rezervasyon Yönetimi
- `/admin/users` - Kullanıcı Yönetimi
- `/admin/analytics` - İstatistikler
- `/admin/settings` - Genel Ayarlar

---

## 🎯 Hızlı Test

1. Uygulamayı başlat:
   ```bash
   npm run dev
   ```

2. Tarayıcıda aç:
   ```
   http://localhost:3000
   ```

3. Sayfanın altındaki Dock menüsünde **⚓ Anchor** ikonuna tıkla

4. ✅ Admin Panel açılmalı!

---

## 🎨 Dock Buton Sırası

```
1. 🏠 Ana Sayfa        → /
2. 📅 Rezervasyonlarım → /rezervasyon
3. 👤 Profil           → /profile
4. ⚓ Admin Panel      → /admin/boats  ← YENİ!
5. ⚙️ Ayarlar          → (yakında)
```

---

## ✨ Özet

✅ **Dock'a Admin Butonu Eklendi** → ⚓ Anchor ikonu  
✅ **Direkt Erişim** → `/admin/boats`  
✅ **Kolay Ulaşım** → Sayfanın altındaki menüden  
✅ **Görsel Geri Bildirim** → Hover animasyonları  

Admin panele artık tek tıkla ulaşabilirsin! 🚀
