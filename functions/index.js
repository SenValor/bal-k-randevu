/**
 * 🐟 Balık Sefası - WhatsApp Bildirim Sistemi
 * Firebase Functions v3 + Node.js 22
 * Rezervasyon onaylandığında (status: confirmed) otomatik WhatsApp mesajı gönderir
 */

require("dotenv").config();
const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const accessToken = process.env.META_ACCESS_TOKEN;
const phoneId = process.env.META_PHONE_ID;

console.log("🔥 ENV META_ACCESS_TOKEN:", accessToken ? "Var ✅" : "Yok ❌");
console.log("🔥 ENV META_PHONE_ID:", phoneId ? "Var ✅" : "Yok ❌")

/**
 * Telefon numarasını WhatsApp formatına çevirir (+90...)
 * @param {string} phone - Ham telefon numarası
 * @return {string} Formatlanmış telefon (+90XXXXXXXXXX)
 */
function formatPhoneNumber(phone) {
  if (!phone) return "";
  
  // Sadece rakamları al
  const cleaned = phone.replace(/\D/g, "");
  
  // 0 ile başlıyorsa +90 ile değiştir
  if (cleaned.startsWith("0")) {
    return "90" + cleaned.substring(1);
  }
  
  // 90 ile başlıyorsa olduğu gibi kullan
  if (cleaned.startsWith("90")) {
    return cleaned;
  }
  
  // Diğer durumlarda başına 90 ekle
  return "90" + cleaned;
}

/**
 * Tarihi Türkçe formatına çevirir
 * @param {string} dateString - Tarih (YYYY-MM-DD)
 * @return {string} Türkçe tarih (15 Kasım 2024)
 */
function formatDateTurkish(dateString) {
  try {
    const date = new Date(dateString);
    const options = {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Europe/Istanbul",
    };
    return date.toLocaleDateString("tr-TR", options);
  } catch (error) {
    console.error("⚠️ Tarih formatlama hatası:", error);
    return dateString;
  }
}

/**
 * Gece yarısını geçen tur mu kontrol eder
 * @param {string} startTime - Başlangıç saati (HH:MM)
 * @param {string} endTime - Bitiş saati (HH:MM)
 * @return {boolean} Gece turu mu?
 */
function isOvernightTour(startTime, endTime) {
  if (!startTime || !endTime) return false;
  const [startHour] = startTime.split(":").map(Number);
  const [endHour] = endTime.split(":").map(Number);
  return endHour < startHour; // Örn: 19:00-01:00 → 1 < 19 = true
}

/**
 * Tarihten gün adını alır (Türkçe)
 * @param {string} dateString - Tarih (YYYY-MM-DD)
 * @return {string} Gün adı (Pazartesi, Salı, vb.)
 */
function getDayName(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("tr-TR", { weekday: "long" });
  } catch (error) {
    return "";
  }
}

/**
 * Bir sonraki günün adını alır
 * @param {string} dateString - Tarih (YYYY-MM-DD)
 * @return {string} Ertesi günün adı
 */
function getNextDayName(dateString) {
  try {
    const date = new Date(dateString);
    date.setDate(date.getDate() + 1);
    return date.toLocaleDateString("tr-TR", { weekday: "long" });
  } catch (error) {
    return "";
  }
}

/**
 * 🎯 Ana Cloud Function: Rezervasyon Onaylandığında WhatsApp Gönder
 * Trigger: Firestore onUpdate
 * Collection: reservations/{reservationId}
 * Koşul: status === "confirmed" && whatsappSent !== true
 */
