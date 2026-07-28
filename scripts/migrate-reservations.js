#!/usr/bin/env node
/**
 * Eski format rezervasyonları yeni formata taşıma scripti
 *
 * Problem:
 *   Eski sistemdeki rezervasyonlar (selectedBoat, selectedDate, selectedTime alanlarıyla)
 *   mobil uygulamada görünmüyor çünkü mobil sadece (boatId, date) alanlarını sorgular.
 *
 * Çözüm:
 *   Bu script Firestore'daki her eski format rezervasyona yeni format alanları ekler.
 *   Eski alanlar SILINMEZ — veri kaybı yok. Sadece yeni alanlar eklenir.
 *
 * Kullanım:
 *   1. Firebase Console > Project Settings > Service accounts > "Generate new private key"
 *   2. İndirilen dosyayı  scripts/serviceAccountKey.json  olarak kaydet
 *   3. node scripts/migrate-reservations.js --dry-run   ← önce bunu çalıştır (preview)
 *   4. node scripts/migrate-reservations.js             ← gerçek migration
 */

'use strict';

const admin = require('firebase-admin');
const path  = require('path');
const fs    = require('fs');

// ── Service Account ──────────────────────────────────────────────────────────

const SA_PATH = path.join(__dirname, 'serviceAccountKey.json');
if (!fs.existsSync(SA_PATH)) {
  console.error('\n❌  scripts/serviceAccountKey.json bulunamadı!');
  console.error('   Firebase Console → Project Settings → Service accounts');
  console.error('   → "Generate new private key" → indirip bu klasöre koy\n');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(require(SA_PATH)),
  projectId: 'baliksefasi-developer',
});

const db     = admin.firestore();
const DRY    = process.argv.includes('--dry-run');

// ── Yardımcı fonksiyonlar ────────────────────────────────────────────────────

/** Firestore Timestamp / ISO string / plain Date → "YYYY-MM-DD" */
function toDateStr(val) {
  if (!val) return null;

  // Firestore Admin SDK Timestamp
  if (val && typeof val.toDate === 'function') {
    return localDateStr(val.toDate());
  }

  // {_seconds, _nanoseconds} serileştirilmiş Timestamp
  if (val && typeof val._seconds === 'number') {
    return localDateStr(new Date(val._seconds * 1000));
  }

  // String
  if (typeof val === 'string') {
    // "2026-07-31T..." → "2026-07-31"
    return val.includes('T') ? val.split('T')[0] : val;
  }

  return null;
}

/**
 * JavaScript Date → "YYYY-MM-DD" YEREL saatle (Türkiye UTC+3).
 * Timestamp UTC gece yarısı kaydedilmişse yerel tarih değerini korur.
 * Güvenli yol: tarihe 12 saat ekle → öğlen → hangi timezone'da da olsa doğru gün.
 */
