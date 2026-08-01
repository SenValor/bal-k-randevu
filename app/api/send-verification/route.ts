import { NextRequest, NextResponse } from 'next/server';

const META_TOKEN = process.env.META_WHATSAPP_TOKEN!;
const META_PHONE_ID = process.env.META_PHONE_ID!;

export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json();
    
    
    if (!phone || !code) {
      return NextResponse.json(
        { error: 'Telefon ve kod gerekli' },
        { status: 400 }
      );
    }
    
    // WhatsApp API'ye template mesajı gönder
    const apiUrl = `https://graph.facebook.com/v22.0/${META_PHONE_ID}/messages`;
    
    const requestBody = {
      messaging_product: 'whatsapp',
      to: phone,
      type: 'template',
      template: {
        name: 'verify',
        language: { code: 'tr' },
        components: [
          {
            type: 'body',
            parameters: [
              { 
                type: 'text', 
                text: code 
              },
            ],
          },
          {
            type: 'button',
            sub_type: 'url',
            index: 0,
            parameters: [
              {
                type: 'text',
                text: code
              }
            ]
          }
        ],
      },
    };
    
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${META_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    const responseText = await response.text();
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = { error: { message: responseText } };
    }
    
    
    if (response.ok && data.messages) {
      return NextResponse.json({ 
        success: true,
        messageId: data.messages[0]?.id 
      });
    } else {
      return NextResponse.json(
        { 
          error: 'Mesaj gönderilemedi', 
          details: data.error?.message || 'Bilinmeyen hata'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
