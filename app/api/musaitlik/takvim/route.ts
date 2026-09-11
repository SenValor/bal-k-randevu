import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

interface TimeSlot {
  start: string;
  end: string;
  displayName: string;
}

interface ScheduledTimeSlots {
  effectiveDate: string;
  timeSlots: TimeSlot[];
}

function getTimeSlotsForDate(
  scheduledTimeSlots: ScheduledTimeSlots[] | undefined,
  fallbackTimeSlots: TimeSlot[],
  targetDate: string
): TimeSlot[] {
  if (!scheduledTimeSlots || scheduledTimeSlots.length === 0) return fallbackTimeSlots;
  const sorted = [...scheduledTimeSlots].sort(
    (a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime()
  );
  for (const schedule of sorted) {
    if (schedule.effectiveDate <= targetDate) return schedule.timeSlots;
  }
  return fallbackTimeSlots;
}

// Takvim doluluk oranları — 0=boş, 0.5=kısmen dolu, 1=tamamen dolu
export async function POST(request: NextRequest) {
  try {
    const { boatId, startDate, endDate, capacity, timeSlotCount, timeSlots, scheduledTimeSlots } =
      await request.json();

    if (!boatId || !startDate || !endDate || !capacity) {
      return NextResponse.json({ success: false, error: 'Eksik parametre' }, { status: 400 });
    }

    const [snapshot, snapshotOld] = await Promise.all([
      adminDb
        .collection('reservations')
        .where('boatId', '==', boatId)
        .where('date', '>=', startDate)
        .where('date', '<=', endDate)
        .where('status', 'in', ['pending', 'confirmed'])
        .get(),
      adminDb
        .collection('reservations')
        .where('selectedBoat', '==', boatId)
        .where('status', 'in', ['pending', 'confirmed', 'waiting'])
        .get(),
    ]);

    // Rezervasyonları tarih bazında grupla
    const reservationsByDate = new Map<string, { timeSlotId: string; selectedSeats: number[] }[]>();

    const addToMap = (dateKey: string, timeSlotId: string, selectedSeats: number[]) => {
      if (!reservationsByDate.has(dateKey)) reservationsByDate.set(dateKey, []);
      reservationsByDate.get(dateKey)!.push({ timeSlotId, selectedSeats });
    };

    snapshot.forEach(doc => {
      const data = doc.data();
      let dateKey = data.date as string;
      if (dateKey?.includes('T')) dateKey = dateKey.split('T')[0];
      if (dateKey) {
        addToMap(dateKey, data.timeSlotId || 'unknown', Array.isArray(data.selectedSeats) ? data.selectedSeats : []);
      }
    });

    // Eski format — tarih filtresi ve koltuk dönüşümü
    const startObj = new Date(startDate);
    const endObj = new Date(endDate);
    snapshotOld.forEach(doc => {
      const data = doc.data();
      let resDate: Date | null = null;
      if (data.selectedDate) {
        resDate = typeof data.selectedDate === 'string'
          ? new Date(data.selectedDate)
          : data.selectedDate.toDate?.() ?? null;
      }
      if (!resDate || resDate < startObj || resDate > endObj) return;
      const dateKey = resDate.toISOString().split('T')[0];
      const seats: number[] = (Array.isArray(data.selectedSeats) ? data.selectedSeats : [])
        .map((s: unknown) => {
          if (typeof s === 'string') {
            const parts = s.split('_');
            if (parts.length === 2) {
              const side = parts[1].substring(0, 2);
              const num = parseInt(parts[1].substring(2));
              return side === 'SA' ? num + 6 : num;
            }
          }
          return typeof s === 'number' ? s : 0;
        })
        .filter((n: number) => n > 0);
      addToMap(dateKey, data.timeSlotId || 'unknown', seats);
    });

    // Her gün için doluluk hesapla
    const fullnessMap: Record<string, number> = {};
    reservationsByDate.forEach((daySlots, date) => {
      const bySlot = new Map<string, number[]>();
      daySlots.forEach(({ timeSlotId, selectedSeats }) => {
        if (!bySlot.has(timeSlotId)) bySlot.set(timeSlotId, []);
        bySlot.get(timeSlotId)!.push(...selectedSeats);
      });

      let activeSlotCount = timeSlotCount || 1;
      if (timeSlots?.length > 0) {
        const active = getTimeSlotsForDate(scheduledTimeSlots, timeSlots, date);
        activeSlotCount = active.length || 1;
      }

      let fullSlotCount = 0;
      let hasAnyReservation = false;
      bySlot.forEach(seats => {
        const unique = new Set(seats).size;
        if (unique > 0) hasAnyReservation = true;
        if (unique / capacity >= 1) fullSlotCount++;
      });

      if (activeSlotCount > 0 && fullSlotCount >= activeSlotCount) {
        fullnessMap[date] = 1;
      } else if (hasAnyReservation) {
        fullnessMap[date] = 0.5;
      }
    });

    return NextResponse.json({ success: true, fullnessMap });
  } catch {
    return NextResponse.json({ success: false, error: 'Sunucu hatası' }, { status: 500 });
  }
}
