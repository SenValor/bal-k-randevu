/**
 * 🐟 Balık Sefası - WhatsApp Bildirim Sistemi (ŞABLONLU)
 * Firebase Functions v3 + Node.js 22
 * Updated: 2025-12-26 16:00 - Dynamic Token
 */

require("dotenv").config();
const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

// Token - Doğrudan tanımlı (Firebase Functions v1 .env'i production'a yüklemez)
const META_TOKEN = "EAAMfyFpCzHsBQh9d2YYf5CvqmWyIxJqfZCa1e85dHDKB6jvUSx1MVYxOfQ5sY4jvWDGfcuFyJQOeri48aNGZClsGFpFEx4m9TPIQ8NkdPnNir2fG8eWuSjCXPbgXBvar6RIxQnDF81ZByTy3TdwSV0NOI6AjVHCSQacLA1mXeVEQdMT5Vws9g1wV1LEMKDMa4ZBTwZAnwZCkwPf3N3uPQ3XoedcMpYVEF1X2Eg";
const META_PHONE = "797993213405372";

function getAccessToken() {
  return META_TOKEN;
}

function getPhoneId() {
  return META_PHONE;
}

console.log("🔥 META_ACCESS_TOKEN:", getAccessToken() ? "Var ✅" : "Yok ❌");
console.log("🔥 META_PHONE_ID:", getPhoneId() ? "Var ✅" : "Yok ❌");

// 📱 Telefon formatlama
function formatPhoneNumber(phone) {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) return "90" + cleaned.substring(1);
  if (cleaned.startsWith("90")) return cleaned;
  return "90" + cleaned;
}

// 📅 Türkçe tarih
function formatDateTurkish(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Europe/Istanbul",
    });
  } catch {
    return dateString;
  }
}

/**
 * ✅ Rezervasyon Onaylandığında Şablonlu Mesaj Gönder
 */
