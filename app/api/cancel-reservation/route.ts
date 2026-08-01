import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '').replace(/^90/, '').replace(/^0/, '');
}

export async function POST(request: NextRequest) {
  try {
    const { reservationNumber, phone } = await request.json();

    if (!reservationNumber || !phone) {
      return NextResponse.json(
        { success: false, error: 'Rezervasyon numarası ve telefon gerekli' },
        { status: 400 }
      );
    }

    const snapshot = await adminDb
      .collection('reservations')
      .where('reservationNumber', '==', reservationNumber.toUpperCase().trim())
      .get();

    if (snapshot.empty) {
      return NextResponse.json(
        { success: false, error: 'Rezervasyon bulunamadı' },
        { status: 404 }
      );
    }

    const docSnap = snapshot.docs[0];
    const reservation = docSnap.data();

    const inputNorm = normalizePhone(phone);
    const storedNorm = normalizePhone(reservation.userPhone || '');

    if (inputNorm.length < 10 || inputNorm !== storedNorm) {
      return NextResponse.json(
        { success: false, error: 'Telefon numarası eşleşmiyor' },
        { status: 403 }
      );
    }

    if (reservation.status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: 'Bu rezervasyon zaten iptal edilmiş' },
        { status: 400 }
      );
    }

    await docSnap.ref.update({
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
      cancelledAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