function localDateStr(date) {
  const safeDate = new Date(date.getTime() + 12 * 60 * 60 * 1000); // +12h
  const y = safeDate.getUTCFullYear();
  const m = String(safeDate.getUTCMonth() + 1).padStart(2, '0');
  const d = String(safeDate.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Eski format koltuk kodlarını sayısal koltuk numaralarına çevirir.
 * "T1_IS4" → 4   (İskele / port)
 * "T1_SA2" → 8   (Sancak / starboard, halfCap=6 için 2+6=8)
 */
function convertSeats(seats, halfCap) {
  if (!Array.isArray(seats)) return [];
  return seats.map(seat => {
    if (typeof seat === 'number') return seat;
    if (typeof seat === 'string') {
      const parts = seat.split('_');
      if (parts.length === 2) {
        const side = parts[1].substring(0, 2);   // "IS" veya "SA"
        const num  = parseInt(parts[1].substring(2), 10);
        if (!isNaN(num)) return side === 'SA' ? num + halfCap : num;
      }
    }
    return 0;
  }).filter(n => n > 0);
}

function genReservationNumber() {
  const y   = new Date().getFullYear();
  const rnd = Math.floor(Math.random() * 90_000_000) + 10_000_000;
  return `BS-${y}-${rnd}`;
}

// ── Ana migration ─────────────────────────────────────────────────────────────

async function migrate() {
  console.log('\n🚢  Balık Sefası — Rezervasyon Migration');
  console.log('═'.repeat(54));
  console.log(DRY
    ? '🔍  MOD: DRY RUN — Firestore\'a hiçbir şey yazılmayacak\n'
    : '⚡  MOD: CANLI  — Firestore gerçekten güncellenecek\n'
  );

  // ── 1. Tekneleri önbelleğe al (kapasite bilgisi için)
  console.log('📋  Tekneler yükleniyor...');
  const boatsSnap = await db.collection('boats').get();
  /** @type {Record<string,number>} */
  const capacityOf = {};
  boatsSnap.forEach(d => { capacityOf[d.id] = d.data().capacity || 12; });
  console.log(`    ${boatsSnap.size} tekne yüklendi\n`);

  // ── 2. Eski format rezervasyonları çek
  //       Eski format ayırt edici özelliği: "selectedBoat" alanının varlığı
  console.log('🔍  Eski format rezervasyonlar aranıyor...');
  const snap = await db.collection('reservations')
    .where('selectedBoat', '!=', null)
    .get();
  console.log(`    ${snap.size} doküman bulundu\n`);

  if (snap.size === 0) {
    console.log('✅  Taşınacak rezervasyon yok. Migration zaten tamamlanmış!');
    process.exit(0);
  }

  // ── 3. İşle
  let batch     = db.batch();
  let batchCnt  = 0;
  let migrated  = 0;
  let skipped   = 0;
  let errored   = 0;

  for (const doc of snap.docs) {
    const d = doc.data();

    // Zaten migrate edilmiş (hem boatId hem işaret varsa atla)
    if (d.boatId && d._migratedFrom === 'old-format') {
      skipped++;
      continue;
    }

    const boatId = d.selectedBoat;
    if (!boatId) {
      console.warn(`  ⚠️  ${doc.id}: selectedBoat boş → atlanıyor`);
      errored++;
      continue;
    }

    const capacity = capacityOf[boatId] || 12;
    const halfCap  = Math.ceil(capacity / 2);

    // Tarih
    const dateStr = toDateStr(d.selectedDate);
    if (!dateStr) {
      console.warn(`  ⚠️  ${doc.id}: selectedDate dönüştürülemedi → atlanıyor`);
      errored++;
      continue;
    }

    // Koltuklar
    const rawSeats       = d.selectedSeats || [];
    const numericSeats   = convertSeats(rawSeats, halfCap);
    const seatCodes      = rawSeats.filter(s => typeof s === 'string');

    // Saat gösterimi
    const timeSlotDisplay = d.selectedTime || '';

    // Kullanıcı bilgileri (misafir veya üye)
    const guest     = d.guestInfos?.[0] || {};
    const userName  = guest.name  || d.userName  || 'Misafir';
    const userEmail = guest.email || d.userEmail || '';
    const userPhone = guest.phone || d.userPhone || '';

    // Rezervasyon numarası — varsa koru, yoksa üret
    const reservationNumber = d.reservationNumber || genReservationNumber();

    // Status normalizasyonu: "waiting" → "pending"
    const status = d.status === 'waiting' ? 'pending' : (d.status || 'pending');

    const newFields = {
      // ── Yeni format zorunlu alanlar ──────────────────
      boatId,
      boatName:    d.boatName || '',
      date:        dateStr,
      timeSlotId:  '0',           // eski sistemde slot indeksi yok, 0'a eşle
      timeSlotDisplay,            // saat aralığı eşleştirmede kullanılır
      userId:      d.userId || 'guest',
      userName,
      userEmail,
      userPhone,
      selectedSeats:     numericSeats,   // sayısal koltuk numaraları
      selectedSeatCodes: seatCodes,      // orijinal kod dizisi (T1_IS4 gibi)
      adultCount:   d.ageGroups?.adults   || 0,
      childCount:   d.ageGroups?.children || 0,
      babyCount:    d.ageGroups?.babies   || 0,
      totalPeople:  d.guestCount || numericSeats.length,
      totalPrice:   d.totalAmount || 0,
      tourId:       d.tourType    || '',
      tourName:     d.priceDetails || '',
      status,
      reservationNumber,
      // ── Migration işareti ────────────────────────────
      _migratedFrom: 'old-format',
      _migratedAt:   admin.firestore.FieldValue.serverTimestamp(),
    };

    // Log
    console.log(
      `  ✅  ${doc.id.slice(0, 10)}… ` +
      `| ${dateStr} ` +
      `| "${timeSlotDisplay || '(saat yok)'}" ` +
      `| koltuk: [${numericSeats.join(', ')}] ` +
      `| status: ${status}`
    );

    if (!DRY) {
      batch.update(doc.ref, newFields);
      batchCnt++;

      // Firestore batch limiti 500 → 400'de bir commit et
      if (batchCnt >= 400) {
        await batch.commit();
        console.log(`\n  💾  Batch commit edildi (${batchCnt} kayıt)\n`);
        batch    = db.batch();
        batchCnt = 0;
      }
    }

    migrated++;
  }

  // Son batch
  if (!DRY && batchCnt > 0) {
    await batch.commit();
    console.log(`\n  💾  Son batch commit edildi (${batchCnt} kayıt)\n`);
  }

  // ── Sonuç ─────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(54));
  console.log('📊  Sonuç:');
  console.log(`    ✅  Migrate edildi  : ${migrated}`);
  console.log(`    ⏭️   Zaten migrate  : ${skipped}`);
  console.log(`    ❌  Hata / atlandı : ${errored}`);

  if (DRY) {
    console.log('\n⚠️   Bu bir DRY RUN — Firestore\'da değişiklik YOK.');
    console.log('    Gerçek migration için --dry-run olmadan tekrar çalıştır:\n');
    console.log('    node scripts/migrate-reservations.js\n');
  } else {
    console.log('\n🎉  Migration tamamlandı!');
    console.log('    Mobil artık tüm rezervasyonları doğru gösterecek.\n');
  }
}

migrate().catch(err => {
  console.error('\n❌  Fatal hata:', err.message || err);
  process.exit(1);
});
