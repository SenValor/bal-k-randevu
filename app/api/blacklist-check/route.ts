import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();
    if (!phone) {
      return NextResponse.json({ blacklisted: false });
    }

    const clean = String(phone).replace(/\D/g, '');
    if (!clean || clean.length < 10) {
      return NextResponse.json({ blacklisted: false });
    }

    const withZero = clean.startsWith('0') ? clean : '0' + clean;
    const withoutZero = clean.startsWith('0') ? clean.substring(1) : clean;

    const snap = await adminDb
      .collection('blacklist')
      .where('phone', 'in', [withZero, withoutZero])
      .get();

    return NextResponse.json({ blacklisted: !snap.empty });
  } catch {
    return NextResponse.json({ blacklisted: false });
  }
}
