import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';

const META_TOKEN = process.env.META_WHATSAPP_TOKEN!;
const META_PHONE_ID = process.env.META_PHONE_ID!;

export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json();

    if (!phone || !code) {
      return NextResponse.json({ error: 'Telefon ve kod gerekli' }, { status: 400 });
    }

    // Server-side spam kontrolü: son 1 dakikada bu numaraya kod gönderilmiş mi?
    const oneMinuteAgo = Timestamp.fromDate(new Date(Date.now() - 60000));
    const recentSnap = await adminDb.collection('verification_codes')
      .where('phone', '==', phone)
      .where('createdAt', '>', oneMinuteAgo)
      .limit(1)
      .get();

    if (!recentSnap.empty) {
      return NextResponse.json({ error: 'Lütfen 1 dakika bekleyin' }, { status: 429 });
    }

    const apiUrl = `https://graph.facebook.com/v22.0/${META_PHONE_ID}/messages`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${META_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'template',
        template: {
          name: 'verify',
          language: { code: 'tr' },
          components: [
            {
              type: 'body',
              parameters: [{ type: 'text', text: code }],
            },
            {
              type: 'button',
              sub_type: 'url',
              index: 0,
              parameters: [{ type: 'text', text: code }],
            },
          ],
        },
      }),
    });

    let data;
    try {
      data = await response.json();
    } catch {
      data = { error: { message: 'Yanıt parse edilemedi' } };
    }

    if (response.ok && data.messages) {
      return NextResponse.json({ success: true, messageId: data.messages[0]?.id });
    } else {
      return NextResponse.json(
        { error: 'Mesaj gönderilemedi', details: data.error?.message || 'Bilinmeyen hata' },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
