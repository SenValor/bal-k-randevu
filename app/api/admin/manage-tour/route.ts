import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

const ALLOWED_ADMIN_EMAILS = ['baliksefasi33@admin.com', 'bukre@akturk.com'];

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;
  try {
    const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
    const email = decoded.email ?? '';
    if (ALLOWED_ADMIN_EMAILS.includes(email)) return true;
    const adminDoc = await adminDb.collection('admins').doc(email).get();
    return adminDoc.exists && adminDoc.data()?.active === true;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 });
  }

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