exports.onReservationApproved = functions
  .region("us-central1")
  .firestore
  .document("reservations/{reservationId}")
  .onUpdate(async (change, context) => {
    try {
      const before = change.before.data();
      const after = change.after.data();
      const reservationId = context.params.reservationId;

      console.log(`🔔 Rezervasyon güncellendi: ${reservationId}`);
      console.log(`📊 Status: ${before.status} → ${after.status}`);

      // ✅ Kontrol 1: Status "confirmed" mi?
      if (after.status !== "confirmed") {
        console.log("ℹ️ Status 'confirmed' değil, işlem yapılmadı.");
        return null;
      }

      // ✅ Kontrol 2: Daha önce WhatsApp gönderilmiş mi?
      if (after.whatsappSent === true) {
        console.log("ℹ️ WhatsApp mesajı zaten gönderilmiş, tekrar gönderilmedi.");
        return null;
      }

      // ✅ Kontrol 3: Status değişti mi? (confirmed → confirmed tekrarını engelle)
      if (before.status === "confirmed" && after.status === "confirmed") {
        console.log("ℹ️ Status zaten 'confirmed' idi, tekrar mesaj gönderilmedi.");
        return null;
      }

      console.log("✨ Rezervasyon onaylandı! WhatsApp mesajı hazırlanıyor...");

      // 📝 Rezervasyon bilgilerini al
      const userName = after.userName || "Değerli Müşterimiz";
      const userPhone = after.userPhone || "";
      const date = after.date || "";
      const timeSlotDisplay = after.timeSlotDisplay || "Belirtilmemiş";
      const boatName = after.boatName || "BALIK SEFASI";
      const reservationNumber = after.reservationNumber || "";
      const boatMapsLink = after.boatMapsLink || "";

      // 🌙 Gece turu kontrolü
      let nightWarning = "";
      let baitWarning = "";
      
      // Yem uyarısı kontrolü - Rezervasyonda baitWarning alanı varsa
      if (after.baitWarning === true) {
        baitWarning = `\n\n⚠️ UYARI: YEMİNİZİ GETİRMEYİ UNUTMAYIN!`;
      }
      
      // Gece turu için gün bilgisi
      if (timeSlotDisplay && timeSlotDisplay.includes("-")) {
        const [startTime, endTime] = timeSlotDisplay.split("-").map(t => t.trim());
        if (isOvernightTour(startTime, endTime)) {
          const currentDay = getDayName(date);
          const nextDay = getNextDayName(date);
          nightWarning = `\n🌙 ${currentDay}'yı ${nextDay}'ya bağlayan gece`;
        }
      }

      // 📞 Telefon numarası kontrolü
      if (!userPhone) {
        console.error("❌ Telefon numarası bulunamadı!");
        await change.after.ref.update({
          whatsappSent: false,
          whatsappError: "Telefon numarası eksik",
          whatsappSentAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return null;
      }

      // 📱 Telefon numarasını formatla
      const formattedPhone = formatPhoneNumber(userPhone);
      console.log(`📱 Formatlanmış telefon: +${formattedPhone}`);

      // 📅 Tarihi Türkçe formatla
      const formattedDate = formatDateTurkish(date);

      // 💬 WhatsApp mesajını oluştur
      const message = `🐟 Balık Sefası

Merhaba ${userName},

Rezervasyonunuz onaylandı! 🎉

🎫 Rezervasyon No: ${reservationNumber}
📅 Tarih: ${formattedDate}
🕐 Saat: ${timeSlotDisplay}${nightWarning}
⛵ Tekne: ${boatName}
${boatMapsLink ? `📍 Konum: ${boatMapsLink}` : ''}${baitWarning}

Teşekkürler, iyi avlar dileriz ⚓

www.baliksefasi.com/iletisim`;

      // 🔑 .env'den okunan API bilgilerini kullan (global değişkenler)
      if (!accessToken || !phoneId) {
        console.error("❌ META_ACCESS_TOKEN veya META_PHONE_ID bulunamadı!");
        console.error("Lütfen .env dosyasını kontrol edin.");
        
        await change.after.ref.update({
          whatsappSent: false,
          whatsappError: "API credentials eksik",
          whatsappSentAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return null;
      }

      // 🚀 WhatsApp Cloud API'ye mesaj gönder
      console.log("📤 WhatsApp API'ye istek gönderiliyor...");
      
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

      // ✅ Başarılı mı kontrol et
      if (response.ok && responseData.messages) {
        console.log("✅ WhatsApp mesajı başarıyla gönderildi!");
        console.log("📊 Response:", JSON.stringify(responseData));

        // Firestore'u güncelle (başarılı)
        await change.after.ref.update({
          whatsappSent: true,
          whatsappSentAt: admin.firestore.FieldValue.serverTimestamp(),
          whatsappMessageId: responseData.messages[0]?.id || null,
          whatsappPhone: formattedPhone,
        });

        console.log("✅ Firestore güncellendi: whatsappSent = true");
        return null;
      } else {
        // ❌ Hata durumu
        console.error("❌ WhatsApp API hatası!");
        console.error("Status:", response.status);
        console.error("Response:", JSON.stringify(responseData));

        await change.after.ref.update({
          whatsappSent: false,
          whatsappError: responseData.error?.message || "API hatası",
          whatsappSentAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return null;
      }
    } catch (error) {
      console.error("❌ Cloud Function hatası:", error.message);
      console.error("Stack:", error.stack);

      // Hata durumunda Firestore'u güncelle
      try {
        await change.after.ref.update({
          whatsappSent: false,
          whatsappError: error.message,
          whatsappSentAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (updateError) {
        console.error("❌ Firestore güncelleme hatası:", updateError.message);
      }

      return null;
    }
  });

/**
 * 🎯 İptal Cloud Function: Rezervasyon İptal Edildiğinde WhatsApp Gönder
 * Trigger: Firestore onUpdate
 * Collection: reservations/{reservationId}
 * Koşul: status === "cancelled" && whatsappCancelSent !== true
 */
exports.onReservationCancelled = functions
  .region("us-central1")
  .firestore
  .document("reservations/{reservationId}")
  .onUpdate(async (change, context) => {
    try {
      const before = change.before.data();
      const after = change.after.data();
      const reservationId = context.params.reservationId;

      console.log(`🔔 Rezervasyon güncellendi: ${reservationId}`);
      console.log(`📊 Status: ${before.status} → ${after.status}`);

      // ✅ Kontrol 1: Status "cancelled" mi?
      if (after.status !== "cancelled") {
        console.log("ℹ️ Status 'cancelled' değil, işlem yapılmadı.");
        return null;
      }

      // ✅ Kontrol 2: Daha önce iptal WhatsApp'ı gönderilmiş mi?
      if (after.whatsappCancelSent === true) {
        console.log("ℹ️ İptal WhatsApp mesajı zaten gönderilmiş.");
        return null;
      }

      // ✅ Kontrol 3: Status değişti mi?
      if (before.status === "cancelled" && after.status === "cancelled") {
        console.log("ℹ️ Status zaten 'cancelled' idi, tekrar mesaj gönderilmedi.");
        return null;
      }

      console.log("✨ Rezervasyon iptal edildi! WhatsApp mesajı hazırlanıyor...");

      // 📝 Rezervasyon bilgilerini al
      const userName = after.userName || "Değerli Müşterimiz";
      const userPhone = after.userPhone || "";
      const date = after.date || "";
      const timeSlotDisplay = after.timeSlotDisplay || "Belirtilmemiş";
      const boatName = after.boatName || "BALIK SEFASI";
      const reservationNumber = after.reservationNumber || "";
      const boatMapsLink = after.boatMapsLink || "";

      // 🌙 Gece turu kontrolü (iptal mesajı için)
      let nightWarning = "";
      let baitWarning = "";
      
      // Yem uyarısı kontrolü - Rezervasyonda baitWarning alanı varsa
      if (after.baitWarning === true) {
        baitWarning = `\n\n⚠️ UYARI: YEMİNİZİ GETİRMEYİ UNUTMAYIN!`;
      }
      
      // Gece turu için gün bilgisi
      if (timeSlotDisplay && timeSlotDisplay.includes("-")) {
        const [startTime, endTime] = timeSlotDisplay.split("-").map(t => t.trim());
        if (isOvernightTour(startTime, endTime)) {
          const currentDay = getDayName(date);
          const nextDay = getNextDayName(date);
          nightWarning = `\n🌙 ${currentDay}'yı ${nextDay}'ya bağlayan gece`;
        }
      }

      // 📞 Telefon numarası kontrolü
      if (!userPhone) {
        console.error("❌ Telefon numarası bulunamadı!");
        await change.after.ref.update({
          whatsappCancelSent: false,
          whatsappCancelError: "Telefon numarası eksik",
          whatsappCancelSentAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return null;
      }

      // 📱 Telefon numarasını formatla
      const formattedPhone = formatPhoneNumber(userPhone);
      console.log(`📱 Formatlanmış telefon: +${formattedPhone}`);

      // 📅 Tarihi Türkçe formatla
      const formattedDate = formatDateTurkish(date);

      // 💬 WhatsApp iptal mesajını oluştur
      const message = `🐟 Balık Sefası

Merhaba ${userName},

Rezervasyonunuz iptal edildi.

🎫 Rezervasyon No: ${reservationNumber}
📅 Tarih: ${formattedDate}
🕐 Saat: ${timeSlotDisplay}${nightWarning}
⛵ Tekne: ${boatName}
${boatMapsLink ? `📍 Konum: ${boatMapsLink}` : ''}${baitWarning}

Tekrar görüşmek dileğiyle 🙏
www.baliksefasi.com/iletisim`;

      // 🔑 .env'den okunan API bilgilerini kullan
      if (!accessToken || !phoneId) {
        console.error("❌ META_ACCESS_TOKEN veya META_PHONE_ID bulunamadı!");
        await change.after.ref.update({
          whatsappCancelSent: false,
          whatsappCancelError: "API credentials eksik",
          whatsappCancelSentAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return null;
      }

      // 🚀 WhatsApp Cloud API'ye mesaj gönder
      console.log("📤 WhatsApp API'ye iptal mesajı gönderiliyor...");
      
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

      // ✅ Başarılı mı kontrol et
      if (response.ok && responseData.messages) {
        console.log("✅ İptal WhatsApp mesajı başarıyla gönderildi!");
        console.log("📊 Response:", JSON.stringify(responseData));

        // Firestore'u güncelle (başarılı)
        await change.after.ref.update({
          whatsappCancelSent: true,
          whatsappCancelSentAt: admin.firestore.FieldValue.serverTimestamp(),
          whatsappCancelMessageId: responseData.messages[0]?.id || null,
        });

        console.log("✅ Firestore güncellendi: whatsappCancelSent = true");
        return null;
      } else {
        // ❌ Hata durumu
        console.error("❌ WhatsApp API hatası!");
        console.error("Status:", response.status);
        console.error("Response:", JSON.stringify(responseData));

        await change.after.ref.update({
          whatsappCancelSent: false,
          whatsappCancelError: responseData.error?.message || "API hatası",
          whatsappCancelSentAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return null;
      }
    } catch (error) {
      console.error("❌ Cloud Function hatası:", error.message);
      console.error("Stack:", error.stack);

      // Hata durumunda Firestore'u güncelle
      try {
        await change.after.ref.update({
          whatsappCancelSent: false,
          whatsappCancelError: error.message,
          whatsappCancelSentAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (updateError) {
        console.error("❌ Firestore güncelleme hatası:", updateError.message);
      }

      return null;
    }
  });

/**
 * 🎯 WhatsApp Webhook: Gelen Mesajları Dinle ve Otomatik Onayla
 * Trigger: HTTP Request (POST/GET)
 * Endpoint: /whatsappWebhook
 * 
 * Müşteri WhatsApp'tan rezervasyon numarası ile mesaj gönderdiğinde
 * otomatik olarak rezervasyonu confirmed yapar.
 */
exports.whatsappWebhook = functions
  .region("us-central1")
  .https
  .onRequest(async (req, res) => {
    try {
      // ✅ GET Request - Webhook Verification (Meta gereksinimi)
      if (req.method === "GET") {
        const mode = req.query["hub.mode"];
        const token = req.query["hub.verify_token"];
        const challenge = req.query["hub.challenge"];

        console.log("🔍 Webhook verification isteği:", { mode, token });

        // Verify token kontrolü
        if (mode === "subscribe" && token === "balik_sefasi_webhook_2024") {
          console.log("✅ Webhook doğrulandı!");
          return res.status(200).send(challenge);
        } else {
          console.error("❌ Webhook doğrulama başarısız!");
          return res.sendStatus(403);
        }
      }

      // ✅ POST Request - Gelen Mesajlar
      if (req.method === "POST") {
        const body = req.body;

        console.log("📨 Webhook POST isteği alındı");
        console.log("📦 Body:", JSON.stringify(body, null, 2));

        // Mesaj var mı kontrol et
        if (body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
          const message = body.entry[0].changes[0].value.messages[0];
          const messageText = message.text?.body || "";
          const phoneNumber = message.from;

          console.log("📱 Gelen mesaj:", messageText);
          console.log("📞 Telefon numarası:", phoneNumber);

          // Rezervasyon numarasını bul (RV-YYYYMMDD-XXXX formatı)
          const reservationMatch = messageText.match(/RV-\d{8}-\d{4}/);

          if (reservationMatch) {
            const reservationNumber = reservationMatch[0];
            console.log("🎫 Rezervasyon numarası bulundu:", reservationNumber);

            // Firestore'da rezervasyonu bul
            const reservationsRef = admin.firestore().collection("reservations");
            const snapshot = await reservationsRef
              .where("reservationNumber", "==", reservationNumber)
              .where("status", "==", "pending")
              .limit(1)
              .get();

            if (!snapshot.empty) {
              const reservationDoc = snapshot.docs[0];
              const reservationData = reservationDoc.data();

              console.log("📋 Rezervasyon bulundu:", {
                id: reservationDoc.id,
                number: reservationNumber,
                status: reservationData.status,
                userName: reservationData.userName,
              });

              // Otomatik ONAYLA
              await reservationDoc.ref.update({
                status: "confirmed",
                confirmedAt: admin.firestore.FieldValue.serverTimestamp(),
                confirmedVia: "whatsapp_auto",
                confirmedByPhone: phoneNumber,
              });

              console.log("✅ Rezervasyon otomatik onaylandı!");
              console.log("🔔 onReservationApproved function tetiklenecek...");

              // Başarılı response
              return res.status(200).json({
                success: true,
                message: "Rezervasyon otomatik onaylandı",
                reservationNumber: reservationNumber,
              });
            } else {
              console.log("⚠️ Rezervasyon bulunamadı veya zaten onaylı");
              return res.status(200).json({
                success: false,
                message: "Rezervasyon bulunamadı veya zaten onaylı",
              });
            }
          } else {
            console.log("ℹ️ Mesajda rezervasyon numarası bulunamadı");
          }
        } else {
          console.log("ℹ️ Mesaj içeriği bulunamadı");
        }

        // Her durumda 200 dön (Meta beklentisi)
        return res.sendStatus(200);
      }

      // Diğer HTTP metodları
      return res.sendStatus(405);
    } catch (error) {
      console.error("❌ Webhook hatası:", error.message);
      console.error("Stack:", error.stack);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
