import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const { pin, cutoffDate } = await req.json();

    const staffPin = process.env.STAFF_PIN;
    if (!staffPin || pin !== staffPin) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    const cutoff = cutoffDate || (() => {
      const d = new Date();
      d.setDate(d.getDate() - 14);
      return d.toISOString().split('T')[0];
    })();

    const snap = await adminDb
      .collection('reservations')
      .where('date', '>=', cutoff)
      .get();

    const reservations = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ success: true, reservations });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
