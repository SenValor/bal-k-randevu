import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

function generateReservationNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 900000) + 100000;
  return `BS-${year}-${random}`;
}

function extractTourName(s: string) {
  if (!s) return '';
  const m = s.match(/^([^(]+)/);
  return m ? m[1].trim().toLowerCase() : s.toLowerCase().trim();
}

function extractTimeRange(s: string) {
  if (!s) return null;
  const m = s.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
  return m ? `${m[1]}-${m[2]}` : null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reservationData, timeSlotStart, timeSlotEnd, promoCodeId } = body;

    if (!reservationData?.boatId || !reservationData?.date || !reservationData?.selectedSeats) {
      return NextResponse.json({ success: false, error: 'Eksik rezervasyon verisi' }, { status: 400 });
    }

    const reservationNumber = generateReservationNumber();
    const newDocRef = adminDb.collection('reservations').doc();

    const targetTourName = extractTourName(reservationData.timeSlotDisplay || '');
    const targetRange = timeSlotStart && timeSlotEnd ? `${timeSlotStart}-${timeSlotEnd}` : null;

    let conflictingSeats: number[] = [];

    await adminDb.runTransaction(async (transaction) => {
      // Aynı tekne + tarih + aktif rezervasyonları çek (koltuk çakışması kontrolü için)
      const q = adminDb
        .collection('reservations')
        .where('boatId', '==', reservationData.boatId)
        .where('date', '==', reservationData.date)
        .where('status', 'in', ['pending', 'confirmed']);

      const snapshot = await transaction.get(q);

      const occupiedSeats: number[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (!data.timeSlotDisplay) return;

        const resTourName = extractTourName(data.timeSlotDisplay);
        const resRange = extractTimeRange(data.timeSlotDisplay);

        const rangeMatches = targetRange && resRange && targetRange === resRange;
        const idMatches = data.timeSlotId === reservationData.timeSlotId;
        const nameOnlyMatches = !resRange && targetTourName && resTourName === targetTourName;

        if ((rangeMatches || idMatches || nameOnlyMatches) && Array.isArray(data.selectedSeats)) {
          occupiedSeats.push(...data.selectedSeats);
        }
      });

      conflictingSeats = (reservationData.selectedSeats as number[]).filter(s =>
        occupiedSeats.includes(s)
      );

      if (conflictingSeats.length > 0) {
        throw new Error(`SEAT_CONFLICT:${conflictingSeats.join(',')}`);
      }

      transaction.set(newDocRef, {
        ...reservationData,
        status: 'pending',
        reservationNumber,
        createdAt: new Date().toISOString(),
      });

      // Promo kod kullanımını artır (admin SDK ile yazabilir)
      if (promoCodeId) {
        const promoRef = adminDb.collection('promoCodes').doc(promoCodeId);
        const promoSnap = await transaction.get(promoRef);
        if (promoSnap.exists) {
          const current = promoSnap.data()?.usageCount || 0;
          transaction.update(promoRef, { usageCount: current + 1 });
        }
      }
    });

    return NextResponse.json({ success: true, id: newDocRef.id, reservationNumber });
  } catch (error: any) {
    if (error?.message?.startsWith('SEAT_CONFLICT:')) {
      const seats = error.message.replace('SEAT_CONFLICT:', '');
      return NextResponse.json({
        success: false,
        conflictingSeats: seats.split(',').map(Number),
        error: `Seçtiğiniz koltuklar (${seats}) az önce başkası tarafından alındı. Lütfen geri dönüp farklı koltuk seçin.`,
      });
    }
    return NextResponse.json({ success: false, error: 'Rezervasyon eklenirken bir hata oluştu' }, { status: 500 });
  }
}
