import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

// Koltuk müsaitliği — sadece koltuk numaraları döner, müşteri verisi yok
export async function POST(request: NextRequest) {
  try {
    const { boatId, date } = await request.json();

    if (!boatId || !date) {
      return NextResponse.json({ success: false, error: 'boatId ve date gerekli' }, { status: 400 });
    }

    const [snapshot, snapshotOld] = await Promise.all([
      adminDb
        .collection('reservations')
        .where('boatId', '==', boatId)
        .where('date', '==', date)
        .where('status', 'in', ['pending', 'confirmed'])
        .get(),
      adminDb
        .collection('reservations')
        .where('selectedBoat', '==', boatId)
        .where('selectedDate', '==', date)
        .where('status', 'in', ['pending', 'confirmed', 'waiting'])
        .get(),
    ]);

    const slots: { timeSlotId: string; timeSlotDisplay: string; selectedSeats: number[] }[] = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      slots.push({
        timeSlotId: data.timeSlotId || '',
        timeSlotDisplay: data.timeSlotDisplay || '',
        selectedSeats: Array.isArray(data.selectedSeats) ? data.selectedSeats : [],
      });
    });

    // Eski format — koltuk kodlarını numaraya çevir (T1_IS4 → 4, T1_SA2 → 8)
    snapshotOld.forEach(doc => {
      const data = doc.data();
      const seatNumbers: number[] = (Array.isArray(data.selectedSeats) ? data.selectedSeats : [])
        .map((seat: unknown) => {
          if (typeof seat === 'string') {
            const parts = seat.split('_');
            if (parts.length === 2) {
              const side = parts[1].substring(0, 2);
              const num = parseInt(parts[1].substring(2));
              return side === 'SA' ? num + 6 : num;
            }
          }
          return typeof seat === 'number' ? seat : 0;
        })
        .filter((n: number) => n > 0);
      slots.push({
        timeSlotId: data.timeSlotId || '',
        timeSlotDisplay: data.timeSlotDisplay || '',
        selectedSeats: seatNumbers,
      });
    });

    return NextResponse.json({ success: true, slots });
  } catch {
    return NextResponse.json({ success: false, error: 'Sunucu hatası' }, { status: 500 });
  }
}
