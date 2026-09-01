import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, id, data } = body;

    if (!action) {
      return NextResponse.json({ success: false, error: 'action gerekli' }, { status: 400 });
    }

    if (action === 'add') {
      if (!data) return NextResponse.json({ success: false, error: 'data gerekli' }, { status: 400 });
      const ref = await adminDb.collection('tours').add({
        ...data,
        createdAt: new Date().toISOString(),
      });
      return NextResponse.json({ success: true, id: ref.id });
    }

    if (action === 'update') {
      if (!id || !data) return NextResponse.json({ success: false, error: 'id ve data gerekli' }, { status: 400 });
      await adminDb.collection('tours').doc(id).update({
        ...data,
        updatedAt: new Date().toISOString(),
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'delete') {
      if (!id) return NextResponse.json({ success: false, error: 'id gerekli' }, { status: 400 });
      await adminDb.collection('tours').doc(id).delete();
      return NextResponse.json({ success: true });
    }

    if (action === 'toggle') {
      if (!id || data?.isActive === undefined) {
        return NextResponse.json({ success: false, error: 'id ve isActive gerekli' }, { status: 400 });
      }
      await adminDb.collection('tours').doc(id).update({
        isActive: data.isActive,
        updatedAt: new Date().toISOString(),
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Geçersiz action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Sunucu hatası' }, { status: 500 });
  }
}