exports.onReservationApproved = functions
  .region("us-central1")
  .firestore.document("reservations/{reservationId}")
  .onUpdate(async (change, context) => {
    try {
      const before = change.before.data();
      const after = change.after.data();
      const id = context.params.reservationId;

      console.log(`🔔 Rezervasyon güncellendi: ${id}`);
      console.log(`📊 Status: ${before.status} → ${after.status}`);
      console.log(`📋 Rezervasyon detayları:`, {
        status: after.status,
        whatsappSent: after.whatsappSent,
        userName: after.userName,
        userPhone: after.userPhone,
        reservationNumber: after.reservationNumber
      });

      if (after.status !== "confirmed") {
        console.log(`⏭️ Atlandı: Status confirmed değil (${after.status})`);
        return;
      }
      if (after.whatsappSent === true) {
        console.log(`⏭️ Atlandı: WhatsApp zaten gönderilmiş`);
        return;
      }
      if (before.status === "confirmed" && after.status === "confirmed") {
        console.log(`⏭️ Atlandı: Status zaten confirmed'di`);
        return;
      }

      const {
        userName = "Değerli Müşterimiz",
        userPhone,
        date,
        timeSlotDisplay = "Belirtilmemiş",
        boatName = "BALIK SEFASI",
        reservationNumber = "BS-XXXX",
        boatMapsLink = "",
        timeSlotMapsLink = "", // Saat dilimine özel konum
      } = after;
      
      // Saat dilimine özel konum varsa onu kullan, yoksa tekne konumunu kullan
      const locationLink = timeSlotMapsLink || boatMapsLink;

      if (!userPhone) {
        await change.after.ref.update({
          whatsappSent: false,
          whatsappError: "Telefon numarası eksik",
          whatsappSentAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return;
      }

      const formattedPhone = formatPhoneNumber(userPhone);
      const formattedDate = formatDateTurkish(date);

      console.log(`📱 Formatlanmış telefon: +${formattedPhone}`);

      // 🚀 TEMPLATE mesajı gönder - Token'ı dinamik al
      const currentToken = getAccessToken();
      const currentPhoneId = getPhoneId();
      
      console.log("🔑 Token ilk 20 karakter:", currentToken?.substring(0, 20));
      
      const apiUrl = `https://graph.facebook.com/v22.0/${currentPhoneId}/messages`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${currentToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: formattedPhone,
          type: "template",
          template: {
            name: "reservation_confirmation", // ✅ Onay şablonu adı
            language: { code: "tr" },
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", text: userName },
                  { type: "text", text: formattedDate },
                  { type: "text", text: timeSlotDisplay },
                  { type: "text", text: boatName },
                  { type: "text", text: reservationNumber },
                  { type: "text", text: locationLink || "Konum bilgisi bulunamadı" },
                ],
              },
            ],
          },
        }),
      });

      const data = await response.json();

      console.log("📡 WhatsApp API Response:", {
        status: response.status,
        ok: response.ok,
        data: JSON.stringify(data)
      });

      if (response.ok && data.messages) {
        console.log("✅ WhatsApp TEMPLATE mesajı gönderildi!");
        console.log("📨 Message ID:", data.messages[0]?.id);
        await change.after.ref.update({
          whatsappSent: true,
          whatsappSentAt: admin.firestore.FieldValue.serverTimestamp(),
          whatsappMessageId: data.messages[0]?.id || null,
          whatsappPhone: formattedPhone,
        });
      } else {
        console.error("❌ WhatsApp API hatası:", {
          status: response.status,
          error: data.error,
          fullResponse: data
        });
        await change.after.ref.update({
          whatsappSent: false,
          whatsappError: JSON.stringify(data.error) || "API hatası",
          whatsappSentAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    } catch (err) {
      console.error("❌ Function hatası:", err);
      await change.after.ref.update({
        whatsappSent: false,
        whatsappError: err.message,
        whatsappSentAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  });

/**
 * ❌ Rezervasyon İptal Edildiğinde ŞABLONLU Mesaj Gönder
 */
exports.onReservationCancelled = functions
  .region("us-central1")
  .firestore.document("reservations/{reservationId}")
  .onUpdate(async (change, context) => {
    try {
      const before = change.before.data();
      const after = change.after.data();
      const id = context.params.reservationId;

      console.log(`🛑 Rezervasyon iptal edildi: ${id}`);
      console.log(`📊 Status: ${before.status} → ${after.status}`);

      if (after.status !== "cancelled") return;
      if (after.whatsappCancelSent === true) return;
      if (before.status === "cancelled" && after.status === "cancelled") return;

      const {
        userName = "Değerli Müşterimiz",
        userPhone,
        date,
        timeSlotDisplay = "Belirtilmemiş",
        boatName = "BALIK SEFASI",
        reservationNumber = "BS-XXXX",
        boatMapsLink = "",
        timeSlotMapsLink = "", // Saat dilimine özel konum
      } = after;
      
      // Saat dilimine özel konum varsa onu kullan, yoksa tekne konumunu kullan
      const locationLink = timeSlotMapsLink || boatMapsLink;

      if (!userPhone) {
        await change.after.ref.update({
          whatsappCancelSent: false,
          whatsappCancelError: "Telefon numarası eksik",
        });
        return;
      }

      const formattedPhone = formatPhoneNumber(userPhone);
      const formattedDate = formatDateTurkish(date);
      
      // Token'ı dinamik al
      const currentToken = getAccessToken();
      const currentPhoneId = getPhoneId();
      
      const apiUrl = `https://graph.facebook.com/v22.0/${currentPhoneId}/messages`;

      // 🚀 TEMPLATE mesajı gönder
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${currentToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: formattedPhone,
          type: "template",
          template: {
            name: "reservation_cancellation", // ✅ Meta’daki iptal şablon adı
            language: { code: "tr" },
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", text: userName },
                  { type: "text", text: formattedDate },
                  { type: "text", text: timeSlotDisplay },
                  { type: "text", text: boatName },
                  { type: "text", text: reservationNumber },
                  { type: "text", text: locationLink || "Konum bilgisi bulunamadı" },
                ],
              },
            ],
          },
        }),
      });

      const data = await response.json();

      if (response.ok && data.messages) {
        console.log("✅ WhatsApp İPTAL TEMPLATE mesajı gönderildi!");
        await change.after.ref.update({
          whatsappCancelSent: true,
          whatsappCancelSentAt: admin.firestore.FieldValue.serverTimestamp(),
          whatsappCancelMessageId: data.messages[0]?.id || null,
        });
      } else {
        console.error("❌ WhatsApp API hatası:", data);
        await change.after.ref.update({
          whatsappCancelSent: false,
          whatsappCancelError: data.error?.message || "API hatası",
        });
      }
    } catch (err) {
      console.error("❌ İptal function hatası:", err);
    }
  });

