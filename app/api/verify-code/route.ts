import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';

function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) return '90' + cleaned.substring(1);
  if (cleaned.startsWith('90')) return cleaned;
  return '90' + cleaned;
}

export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json();
    if (!phone || !code) {
      return NextResponse.json({ success: false, error: 'Telefon ve kod gerekli' }, { status: 400 });
    }

    const formattedPhone = formatPhone(phone);

    const q = adminDb.collection('verification_codes')
      .where('phone', '==', formattedPhone)
      .where('code', '==', code)
      .where('verified', '==', false)
      .limit(1);

    const snapshot = await q.get();

    if (snapshot.empty) {
      // Deneme sayısını artır (telefona göre son aktif koda)
      const activeQ = adminDb.collection('verification_codes')
        .where('phone', '==', formattedPhone)
        .where('verified', '==', false)
        .orderBy('createdAt', 'desc')
        .limit(1);
      const activeSnap = await activeQ.get();
      if (!activeSnap.empty) {
        const d = activeSnap.docs[0];
        const attempts = d.data().attempts || 0;
        await d.ref.update({ attempts: attempts + 1 });
        if (attempts + 1 >= 3) {
          return NextResponse.json({ success: false, error: 'Çok fazla hatalı deneme. Lütfen yeni kod isteyin.' }, { status: 400 });
        }
      }
      return NextResponse.json({ success: false, error: 'Geçersiz kod' }, { status: 400 });
    }

    const docSnap = snapshot.docs[0];
    const data = docSnap.data();

    if (data.attempts >= 3) {
      return NextResponse.json({ success: false, error: 'Çok fazla hatalı deneme. Lütfen yeni kod isteyin.' }, { status: 400 });
    }

    const now = new Date();
    const expiresAt = (data.expiresAt as Timestamp).toDate();
    if (now > expiresAt) {
      return NextResponse.json({ success: false, error: 'Kod süresi dolmuş. Lütfen yeni kod isteyin.' }, { status: 400 });
    }

    await docSnap.ref.update({ verified: true, usedAt: Timestamp.now() });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Sunucu hatası' }, { status: 500 });
  }
}
