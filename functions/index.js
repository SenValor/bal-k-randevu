/**
 * 🐟 Balık Sefası - WhatsApp Bildirim Sistemi (ŞABLONLU)
 * Firebase Functions v3 + Node.js 22
 */

require("dotenv").config();
const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const accessToken = process.env.META_ACCESS_TOKEN;
const phoneId = process.env.META_PHONE_ID;

console.log("🔥 ENV META_ACCESS_TOKEN:", accessToken ? "Var ✅" : "Yok ❌");
console.log("🔥 ENV META_PHONE_ID:", phoneId ? "Var ✅" : "Yok ❌");

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

      if (after.status !== "confirmed") return;
      if (after.whatsappSent === true) return;
      if (before.status === "confirmed" && after.status === "confirmed") return;

      const {
        userName = "Değerli Müşterimiz",
        userPhone,
        date,
        timeSlotDisplay = "Belirtilmemiş",
        boatName = "BALIK SEFASI",
        reservationNumber = "BS-XXXX",
        boatMapsLink = "",
      } = after;

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

      // 🚀 TEMPLATE mesajı gönder
      const apiUrl = `https://graph.facebook.com/v22.0/${phoneId}/messages`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
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
                  { type: "text", text: boatMapsLink || "Konum bilgisi bulunamadı" },
                ],
              },
            ],
          },
        }),
      });

      const data = await response.json();

      if (response.ok && data.messages) {
        console.log("✅ WhatsApp TEMPLATE mesajı gönderildi!");
        await change.after.ref.update({
          whatsappSent: true,
          whatsappSentAt: admin.firestore.FieldValue.serverTimestamp(),
          whatsappMessageId: data.messages[0]?.id || null,
          whatsappPhone: formattedPhone,
        });
      } else {
        console.error("❌ WhatsApp API hatası:", data);
        await change.after.ref.update({
          whatsappSent: false,
          whatsappError: data.error?.message || "API hatası",
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
      } = after;

      if (!userPhone) {
        await change.after.ref.update({
          whatsappCancelSent: false,
          whatsappCancelError: "Telefon numarası eksik",
        });
        return;
      }

      const formattedPhone = formatPhoneNumber(userPhone);
      const formattedDate = formatDateTurkish(date);
      const apiUrl = `https://graph.facebook.com/v22.0/${phoneId}/messages`;

      // 🚀 TEMPLATE mesajı gönder
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
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
                  { type: "text", text: boatMapsLink || "Konum bilgisi bulunamadı" },
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