// ============================================================
// 📩 WHATSAPP WEBHOOK - Gelen Mesajları Yakala ve Otomatik Cevap Ver
// ============================================================

// Environment variables - Production'da functions.config() kullan
const WA_VERIFY_TOKEN = functions.config().wa?.verify_token || process.env.WA_VERIFY_TOKEN || "baliksefasi_webhook_2024";
function getWaToken() {
  return functions.config().wa?.token || process.env.WA_TOKEN || getAccessToken();
}
function getWaPhoneNumberId() {
  return functions.config().wa?.phone_number_id || process.env.WA_PHONE_NUMBER_ID || getPhoneId();
}

// İptal/değişiklik anahtar kelimeleri
const CANCEL_KEYWORDS = ["iptal", "cancel", "vazgeç", "vazgec", "değiş", "degis", "değişiklik", "degisiklik"];

/**
 * Mesaj içeriğinde iptal/değişiklik kelimesi var mı kontrol et
 * Türkçe karakterler için özel lowercase işlemi
 */
function containsCancelKeyword(message) {
  if (!message) return false;
  // Türkçe İ -> i ve I -> ı dönüşümü için toLocaleLowerCase('tr-TR') kullan
  const lowerMessage = message.toLocaleLowerCase('tr-TR').trim();
  return CANCEL_KEYWORDS.some(keyword => lowerMessage.includes(keyword));
}

/**
 * WhatsApp'a otomatik cevap gönder (text mesajı - 24 saat penceresi içinde)
 */
async function sendAutoReply(to, messageText) {
  try {
    const apiUrl = `https://graph.facebook.com/v22.0/${getWaPhoneNumberId()}/messages`;
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getWaToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: "text",
        text: {
          preview_url: false,
          body: messageText,
        },
      }),
    });

    const data = await response.json();

    if (response.ok && data.messages) {
      console.log("✅ Otomatik cevap gönderildi:", to);
      return true;
    } else {
      console.error("❌ Otomatik cevap gönderilemedi:", data);
      return false;
    }
  } catch (err) {
    console.error("❌ sendAutoReply hatası:", err.message);
    return false;
  }
}

/**
 * 🔗 WhatsApp Webhook Endpoint
 * GET  → Meta doğrulama (hub.challenge)
 * POST → Gelen mesajları yakala ve otomatik cevap ver
 */
