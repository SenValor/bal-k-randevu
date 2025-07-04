import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sıkça Sorulan Sorular - Balık Sefası",
  description: "Balık avı turu, tekne kiralama, ödeme, ekipman ve güvenlik ile ilgili en çok merak edilen soruların cevaplarını bulun.",
  keywords: "sıkça sorulan sorular, SSS, balık avı, tekne kiralama, ödeme, güvenlik, ekipman",
};

export default function SSSPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">
            ❓ Sıkça Sorulan Sorular
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Balık avı turumuz hakkında en çok merak edilen soruların cevaplarını burada bulabilirsiniz
          </p>
        </div>

        <div className="space-y-4">
          {/* FAQ 1 */}
          <details className="bg-white rounded-2xl shadow-xl border border-blue-200 group hover:shadow-2xl transition-all duration-300">
            <summary className="p-6 cursor-pointer hover:bg-blue-50 rounded-2xl transition-all duration-300 flex items-center justify-between">
              <span className="font-bold text-slate-800 text-lg flex items-center">
                <span className="mr-4 text-2xl">🎣</span>
                Olta ve malzemeler dahil mi?
              </span>
              <span className="text-blue-600 text-2xl group-open:rotate-45 transition-transform duration-300">+</span>
            </summary>
            <div className="px-6 pb-6">
              <div className="pt-4 border-t border-blue-100">
                <p className="text-slate-600 text-lg leading-relaxed mb-4">
                  <strong className="text-blue-600">Evet, tamamen dahil!</strong> Profesyonel oltalar, makara, olta ipi ve temel yemler turumza dahildir.
                </p>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <h4 className="font-bold text-slate-800 mb-2">Dahil Olan Malzemeler:</h4>
                  <ul className="text-slate-600 space-y-1">
                    <li>• Profesyonel oltalar ve makaralar</li>
                    <li>• Olta ipleri ve iğneler</li>
                    <li>• Temel yemler (solucan, hamsi vs.)</li>
                    <li>• Balık sepeti ve ölçüm aletleri</li>
                  </ul>
                  <p className="text-slate-600 text-sm mt-3">
                    💡 <strong>İpucu:</strong> Özel istekleriniz varsa kendi malzemelerinizi de getirebilirsiniz.
                  </p>
                </div>
              </div>
            </div>
          </details>

          {/* FAQ 2 */}
          <details className="bg-white rounded-2xl shadow-xl border border-green-200 group hover:shadow-2xl transition-all duration-300">
            <summary className="p-6 cursor-pointer hover:bg-green-50 rounded-2xl transition-all duration-300 flex items-center justify-between">
              <span className="font-bold text-slate-800 text-lg flex items-center">
                <span className="mr-4 text-2xl">🌊</span>
                Hiç balık avlamadım, katılabilir miyim?
              </span>
              <span className="text-green-600 text-2xl group-open:rotate-45 transition-transform duration-300">+</span>
            </summary>
            <div className="px-6 pb-6">
              <div className="pt-4 border-t border-green-100">
                <p className="text-slate-600 text-lg leading-relaxed mb-4">
                  <strong className="text-green-600">Tabii ki, hoş geldiniz!</strong> Başlangıç seviyesindeki misafirlerimize özel rehberlik sunuyoruz.
                </p>
                <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                  <h4 className="font-bold text-slate-800 mb-2">Yeni Başlayanlar İçin Hizmetlerimiz:</h4>
                  <ul className="text-slate-600 space-y-1">
                    <li>• Olta atma tekniği öğretimi</li>
                    <li>• Yem takma ve balık yakalama teknikleri</li>
                    <li>• Balık türleri hakkında bilgilendirme</li>
                    <li>• Güvenlik kuralları eğitimi</li>
                  </ul>
                  <p className="text-green-600 font-medium text-sm mt-3">
                    🎯 Kaptanımız ve ekibimiz size her adımda yardımcı olacak!
                  </p>
                </div>
              </div>
            </div>
          </details>

          {/* FAQ 3 */}
          <details className="bg-white rounded-2xl shadow-xl border border-orange-200 group hover:shadow-2xl transition-all duration-300">
            <summary className="p-6 cursor-pointer hover:bg-orange-50 rounded-2xl transition-all duration-300 flex items-center justify-between">
              <span className="font-bold text-slate-800 text-lg flex items-center">
                <span className="mr-4 text-2xl">🍽️</span>
                Yiyecek ve içecek servisi var mı?
              </span>
              <span className="text-orange-600 text-2xl group-open:rotate-45 transition-transform duration-300">+</span>
            </summary>
            <div className="px-6 pb-6">
              <div className="pt-4 border-t border-orange-100">
                <p className="text-slate-600 text-lg leading-relaxed mb-4">
                  Teknede temel servisimiz mevcut ve kendi yiyeceklerinizi getirebilirsiniz.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                    <h4 className="font-bold text-slate-800 mb-2">🫖 Tekne Servisi</h4>
                    <ul className="text-slate-600 text-sm space-y-1">
                      <li>• Çay, kahve</li>
                      <li>• Su</li>
                      <li>• Temel atıştırmalıklar</li>
                    </ul>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                    <h4 className="font-bold text-slate-800 mb-2">⭐ Özel Tur</h4>
                    <ul className="text-slate-600 text-sm space-y-1">
                      <li>• Mangal imkanı</li>
                      <li>• Geniş yemek alanı</li>
                      <li>• Buzdolabı kullanımı</li>
                    </ul>
                  </div>
                </div>
                <p className="text-slate-600 text-sm mt-3 bg-gray-50 p-3 rounded-lg">
                  📝 <strong>Not:</strong> Kendi yiyecek ve içeceklerinizi getirebilir, tekne üzerinde rahatça tüketebilirsiniz.
                </p>
              </div>
            </div>
          </details>

          {/* FAQ 4 */}
          <details className="bg-white rounded-2xl shadow-xl border border-purple-200 group hover:shadow-2xl transition-all duration-300">
            <summary className="p-6 cursor-pointer hover:bg-purple-50 rounded-2xl transition-all duration-300 flex items-center justify-between">
              <span className="font-bold text-slate-800 text-lg flex items-center">
                <span className="mr-4 text-2xl">🌤️</span>
                Hava durumu kötüyse ne olur?
              </span>
              <span className="text-purple-600 text-2xl group-open:rotate-45 transition-transform duration-300">+</span>
            </summary>
            <div className="px-6 pb-6">
              <div className="pt-4 border-t border-purple-100">
                <p className="text-slate-600 text-lg leading-relaxed mb-4">
                  <strong className="text-purple-600">Güvenlik önceliğimizdir.</strong> Tehlikeli hava koşullarında turlar iptal edilebilir.
                </p>
                <div className="space-y-4">
                  <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                    <h4 className="font-bold text-red-800 mb-2">🚫 İptal Durumları</h4>
                    <ul className="text-red-700 text-sm space-y-1">
                      <li>• Fırtına ve yüksek dalga</li>
                      <li>• Yoğun yağmur ve görüş problemleri</li>
                      <li>• Meteoroloji uyarıları</li>
                    </ul>
                  </div>
                  <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                    <h4 className="font-bold text-green-800 mb-2">✅ Çözümlerimiz</h4>
                    <ul className="text-green-700 text-sm space-y-1">
                      <li>• Alternatif tarih önerisi</li>
                      <li>• Tam ödeme iadesi</li>
                      <li>• 24 saat önceden bilgilendirme</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </details>

          {/* FAQ 5 */}
          <details className="bg-white rounded-2xl shadow-xl border border-cyan-200 group hover:shadow-2xl transition-all duration-300">
            <summary className="p-6 cursor-pointer hover:bg-cyan-50 rounded-2xl transition-all duration-300 flex items-center justify-between">
              <span className="font-bold text-slate-800 text-lg flex items-center">
                <span className="mr-4 text-2xl">⭐</span>
                Özel tur avantajları neler?
              </span>
              <span className="text-cyan-600 text-2xl group-open:rotate-45 transition-transform duration-300">+</span>
            </summary>
            <div className="px-6 pb-6">
              <div className="pt-4 border-t border-cyan-100">
                <p className="text-slate-600 text-lg leading-relaxed mb-4">
                  <strong className="text-cyan-600">Özel turda tüm tekne sizin grubunuz için ayrılır!</strong> Aile ve arkadaş grupları için mükemmel.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-cyan-50 p-4 rounded-xl border border-cyan-200">
                    <h4 className="font-bold text-slate-800 mb-2">🚤 Tekne Avantajları</h4>
                    <ul className="text-slate-600 text-sm space-y-1">
                      <li>• Tüm tekne sadece sizin</li>
                      <li>• 12 kişiye kadar katılım</li>
                      <li>• Gün boyu kullanım (07:00-20:00)</li>
                      <li>• Esnek saat planlaması</li>
                    </ul>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <h4 className="font-bold text-slate-800 mb-2">🎣 Özel Hizmetler</h4>
                    <ul className="text-slate-600 text-sm space-y-1">
                      <li>• Özel balık rotaları</li>
                      <li>• Mangal imkanı dahil</li>
                      <li>• Geniş alan kullanımı</li>
                      <li>• Özel organizasyonlar</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </details>

          {/* FAQ 6 */}
          <details className="bg-white rounded-2xl shadow-xl border border-red-200 group hover:shadow-2xl transition-all duration-300">
            <summary className="p-6 cursor-pointer hover:bg-red-50 rounded-2xl transition-all duration-300 flex items-center justify-between">
              <span className="font-bold text-slate-800 text-lg flex items-center">
                <span className="mr-4 text-2xl">💰</span>
                Ödeme nasıl yapılır?
              </span>
              <span className="text-red-600 text-2xl group-open:rotate-45 transition-transform duration-300">+</span>
            </summary>
            <div className="px-6 pb-6">
              <div className="pt-4 border-t border-red-100">
                <p className="text-slate-600 text-lg leading-relaxed mb-4">
                  Rezervasyon sonrası banka hesabımıza havale/EFT ile ödeme yapabilirsiniz.
                </p>
                <div className="space-y-4">
                  <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                    <h4 className="font-bold text-slate-800 mb-2">💳 Ödeme Yöntemleri</h4>
                    <ul className="text-slate-600 text-sm space-y-1">
                      <li>• Havale / EFT (öncelikli)</li>
                      <li>• Banka hesabına transfer</li>
                      <li>• IBAN üzerinden ödeme</li>
                    </ul>
                    <p className="text-red-600 text-sm mt-2 font-medium">
                      ⚠️ Nakit ödeme kabul edilmemektedir.
                    </p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <h4 className="font-bold text-slate-800 mb-2">📋 Ödeme Süreci</h4>
                    <ol className="text-slate-600 text-sm space-y-1 list-decimal list-inside">
                      <li>Rezervasyon tamamlanır</li>
                      <li>Banka bilgileri size iletilir</li>
                      <li>Ödemeyi 24 saat içinde yapın</li>
                      <li>Ödeme onayı WhatsApp'tan gelir</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </details>

          {/* FAQ 7 - Ek Sorular */}
          <details className="bg-white rounded-2xl shadow-xl border border-indigo-200 group hover:shadow-2xl transition-all duration-300">
            <summary className="p-6 cursor-pointer hover:bg-indigo-50 rounded-2xl transition-all duration-300 flex items-center justify-between">
              <span className="font-bold text-slate-800 text-lg flex items-center">
                <span className="mr-4 text-2xl">🛟</span>
                Güvenlik önlemleri nelerdir?
              </span>
              <span className="text-indigo-600 text-2xl group-open:rotate-45 transition-transform duration-300">+</span>
            </summary>
            <div className="px-6 pb-6">
              <div className="pt-4 border-t border-indigo-100">
                <p className="text-slate-600 text-lg leading-relaxed mb-4">
                  <strong className="text-indigo-600">Güvenliğiniz bizim önceliğimiz!</strong> Tüm güvenlik standartlarına uygun şekilde hizmet veriyoruz.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200">
                    <h4 className="font-bold text-slate-800 mb-2">🚤 Tekne Güvenliği</h4>
                    <ul className="text-slate-600 text-sm space-y-1">
                      <li>• Lisanslı ve sigortalı tekne</li>
                      <li>• Güncel güvenlik sertifikaları</li>
                      <li>• Modern navigasyon ekipmanları</li>
                      <li>• Acil durum kiti</li>
                    </ul>
                  </div>
                  <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                    <h4 className="font-bold text-slate-800 mb-2">👥 Misafir Güvenliği</h4>
                    <ul className="text-slate-600 text-sm space-y-1">
                      <li>• Her misafir için can yeleği</li>
                      <li>• Güvenlik brifingi</li>
                      <li>• Deneyimli kaptan ve ekip</li>
                      <li>• 7/24 iletişim imkanı</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </details>
        </div>

        {/* CTA Section */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">Başka sorularınız mı var?</h2>
            <p className="text-blue-100 mb-6 text-lg">
              Aklınıza takılan tüm soruları çekinmeden bize sorabilirsiniz!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="tel:05310892537"
                className="inline-block bg-white text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                📞 Hemen Arayın
              </a>
              <a
                href="/"
                className="inline-block bg-transparent border-2 border-white text-white px-6 py-3 rounded-xl font-bold hover:bg-white hover:text-blue-600 transition-all duration-300"
              >
                🎣 Rezervasyon Yap
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 