'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Calendar } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E8F4F8] to-white py-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <FileText className="w-12 h-12 text-[#003366]" />
          </div>
          <h1 className="text-4xl font-bold text-[#003366] mb-4">
            Kullanım Koşulları
          </h1>
          <p className="text-gray-600 flex items-center justify-center gap-2">
            <Calendar className="w-4 h-4" />
            Son Güncelleme: 30 Ekim 2025
          </p>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-8 md:p-12 space-y-8"
        >
          {/* 1. Genel Bilgiler */}
          <section>
            <h2 className="text-2xl font-bold text-[#003366] mb-4">1. Genel Bilgiler</h2>
            <div className="space-y-3 text-gray-700">
              <p>
                Balık Sefası web sitesi ve hizmetlerini kullanarak aşağıdaki kullanım koşullarını kabul etmiş sayılırsınız.
              </p>
              <p>
                <strong>Şirket Adı:</strong> Balık Sefası Tekne Kiralama ve Balık Avı Turları
              </p>
              <p>
                <strong>Web Sitesi:</strong> www.baliksefasi.com
              </p>
              <p>
                <strong>İletişim:</strong> info@baliksefasi.com | 0531 089 25 37
              </p>
            </div>
          </section>

          {/* 2. Hizmet Kapsamı */}
          <section>
            <h2 className="text-2xl font-bold text-[#003366] mb-4">2. Hizmet Kapsamı</h2>
            <div className="space-y-3 text-gray-700">
              <p>Balık Sefası aşağıdaki hizmetleri sunmaktadır:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Tekne kiralama hizmetleri</li>
                <li>Balık avı turları organizasyonu</li>
                <li>Grup ve özel organizasyonlar</li>
                <li>Online rezervasyon sistemi</li>
                <li>WhatsApp üzerinden rezervasyon bildirimleri</li>
              </ul>
            </div>
          </section>

          {/* 3. Rezervasyon Koşulları */}
          <section>
            <h2 className="text-2xl font-bold text-[#003366] mb-4">3. Rezervasyon Koşulları</h2>
            <div className="space-y-3 text-gray-700">
              <p><strong>3.1. Rezervasyon Süreci:</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Rezervasyonlar online sistem üzerinden veya telefon ile yapılabilir</li>
                <li>Her rezervasyona benzersiz bir rezervasyon numarası atanır</li>
                <li>Rezervasyon onayı WhatsApp ve/veya e-posta ile gönderilir</li>
              </ul>

              <p className="mt-4"><strong>3.2. Ödeme Koşulları:</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Rezervasyon bedeli tur başlangıcından önce ödenmelidir</li>
                <li>Ödeme yöntemleri: Nakit, Kredi Kartı, Havale/EFT</li>
                <li>Fiyatlar Türk Lirası (TL) cinsindendir</li>
              </ul>

              <p className="mt-4"><strong>3.3. İptal ve İade Koşulları:</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Tur tarihinden 7 gün öncesine kadar yapılan iptallerde %100 iade</li>
                <li>3-7 gün arası iptallerde %50 iade</li>
                <li>3 günden az kala yapılan iptallerde iade yapılmaz</li>
                <li>Hava koşulları nedeniyle iptal edilen turlarda %100 iade veya tarih değişikliği</li>
              </ul>
            </div>
          </section>

          {/* 4. Kullanıcı Sorumlulukları */}
          <section>
            <h2 className="text-2xl font-bold text-[#003366] mb-4">4. Kullanıcı Sorumlulukları</h2>
            <div className="space-y-3 text-gray-700">
              <p>Kullanıcılar aşağıdaki hususlardan sorumludur:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Doğru ve güncel bilgi sağlamak</li>
                <li>Rezervasyon numarasını güvenli bir şekilde saklamak</li>
                <li>Tur kurallarına ve güvenlik talimatlarına uymak</li>
                <li>Belirlenen saatte kalkış noktasında hazır bulunmak</li>
                <li>Gerekli kişisel koruyucu ekipmanları kullanmak</li>
              </ul>
            </div>
          </section>

          {/* 5. Kişisel Veri İşleme */}
          <section>
            <h2 className="text-2xl font-bold text-[#003366] mb-4">5. Kişisel Veri İşleme</h2>
            <div className="space-y-3 text-gray-700">
              <p>
                Kişisel verileriniz KVKK kapsamında işlenmektedir. Detaylı bilgi için{' '}
                <a href="/privacy-policy" className="text-[#00A9A5] hover:underline">
                  Gizlilik Politikası
                </a>{' '}
                sayfamızı inceleyebilirsiniz.
              </p>
              <p>
                Verilerinizin silinmesini talep etmek için{' '}
                <a href="/data-deletion" className="text-[#00A9A5] hover:underline">
                  Veri Silme
                </a>{' '}
                sayfasını ziyaret edebilirsiniz.
              </p>
            </div>
          </section>

          {/* 6. Sorumluluk Sınırlaması */}
          <section>
            <h2 className="text-2xl font-bold text-[#003366] mb-4">6. Sorumluluk Sınırlaması</h2>
            <div className="space-y-3 text-gray-700">
              <p>Balık Sefası aşağıdaki durumlardan sorumlu değildir:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Hava koşulları nedeniyle tur iptalleri</li>
                <li>Kullanıcıların kişisel eşyalarının kaybolması veya zarar görmesi</li>
                <li>Kullanıcıların güvenlik kurallarına uymaması sonucu oluşan durumlar</li>
                <li>Üçüncü taraf hizmetlerden kaynaklanan sorunlar</li>
              </ul>
            </div>
          </section>

          {/* 7. Fikri Mülkiyet */}
          <section>
            <h2 className="text-2xl font-bold text-[#003366] mb-4">7. Fikri Mülkiyet Hakları</h2>
            <div className="space-y-3 text-gray-700">
              <p>
                Web sitesindeki tüm içerik, tasarım, logo, metin, görsel ve diğer materyaller 
                Balık Sefası'nın mülkiyetindedir ve telif hakkı yasaları ile korunmaktadır.
              </p>
              <p>
                İçeriklerin izinsiz kopyalanması, çoğaltılması veya dağıtılması yasaktır.
              </p>
            </div>
          </section>

          {/* 8. Değişiklikler */}
          <section>
            <h2 className="text-2xl font-bold text-[#003366] mb-4">8. Kullanım Koşullarında Değişiklikler</h2>
            <div className="space-y-3 text-gray-700">
              <p>
                Balık Sefası, kullanım koşullarını önceden haber vermeksizin değiştirme hakkını saklı tutar. 
                Değişiklikler web sitesinde yayınlandığı anda yürürlüğe girer.
              </p>
              <p>
                Kullanıcıların değişiklikleri düzenli olarak kontrol etmesi önerilir.
              </p>
            </div>
          </section>

          {/* 9. Uygulanacak Hukuk */}
          <section>
            <h2 className="text-2xl font-bold text-[#003366] mb-4">9. Uygulanacak Hukuk ve Yetki</h2>
            <div className="space-y-3 text-gray-700">
              <p>
                Bu kullanım koşulları Türkiye Cumhuriyeti yasalarına tabidir.
              </p>
              <p>
                Bu koşullardan doğabilecek uyuşmazlıklarda İstanbul Mahkemeleri ve İcra Daireleri yetkilidir.
              </p>
            </div>
          </section>

          {/* 10. İletişim */}
          <section>
            <h2 className="text-2xl font-bold text-[#003366] mb-4">10. İletişim</h2>
            <div className="space-y-3 text-gray-700">
              <p>Kullanım koşulları hakkında sorularınız için bizimle iletişime geçebilirsiniz:</p>
              <div className="bg-[#E8F4F8] rounded-lg p-4 mt-4">
                <p><strong>E-posta:</strong> info@baliksefasi.com</p>
                <p><strong>Telefon:</strong> 0531 089 25 37</p>
                <p><strong>Adres:</strong> İstanbul, Türkiye</p>
                <p><strong>Web:</strong> www.baliksefasi.com</p>
              </div>
            </div>
          </section>

          {/* Footer Note */}
          <div className="border-t border-gray-200 pt-6 mt-8">
            <p className="text-sm text-gray-500 text-center">
              Bu kullanım koşulları 30 Ekim 2025 tarihinde güncellenmiştir ve hemen yürürlüğe girmiştir.
            </p>
          </div>
        </motion.div>

        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-8"
        >
          <a
            href="/"
            className="inline-block px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-[#004488] transition-colors"
          >
            Ana Sayfaya Dön
          </a>
        </motion.div>
      </div>
    </div>
  );
}