exports.whatsappWebhook = functions
  .region("us-central1")
  .https.onRequest(async (req, res) => {
    // ============ GET: Meta Webhook Doğrulama ============
    if (req.method === "GET") {
      const mode = req.query["hub.mode"];
      const token = req.query["hub.verify_token"];
      const challenge = req.query["hub.challenge"];

      console.log("🔐 Webhook doğrulama isteği alındı");

      if (mode === "subscribe" && token === WA_VERIFY_TOKEN) {
        console.log("✅ Webhook doğrulandı!");
        res.status(200).send(challenge);
      } else {
        console.error("❌ Webhook doğrulama başarısız - Token eşleşmiyor");
        res.status(403).send("Forbidden");
      }
      return;
    }

    // ============ POST: Gelen Mesajları İşle ============
    if (req.method === "POST") {
      try {
        const body = req.body;

        // Meta'nın beklediği 200 OK'u hemen dön (timeout önleme)
        res.status(200).send("EVENT_RECEIVED");

        // Webhook payload kontrolü
        if (!body || !body.object || body.object !== "whatsapp_business_account") {
          console.log("ℹ️ WhatsApp dışı webhook, atlanıyor");
          return;
        }

        // Entry ve changes kontrolü
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;

        if (!value) {
          console.log("ℹ️ Value bulunamadı, atlanıyor");
          return;
        }

        // Mesaj kontrolü
        const messages = value.messages;
        if (!messages || messages.length === 0) {
          console.log("ℹ️ Mesaj yok (status update olabilir), atlanıyor");
          return;
        }

        // Her mesajı işle
        for (const message of messages) {
          const from = message.from; // Gönderen telefon numarası
          const messageType = message.type;
          const timestamp = message.timestamp;

          console.log(`📩 Gelen mesaj: ${from} | Tip: ${messageType} | Zaman: ${timestamp}`);

          // Sadece text mesajlarını işle
          if (messageType !== "text") {
            console.log(`ℹ️ Text olmayan mesaj tipi: ${messageType}, genel cevap gönderiliyor`);
            
            // Text olmayan mesajlar için genel cevap
            const generalReply = `⚠️ *Otomatik Bilgilendirme*

Bu hat mesaj okumaz.

📌 *Tüm işlemler için:*
https://baliksefasi.com/rezervasyon-sorgula

📞 *Destek:* +90 531 089 25 37`;

            await sendAutoReply(from, generalReply);
            continue;
          }

          // Text mesaj içeriği
          const textBody = message.text?.body || "";
          console.log(`💬 Mesaj içeriği: "${textBody}"`);

          // İptal/değişiklik kelimesi var mı?
          const isCancelRequest = containsCancelKeyword(textBody);

          let replyMessage;

          if (isCancelRequest) {
            console.log("🚨 İptal/Değişiklik talebi tespit edildi!");
            
            replyMessage = `⚠️ *Otomatik Bilgilendirme*

Bu hat mesaj okumaz.

❌ *İptal / Değişiklik işlemleri sadece buradan yapılır:*
https://baliksefasi.com/rezervasyon-sorgula

📞 *Destek:* +90 531 089 25 37`;
          } else {
            console.log("ℹ️ Genel mesaj, standart cevap gönderiliyor");
            
            replyMessage = `⚠️ *Otomatik Bilgilendirme*

Bu hat mesaj okumaz.

📌 *Tüm işlemler için:*
https://baliksefasi.com/rezervasyon-sorgula

📞 *Destek:* +90 531 089 25 37`;
          }

          // Otomatik cevap gönder
          await sendAutoReply(from, replyMessage);

          // Gelen mesajı Firestore'a kaydet (opsiyonel - debug için)
          try {
            await admin.firestore().collection("whatsapp_incoming").add({
              from: from,
              message: textBody,
              messageType: messageType,
              isCancelRequest: isCancelRequest,
              timestamp: admin.firestore.FieldValue.serverTimestamp(),
              rawTimestamp: timestamp,
              replySent: true,
            });
            console.log("📝 Mesaj Firestore'a kaydedildi");
          } catch (dbErr) {
            console.error("⚠️ Firestore kayıt hatası (kritik değil):", dbErr.message);
          }
        }

      } catch (err) {
        console.error("❌ Webhook POST hatası:", err.message);
        // Hata olsa bile 200 dönmüş olduk (timeout önleme)
      }
      return;
    }

    // Diğer HTTP metodları
    res.status(405).send("Method Not Allowed");
  });

// ============================================================
// 🧹 OTOMATIK TEMİZLEME - Süresi Dolmuş Doğrulama Kodları
// ============================================================

/**
 * Her 1 saatte bir süresi dolmuş doğrulama kodlarını temizle
 */
exports.cleanExpiredVerificationCodes = functions
  .region("us-central1")
  .pubsub.schedule("every 1 hours")
  .onRun(async (context) => {
    try {
      console.log("🧹 Süresi dolmuş doğrulama kodları temizleniyor...");
      
      const now = admin.firestore.Timestamp.now();
      
      const expiredQuery = await admin
        .firestore()
        .collection("verification_codes")
        .where("expiresAt", "<", now)
        .get();
      
      if (expiredQuery.empty) {
        console.log("✅ Temizlenecek kod yok");
        return null;
      }
      
      const batch = admin.firestore().batch();
      expiredQuery.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      console.log(`🧹 ${expiredQuery.size} süresi dolmuş kod silindi`);
      
      return null;
    } catch (error) {
      console.error("❌ Temizleme hatası:", error);
      return null;
    }
  });
