import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(request: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const { lastAssistantMessage, language } = await request.json();
    const isEn = language === 'en';

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const result = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: `Sen bir balık avı turu şirketinin chatbot asistanısın. Verilen asistan cevabına göre müşterinin sorabileceği 3 kısa takip sorusu üret. Her soru maksimum 7 kelime. Sadece JSON array döndür, başka hiçbir şey yazma. Örnek: ["Soru 1?", "Soru 2?", "Soru 3?"] ${isEn ? 'Write questions in English.' : 'Soruları Türkçe yaz.'}`,
        },
        {
          role: 'user',
          content: `Asistan şunu söyledi: "${lastAssistantMessage.slice(0, 400)}"\n\n3 takip sorusu üret:`,
        },
      ],
      max_tokens: 130,
      temperature: 0.85,
    });

    const raw = result.choices[0]?.message?.content?.trim() || '[]';
    const match = raw.match(/\[[\s\S]*?\]/);
    const suggestions = match ? JSON.parse(match[0]) : [];

    return NextResponse.json({
      suggestions: Array.isArray(suggestions) ? suggestions.slice(0, 3) : [],
    });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
