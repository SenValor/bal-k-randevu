import React from 'react';

export const metadata = {
  title: 'Gizlilik Politikası | Balık Sefası',
  description: 'Balık Sefası gizlilik politikası ve kişisel verilerin korunması',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E8F4F8] to-white py-20 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8 md:p-12">
        <h1 className="text-4xl font-bold text-[#003366] mb-8">
          Gizlilik Politikası
        </h1>
        
        <div className="space-y-6 text-gray-700 leading-relaxed">
          <section>
            <p className="text-sm text-gray-500 mb-6">
              Son Güncelleme: {new Date().toLocaleDateString('tr-TR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#003366] mb-4">
              1. Giriş
            </h2>
            <p>
              Balık Sefası olarak, kullanıcılarımızın gizliliğine saygı duyuyor ve kişisel verilerinizi korumayı taahhüt ediyoruz. 
              Bu Gizlilik Politikası, web sitemizi ve hizmetlerimizi kullanırken topladığımız bilgileri, bu bilgileri nasıl kullandığımızı 
              ve koruduğumuzu açıklamaktadır.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#003366] mb-4">
              2. Topladığımız Bilgiler
            </h2>
            <p className="mb-3">
              Hizmetlerimizi sunabilmek için aşağıdaki bilgileri toplayabiliriz:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Kişisel Bilgiler:</strong> Ad, soyad, e-posta adresi, telefon numarası</li>
              <li><strong>Rezervasyon Bilgileri:</strong> Tarih, saat, tekne tercihi, katılımcı sayısı</li>
              <li><strong>Ödeme Bilgileri:</strong> Ödeme işlemleri için gerekli finansal bilgiler</li>
              <li><strong>Teknik Bilgiler:</strong> IP adresi, tarayıcı türü, cihaz bilgileri, çerezler</li>
              <li><strong>İletişim Bilgileri:</strong> Bizimle paylaştığınız mesajlar ve geri bildirimler</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#003366] mb-4">
              3. Bilgilerin Kullanımı
            </h2>
            <p className="mb-3">
              Topladığımız bilgileri şu amaçlarla kullanırız:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Rezervasyon işlemlerinizi gerçekleştirmek ve yönetmek</li>
              <li>Size hizmet sunmak ve müşteri desteği sağlamak</li>
              <li>Rezervasyon onayları ve hatırlatıcılar göndermek (WhatsApp, e-posta, SMS)</li>
              <li>Hizmetlerimizi geliştirmek ve kişiselleştirmek</li>
              <li>Yasal yükümlülüklerimizi yerine getirmek</li>
              <li>Güvenlik ve dolandırıcılık önleme</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#003366] mb-4">
              4. WhatsApp İletişimi
            </h2>
            <p>
              Rezervasyon onaylarınızı ve önemli bildirimleri WhatsApp üzerinden gönderebiliriz. 
              Telefon numaranızı paylaşarak, bu tür iletişimleri almayı kabul etmiş olursunuz. 
              WhatsApp iletişimini istediğiniz zaman durdurabilirsiniz.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#003366] mb-4">
              5. Bilgi Paylaşımı
            </h2>
            <p className="mb-3">
              Kişisel bilgilerinizi üçüncü taraflarla paylaşmıyoruz. Ancak aşağıdaki durumlarda paylaşım yapabiliriz:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Hizmet Sağlayıcılar:</strong> Ödeme işlemleri, hosting, analitik hizmetleri için</li>
              <li><strong>Yasal Zorunluluklar:</strong> Yasal talep veya mahkeme kararı durumunda</li>
              <li><strong>İş Transferi:</strong> Şirket birleşme veya satış durumunda</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#003366] mb-4">
              6. Veri Güvenliği
            </h2>
            <p>
              Kişisel verilerinizi korumak için endüstri standardı güvenlik önlemleri kullanıyoruz. 
              Verileriniz şifreli bağlantılar (SSL/TLS) üzerinden iletilir ve güvenli sunucularda saklanır. 
              Firebase güvenlik protokollerini kullanarak verilerinizi koruyoruz.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#003366] mb-4">
              7. Çerezler (Cookies)
            </h2>
            <p>
              Web sitemiz, kullanıcı deneyimini iyileştirmek için çerezler kullanır. 
              Çerezler, tarayıcınızda saklanan küçük metin dosyalarıdır. Tarayıcı ayarlarınızdan çerezleri yönetebilir 
              veya devre dışı bırakabilirsiniz.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#003366] mb-4">
              8. Haklarınız
            </h2>
            <p className="mb-3">
              KVKK (Kişisel Verilerin Korunması Kanunu) kapsamında aşağıdaki haklara sahipsiniz:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
              <li>Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme</li>
              <li>Kişisel verilerinizin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme</li>
              <li>Kişisel verilerinizin yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme</li>
              <li>Kişisel verilerinizin eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme</li>
              <li>Kişisel verilerinizin silinmesini veya yok edilmesini isteme</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#003366] mb-4">
              9. Veri Saklama Süresi
            </h2>
            <p>
              Kişisel verilerinizi, hizmetlerimizi sunmak için gerekli olduğu sürece veya yasal yükümlülüklerimiz 
              gerektirdiği sürece saklarız. Rezervasyon kayıtları, muhasebe ve vergi mevzuatı gereği en az 10 yıl süreyle saklanır.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#003366] mb-4">
              10. Çocukların Gizliliği
            </h2>
            <p>
              Hizmetlerimiz 18 yaşın altındaki kişilere yönelik değildir. 18 yaşından küçük kullanıcılardan 
              bilerek kişisel bilgi toplamıyoruz.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#003366] mb-4">
              11. Üçüncü Taraf Bağlantılar
            </h2>
            <p>
              Web sitemiz, üçüncü taraf web sitelerine bağlantılar içerebilir. Bu sitelerin gizlilik politikalarından 
              sorumlu değiliz. Bu siteleri ziyaret ettiğinizde kendi gizlilik politikalarını incelemenizi öneririz.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#003366] mb-4">
              12. Politika Değişiklikleri
            </h2>
            <p>
              Bu Gizlilik Politikasını zaman zaman güncelleyebiliriz. Önemli değişiklikler olduğunda, 
              web sitemizde duyuru yaparak veya e-posta göndererek sizi bilgilendireceğiz. 
              Politikayı düzenli olarak gözden geçirmenizi öneririz.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#003366] mb-4">
              13. İletişim
            </h2>
            <p className="mb-4">
              Gizlilik politikamız veya kişisel verilerinizle ilgili sorularınız için bizimle iletişime geçebilirsiniz:
            </p>
            <div className="bg-[#E8F4F8] p-6 rounded-lg space-y-2">
              <p><strong>Balık Sefası</strong></p>
              <p>📧 E-posta: info@baliksefasi.com</p>
              <p>📞 Telefon: 0555 123 45 67</p>
              <p>🌐 Web: www.baliksefasi.com</p>
              <p>📍 Adres: İstanbul, Türkiye</p>
            </div>
          </section>

          <section className="mt-8 pt-6 border-t border-gray-200">
            <h2 className="text-2xl font-semibold text-[#003366] mb-4">
              14. Onay
            </h2>
            <p>
              Web sitemizi kullanarak ve hizmetlerimizden faydalanarak, bu Gizlilik Politikasını okuduğunuzu, 
              anladığınızı ve kabul ettiğinizi beyan etmiş olursunuz.
            </p>
          </section>

          <div className="mt-12 pt-8 border-t-2 border-[#00A9A5] text-center">
            <p className="text-sm text-gray-500">
              Bu gizlilik politikası, Türkiye Cumhuriyeti yasalarına ve 6698 sayılı Kişisel Verilerin Korunması Kanunu'na (KVKK) uygun olarak hazırlanmıştır.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
