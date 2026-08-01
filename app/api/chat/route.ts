import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const SYSTEM_BASE = `Sen Balık Sefası'nın resmi web sitesi asistanısın.

Şirket: Balık Sefası — İstanbul Boğazı'nda tekne kiralama ve balık avı turları
Web sitesi: www.baliksefasi.com

Görevin:
- Müşterilere tekne ve tur bilgisi vermek
- Rezervasyon sürecini açıklamak
- Sık sorulan sorulara cevap vermek

Rezervasyon süreci:
1. Tekne seçimi
2. Tarih ve saat seçimi
3. Koltuk sayısı ve koltuk seçimi
4. Tur tipi seçimi (opsiyonel)
5. İletişim bilgileri ve WhatsApp doğrulama
6. Onay

Sayfa yönlendirmeleri (bu linkleri kullan):
- Rezervasyon yapmak istiyorsa → "/rezervasyon sayfasına" git de
- İletişim, telefon, adres → "/iletisim sayfasına" git de
- Sık sorulan sorular → "/sss sayfasına" git de
- Hakkımızda → "/hakkimizda sayfasına" git de

Yanıt kuralları:
- 2-4 cümle, kısa ve net
- Kullanıcı Türkçe yazarsa Türkçe, İngilizce yazarsa İngilizce yanıt ver
- Emin olmadığın konularda /iletisim'e yönlendir
- Asla hayal ürünü fiyat veya müsaitlik bilgisi uydurma
- Sıcak, samimi ve profesyonel ton`;

function buildSystemPrompt(
  context: { boats: any[]; tours: any[]; faqs: any[] } | null,
  language: string
): string {
  let extra = '';

  if (context?.boats?.length) {
    extra += '\n\nMevcut Tekneler:\n';
    extra += context.boats
      .map((b) => {
        const name = language === 'en' ? (b.name_en || b.name) : b.name;
        const desc = language === 'en' ? (b.description_en || b.description) : b.description;
        const cap = b.capacity ? `, ${b.capacity} kişilik` : '';
        return `- ${name}${cap}${desc ? ': ' + desc : ''}`;
      })
      .join('\n');
  }

  if (context?.tours?.length) {
    extra += '\n\nMevcut Tur Tipleri:\n';
    extra += context.tours
      .map((t) => {
        const name = language === 'en' ? (t.name_en || t.name) : t.name;
        const desc = language === 'en' ? (t.description_en || t.description) : t.description;
        return `- ${name}${desc ? ': ' + desc : ''}`;
      })
      .join('\n');
  }

  if (context?.faqs?.length) {
    extra += '\n\nSık Sorulan Sorular (bunları kullanarak cevap ver):\n';
    extra += context.faqs
      .slice(0, 15)
      .map((f: any) => `S: ${f.question}\nC: ${f.answer}`)
      .join('\n\n');
  }

  return SYSTEM_BASE + extra;
}

export async function POST(request: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: 'API anahtarı yapılandırılmamış' }, { status: 500 });
  }

  try {
    const { messages, context, language } = await request.json();

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const systemPrompt = buildSystemPrompt(context, language || 'tr');

    const chatMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...(messages as { role: string; content: string }[])
        .slice(-12)
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
    ];

    const stream = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: chatMessages,
      max_tokens: 800,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content;
            if (text) controller.enqueue(encoder.encode(text));
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Sunucu hatası' }, { status: 500 });
  }
}
