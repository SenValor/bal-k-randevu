import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const { type, value } = await request.json();

    if (!type || !value) {
      return NextResponse.json({ success: false, error: 'Geçersiz istek' }, { status: 400 });
    }

    if (type === 'number') {
      const snapshot = await adminDb
        .collection('reservations')
        .where('reservationNumber', '==', String(value).toUpperCase().trim())
        .get();

      if (snapshot.empty) {
        return NextResponse.json({ success: false, error: 'Rezervasyon bulunamadı' });
      }

      const doc = snapshot.docs[0];
      return NextResponse.json({ success: true, reservation: { id: doc.id, ...doc.data() } });
    }

    if (type === 'phone') {
      const cleanPhone = String(value).replace(/\D/g, '');
      if (!cleanPhone || cleanPhone.length < 10) {
        return NextResponse.json({ success: false, error: 'Geçerli bir telefon numarası girin' });
      }

      const phoneWithZero = cleanPhone.startsWith('0') ? cleanPhone : '0' + cleanPhone;
      const phoneWithoutZero = cleanPhone.startsWith('0') ? cleanPhone.substring(1) : cleanPhone;

      const snapshot = await adminDb
        .collection('reservations')
        .where('userPhone', 'in', [phoneWithZero, phoneWithoutZero])
        .get();

      if (snapshot.empty) {
        return NextResponse.json({
          success: false,
          error: 'Bu telefon numarası ile kayıtlı rezervasyon bulunamadı',
        });
      }

      const reservations = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return NextResponse.json({ success: true, reservations });
    }

    return NextResponse.json({ success: false, error: 'Geçersiz sorgu tipi' }, { status: 400 });
  } catch {
    return NextResponse.json({ success: false, error: 'Sunucu hatası' }, { status: 500 });
  }
}
