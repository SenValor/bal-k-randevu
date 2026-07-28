#!/usr/bin/env node
'use strict';

const admin = require('firebase-admin');
const path  = require('path');
const fs    = require('fs');

const SA_PATH = path.join(__dirname, 'serviceAccountKey.json');
if (!fs.existsSync(SA_PATH)) {
  console.error('\n❌  scripts/serviceAccountKey.json bulunamadı!');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(require(SA_PATH)),
  projectId: 'baliksefasi-developer',
});

const db = admin.firestore();

async function inspect() {
  const START = '2026-07-25';
  const END   = '2026-07-31';

  console.log(`\n🔍  Rezervasyon İnceleme: ${START} → ${END}`);
  console.log('═'.repeat(70));

  // ── Tüm rezervasyonları çek (date alanı ne olursa olsun yakalayalım)
  const snap = await db.collection('reservations').get();
  console.log(`\n📦  Firestore'daki toplam rezervasyon: ${snap.size}\n`);

  const results = [];

  snap.forEach(doc => {
    const d = doc.data();

    // date alanını normalize et
    let rawDate  = d.date ?? d.selectedDate ?? null;
    let dateStr  = null;
    let dateType = typeof rawDate;

    if (rawDate === null || rawDate === undefined) {
      dateStr  = '(yok)';
      dateType = 'missing';
    } else if (rawDate && typeof rawDate.toDate === 'function') {
      // Firestore Timestamp
      const jsDate = rawDate.toDate();
      dateStr  = jsDate.toISOString();
      dateType = 'Timestamp';
    } else if (rawDate && typeof rawDate._seconds === 'number') {
      // Serialize edilmiş Timestamp
      const jsDate = new Date(rawDate._seconds * 1000);
      dateStr  = jsDate.toISOString();
      dateType = 'SerializedTimestamp';
    } else if (typeof rawDate === 'string') {
      dateStr  = rawDate;
      dateType = 'string';
    } else {
      dateStr  = String(rawDate);
      dateType = typeof rawDate;
    }

    // Tarih aralığı filtresi (normalize edilmiş)
    const normalized = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    if (normalized < START || normalized > END) return;

    results.push({
      id:              doc.id.slice(0, 12) + '…',
      dateRaw:         dateStr,
      dateType,
      dateNorm:        normalized,
      boatId:          d.boatId          ?? d.selectedBoat ?? '(yok)',
      status:          d.status          ?? '(yok)',
      timeSlotId:      d.timeSlotId      ?? '(yok)',
      timeSlotIdType:  typeof d.timeSlotId,
      timeSlotDisplay: d.timeSlotDisplay ?? d.selectedTime ?? '(yok)',
      seatCount:       Array.isArray(d.selectedSeats) ? d.selectedSeats.length : 0,
      hasSelectedBoat: 'selectedBoat' in d,
      migratedFrom:    d._migratedFrom   ?? '—',
    });
  });

  if (results.length === 0) {
    console.log('❌  Bu tarih aralığında rezervasyon bulunamadı.');
    process.exit(0);
  }

  // Tarihe göre sırala
  results.sort((a, b) => a.dateNorm.localeCompare(b.dateNorm));

  console.log(`✅  ${results.length} rezervasyon bulundu\n`);

  // ── Özet tablo
  const pad = (s, n) => String(s ?? '').slice(0, n).padEnd(n);

  console.log(
    pad('ID', 14) +
    pad('BOAT_ID', 24) +
    pad('NORM', 12) +
    pad('STATUS', 12) +
    pad('SEATS', 6) +
    pad('SLOT_ID', 10) +
    pad('SLOT_ID_TYPE', 14) +
    'SLOT_DISPLAY'
  );
  console.log('─'.repeat(150));

  results.forEach(r => {
    console.log(
      pad(r.id, 14) +
      pad(r.boatId, 24) +
      pad(r.dateNorm, 12) +
      pad(r.status, 12) +
      pad(r.seatCount, 6) +
      pad(r.timeSlotId, 10) +
      pad(r.timeSlotIdType, 14) +
      r.timeSlotDisplay
    );
  });

  // ── Date type dağılımı
  console.log('\n\n📊  DATE ALANI TİP DAĞILIMI:');
  const typeCounts = {};
  results.forEach(r => { typeCounts[r.dateType] = (typeCounts[r.dateType] || 0) + 1; });
  Object.entries(typeCounts).forEach(([t, c]) => console.log(`    ${t}: ${c} rezervasyon`));

  // ── hasSelectedBoat dağılımı
  const oldCount = results.filter(r => r.hasSelectedBoat).length;
  console.log(`\n📊  selectedBoat ALANI OLAN: ${oldCount} (eski format)`);
  console.log(`📊  selectedBoat ALANI YOK : ${results.length - oldCount} (yeni format)`);

  // ── Tam format olmayanlar (tarih string "YYYY-MM-DD" değilse)
  const broken = results.filter(r => r.dateType !== 'string' || r.dateRaw.includes('T') || r.dateRaw === '(yok)');
  if (broken.length > 0) {
    console.log(`\n⚠️   SORUNLU DATE FORMATI OLAN ${broken.length} REZERVASYON:`);
    broken.forEach(r => {
      console.log(`  ${r.id}  date="${r.dateRaw}"  type=${r.dateType}  norm=${r.dateNorm}  status=${r.status}`);
    });
  } else {
    console.log('\n✅  Tüm rezervasyonların date alanı "YYYY-MM-DD" string formatında.');
  }

  console.log('\n');
}

inspect().catch(err => {
  console.error('\n❌  Hata:', err.message || err);
  process.exit(1);
});
