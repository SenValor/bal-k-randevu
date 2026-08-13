import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

const ALLOWED_ADMIN_EMAILS = ['baliksefasi33@admin.com', 'bukre@akturk.com'];

export async function POST(req: NextRequest) {
  try {
    // İsteği yapan kişinin token'ını doğrula
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = await adminAuth.verifyIdToken(token);
    const callerEmail = decoded.email ?? '';

    // Firestore veya hardcoded listeden admin kontrolü
    let isAdmin = ALLOWED_ADMIN_EMAILS.includes(callerEmail);
    if (!isAdmin) {
      const adminDoc = await adminDb.collection('admins').doc(callerEmail).get();
      isAdmin = adminDoc.exists && adminDoc.data()?.active === true;
    }

    if (!isAdmin) {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });
    }

    const { name, email, password } = await req.json();

    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      return NextResponse.json({ error: 'Ad, email ve şifre zorunludur.' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Şifre en az 6 karakter olmalıdır.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Firebase Auth'da kullanıcıyı oluştur (zaten varsa güncelle)
    let uid: string;
    try {
      const existing = await adminAuth.getUserByEmail(normalizedEmail);
      // Zaten var — şifreyi güncelle
      await adminAuth.updateUser(existing.uid, { password: password.trim(), displayName: name.trim() });
      uid = existing.uid;
    } catch {
      // Yoksa yeni oluştur
      const newUser = await adminAuth.createUser({
        email: normalizedEmail,
        password: password.trim(),
        displayName: name.trim(),
      });
      uid = newUser.uid;
    }

    // Firestore admins koleksiyonuna ekle / güncelle
    await adminDb.collection('admins').doc(normalizedEmail).set({
      name: name.trim(),
      active: true,
      createdAt: new Date().toISOString(),
      uid,
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('create-user error:', err);
    return NextResponse.json({ error: err.message ?? 'Sunucu hatası' }, { status: 500 });
  }
}
