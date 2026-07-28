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

const BOAT_ID  = 'IzOWFcdSopUdQZDaLMQh';
const TARGET   = '2026-07-31';

async function main() {
  // ── 1. Tekne verisini çek
  const boatDoc = await db.collection('boats').doc(BOAT_ID).get();
  if (!boatDoc.exists) { console.error('Tekne bulunamadı!'); process.exit(1); }
  const boat = boatDoc.data();

  console.log(`\n🚢  Tekne: ${boat.name}  (kapasite: ${boat.capacity})\n`);

  console.log('📅  Varsayılan timeSlots:');
  (boat.timeSlots || []).forEach((s, i) => {
    console.log(`    [${i}] ${s.displayName}  ${s.start} - ${s.end}`);
  });

  const scheduled = boat.scheduledTimeSlots || [];
  console.log(`\n📅  scheduledTimeSlots (${scheduled.length} kayıt):`);
  if (scheduled.length === 0) {
    console.log('    (yok)');
  } else {
    scheduled.sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate));
    scheduled.forEach(sch => {
      console.log(`  effectiveDate: ${sch.effectiveDate}`);
      (sch.timeSlots || []).forEach((s, i) => {
        console.log(`    [${i}] ${s.displayName}  ${s.start} - ${s.end}`);
      });
    });
  }

  // ── getTimeSlotsForDate mantığını simüle et
  let activeSlots = boat.timeSlots || [];
  if (scheduled.length > 0) {
    const sorted = [...scheduled].sort(
      (a, b) => new Date(b.effectiveDate) - new Date(a.effectiveDate)
    );
    for (const sch of sorted) {
      if (sch.effectiveDate <= TARGET) {
        activeSlots = sch.timeSlots;
        console.log(`\n✅  ${TARGET} için aktif schedule: effectiveDate=${sch.effectiveDate}`);
        break;
      }
    }
  }

  console.log(`\n🎯  ${TARGET} için mobile'da gösterilecek slot'lar:`);
  activeSlots.forEach((s, i) => {
    console.log(`    [${i}] ${s.displayName}  ${s.start} - ${s.end}  (targetSlotId="${i}")`);
  });

  // ── 2. Bu teknenin 31 Temmuz rezervasyonlarını çek
  const snap = await db.collection('reservations')
    .where('boatId', '==', BOAT_ID)
    .where('date', '==', TARGET)
    .where('status', 'in', ['pending', 'confirmed'])
    .get();

  console.log(`\n📦  ${TARGET} için confirmed/pending rezervasyon: ${snap.size}\n`);

  if (snap.size === 0) { console.log('Rezervasyon yok.'); return; }

  const pad = (s, n) => String(s ?? '').slice(0, n).padEnd(n);

  console.log(
    pad('ID', 14) +
    pad('STATUS', 12) +
    pad('SEATS', 6) +
    pad('SLOT_ID', 10) +
    pad('SEAT_NUMBERS', 40) +
    'DISPLAY'
  );
  console.log('─'.repeat(140));

  const reservations = [];
  snap.forEach(doc => {
    const d = doc.data();
    reservations.push(d);
    const seatNums = (d.selectedSeats || []).sort((a, b) => a - b).join(',');
    console.log(
      pad(doc.id.slice(0, 12) + '…', 14) +
      pad(d.status, 12) +
      pad(Array.isArray(d.selectedSeats) ? d.selectedSeats.length : 0, 6) +
      pad(d.timeSlotId, 10) +
      pad(seatNums, 40) +
      (d.timeSlotDisplay || '')
    );
  });

  // ── 3. slot eşleştirme simülasyonu
  function extractTimeRange(display) {
    if (!display) return null;
    const m = display.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
    return m ? `${m[1]}-${m[2]}` : null;
  }

  function slotMatches(resDisplay, resSlotId, targetDisplay, targetSlotId) {
    const targetRange = extractTimeRange(targetDisplay);
    const resRange    = extractTimeRange(resDisplay);
    const t1 = targetRange && resRange && targetRange === resRange;
    const t2 = resSlotId != null && targetSlotId != null && String(resSlotId) === String(targetSlotId);
    return { matches: t1 || t2, tier: t1 ? 1 : t2 ? 2 : 0 };
  }

  function getOccupiedSeats(matching) {
    const all = [];
    matching.forEach(r => { if (Array.isArray(r.selectedSeats)) all.push(...r.selectedSeats); });
    return [...new Set(all)];
  }

  console.log('\n\n🔍  slotMatches simülasyonu:\n');
  activeSlots.forEach((slot, idx) => {
    const targetDisplay = `${slot.displayName} (${slot.start} - ${slot.end})`;
    const targetSlotId  = String(idx);
    const targetRange   = extractTimeRange(targetDisplay);

    console.log(`Slot [${idx}] → targetDisplay="${targetDisplay}"  targetRange="${targetRange}"  targetSlotId="${targetSlotId}"`);

    const matching = [];
    snap.forEach(doc => {
      const d = doc.data();
      const { matches, tier } = slotMatches(d.timeSlotDisplay, d.timeSlotId, targetDisplay, targetSlotId);
      const resRange = extractTimeRange(d.timeSlotDisplay || '');
      console.log(
        `    ${matches ? '✅' : '❌'}  ${doc.id.slice(0, 10)}  slotId=${d.timeSlotId}  resRange=${resRange}  tier=${tier}`
      );
      if (matches) matching.push(d);
    });

    const hasPrivateTour = matching.some(r => r.tourCategory === 'private');
    const occupied = hasPrivateTour ? boat.capacity : getOccupiedSeats(matching).length;
    console.log(`    → occupied=${occupied}  hasPrivateTour=${hasPrivateTour}  isFull=${occupied >= boat.capacity}\n`);
  });
}

main().catch(err => {
  console.error('\n❌  Hata:', err.message || err);
  process.exit(1);
});
