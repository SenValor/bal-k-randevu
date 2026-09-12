import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Yetkilendirme gerekli' }, { status: 401 });
    }

    let uid: string;
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      uid = decoded.uid;
    } catch {
      return NextResponse.json({ success: false, error: 'Geçersiz token' }, { status: 401 });
    }

    const { reservationId } = await request.json();
    if (!reservationId) {
      return NextResponse.json({ success: false, error: 'reservationId gerekli' }, { status: 400 });
    }

    const ref = adminDb.collection('reservations').doc(reservationId);
    const snap = await ref.get();

    if (!snap.exists) {
      return NextResponse.json({ success: false, error: 'Rezervasyon bulunamadı' }, { status: 404 });
    }

    const data = snap.data()!;
    if (data.userId !== uid) {
      return NextResponse.json({ success: false, error: 'Bu rezervasyon size ait değil' }, { status: 403 });
    }

    if (data.status === 'cancelled') {
      return NextResponse.json({ success: false, error: 'Rezervasyon zaten iptal edilmiş' }, { status: 400 });
    }

    await ref.update({
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
      cancelledAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: 'Sunucu hatası' }, { status: 500 });
  }
}
