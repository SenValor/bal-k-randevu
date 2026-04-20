import { NextRequest, NextResponse } from 'next/server';

// Meta Business API credentials
const META_TOKEN = 'EAAMfyFpCzHsBRVrp1RxSv7AKtXETgUMPRplEA8ZB3vVsfZBX4Jeq4JFOoYquX1RwkdfjIa62TQJGZBf4tyvVBaZACZBVieFo5KKFY6vF9COMVWDvZAzbx9jaVlOr3H41QcpEgiBdLLGrZCNiGu1SaEfUfQlWaV4aO5l3fIytKCjm5M8E0OuC11hL2ey44vRYRDmkfVdQnaci0vWohcZBMJAy8o4fQaK5xZAiZBeovz2dWC';
const META_PHONE_ID = '797993213405372';

export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json();
    
    console.log('📱 WhatsApp doğrulama kodu gönderiliyor:', { phone, code });
    
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
    
    console.log('📤 Gönderilen request:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${META_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    const responseText = await response.text();
    console.log('📡 Raw API Response:', responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('❌ JSON parse hatası:', e);
      data = { error: { message: responseText } };
    }
    
    console.log('📡 WhatsApp API yanıtı:', {
      status: response.status,
      ok: response.ok,
      data: data
    });
    
    if (response.ok && data.messages) {
      console.log('✅ WhatsApp mesajı başarıyla gönderildi');
      return NextResponse.json({ 
        success: true,
        messageId: data.messages[0]?.id 
      });
    } else {
      console.error('❌ WhatsApp API hatası:', data);
      return NextResponse.json(
        { 
          error: 'Mesaj gönderilemedi', 
          details: data.error?.message || 'Bilinmeyen hata'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ API hatası:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
