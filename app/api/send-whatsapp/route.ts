import { NextRequest, NextResponse } from 'next/server';

const META_TOKEN = process.env.META_WHATSAPP_TOKEN!;
const META_PHONE_ID = process.env.META_PHONE_ID!;

// Telefon numarasını WhatsApp formatına çevirir
function formatPhoneNumber(phone: string): string {
  if (!phone) return "";
  if (phone.trim().startsWith("+")) return phone.replace(/\D/g, "");
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("90")) return cleaned;
  if (cleaned.startsWith("0")) return "90" + cleaned.substring(1);
  if (cleaned.length === 10) return "90" + cleaned;
  return cleaned;
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
    const responsibleName = reservation.boatResponsibleName || "";
    const responsiblePhone = reservation.boatResponsiblePhone || "";

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
${responsibleName ? `👤 Tekne Sorumlusu: ${responsibleName}` : ''}
${responsiblePhone ? `📞 Tekne Sorumlusu Tel: ${responsiblePhone}` : ''}
${responsiblePhone ? `⚠️ Bu numara yalnızca tur günü ve saatinde tekneyi bulamadığınız durumda aranabilir.` : ''}

Teşekkürler, iyi avlar dileriz ⚓

Rezervasyonunuzu sorgulamak veya iptal etmek için:
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
    return NextResponse.json(
      { success: false, error: error.message || 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
