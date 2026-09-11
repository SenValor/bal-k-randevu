import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';

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
    const { action, search, uid, phone, name } = await req.json();

    if (action === 'search') {
      if (!search || search.trim().length < 2) {
        return NextResponse.json({ success: false, error: 'En az 2 karakter girin' });
      }
      const q = search.trim().toLowerCase();

      const snap = await adminDb.collection('users').get();
      const users = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((u: any) =>
          (u.name || '').toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q) ||
          (u.phone || '').replace(/\D/g, '').includes(q.replace(/\D/g, ''))
        )
        .slice(0, 20);

      return NextResponse.json({ success: true, users });
    }

    if (action === 'update') {
      if (!uid) return NextResponse.json({ success: false, error: 'uid gerekli' });

      const updateData: Record<string, string> = {};
      if (phone !== undefined) updateData.phone = phone.trim();
      if (name !== undefined) updateData.name = name.trim();

      if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ success: false, error: 'Güncellenecek alan yok' });
      }

      await adminDb.collection('users').doc(uid).update(updateData);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Geçersiz işlem' }, { status: 400 });
  } catch {
    return NextResponse.json({ success: false, error: 'Sunucu hatası' }, { status: 500 });
  }
}
