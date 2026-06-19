import { NextRequest, NextResponse } from 'next/server';

// Meta Business API credentials
const META_TOKEN = 'EAAMfyFpCzHsBRVrp1RxSv7AKtXETgUMPRplEA8ZB3vVsfZBX4Jeq4JFOoYquX1RwkdfjIa62TQJGZBf4tyvVBaZACZBVieFo5KKFY6vF9COMVWDvZAzbx9jaVlOr3H41QcpEgiBdLLGrZCNiGu1SaEfUfQlWaV4aO5l3fIytKCjm5M8E0OuC11hL2ey44vRYRDmkfVdQnaci0vWohcZBMJAy8o4fQaK5xZAiZBeovz2dWC';
const META_PHONE_ID = '797993213405372';

// Telefon numarasını WhatsApp formatına çevirir
function formatPhoneNumber(phone: string): string {
  if (!phone) return "";
  
  const cleaned = phone.replace(/\D/g, "");
  
  if (cleaned.startsWith("90")) {
    return cleaned;
  }
  
  if (cleaned.startsWith("0")) {
    return "90" + cleaned.substring(1);
  }
  
  return "90" + cleaned;
}

// Tarihi Türkçe formatla
function formatDateTurkish(dateStr: string): string {
  if (!dateStr) return "";
  
  try {
    const date = new Date(dateStr);
    const months = [
      "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
      "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
    ];
    
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
  } catch (error) {
    return dateStr;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, reservation } = body;

    const accessToken = META_TOKEN;
    const phoneId = META_PHONE_ID;

    if (!reservation.userPhone) {
      return NextResponse.json(
        { success: false, error: 'Telefon numarası bulunamadı' },
        { status: 400 }
      );
    }

    const formattedPhone = formatPhoneNumber(reservation.userPhone);
    const formattedDate = formatDateTurkish(reservation.date);
    const userName = reservation.userName || "Değerli Müşterimiz";
    const reservationNumber = reservation.reservationNumber || "";
    const timeSlotDisplay = reservation.timeSlotDisplay || "Belirtilmemiş";
    const boatName = reservation.boatName || "BALIK SEFASI";
    const seats = reservation.selectedSeats?.join(", ") || "";

    let message = "";

    if (type === 'approval') {
      // Onay Mesajı
      message = `🐟 Balık Sefası

Merhaba ${userName},

Rezervasyonunuz onaylandı! 🎉

🎫 Rezervasyon No: ${reservationNumber}
📅 Tarih: ${formattedDate}
🕐 Saat: ${timeSlotDisplay}
⛵ Tekne: ${boatName}
💺 Koltuklar: ${seats}

Teşekkürler, iyi avlar dileriz ⚓

Bu numarayı kullanarak rezervasyonunuzu sorgulayabilir veya iptal edebilirsiniz.
www.baliksefasi.com`;
    } else if (type === 'cancellation') {
      // İptal Mesajı
      message = `🐟 Balık Sefası

Merhaba ${userName},

Rezervasyonunuz iptal edildi.

🎫 Rezervasyon No: ${reservationNumber}
📅 Tarih: ${formattedDate}
🕐 Saat: ${timeSlotDisplay}
⛵ Tekne: ${boatName}

Tekrar görüşmek dileğiyle 🙏
www.baliksefasi.com`;
    } else {
      return NextResponse.json(
        { success: false, error: 'Geçersiz mesaj tipi' },
        { status: 400 }
      );
    }

    // WhatsApp API'ye mesaj gönder
    const apiUrl = `https://graph.facebook.com/v22.0/${phoneId}/messages`;
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "text",
        text: {
          body: message,
        },
      }),
    });

    const responseData = await response.json();

    if (response.ok && responseData.messages) {
      return NextResponse.json({
        success: true,
        messageId: responseData.messages[0]?.id,
        phone: formattedPhone
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: responseData.error?.message || "WhatsApp API hatası" 
        },
        { status: response.status }
      );
    }

  } catch (error: any) {
    console.error('WhatsApp mesaj gönderme hatası:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
