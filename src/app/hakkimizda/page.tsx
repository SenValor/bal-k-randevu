import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hakkımızda - Balık Sefası",
  description: "Balık Sefası ailesi, deneyimli ekibimiz ve hizmet felsefemiz hakkında bilgi alın. 15+ yıl deneyim, lisanslı kaptan ve güvenlik öncelikli hizmet.",
  keywords: "hakkımızda, balık sefası, deneyim, kaptan, tekne kiralama, güvenlik",
};

export default function HakkimizdaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">
            👨‍👩‍👧‍👦 Hakkımızda
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            İstanbul Boğazı'nda profesyonel balık avı turları düzenleyen deneyimli ekibimizle tanışın
          </p>
        </div>

        <div className="space-y-8">
          {/* Ana Açıklama */}
          <div className="bg-white rounded-2xl shadow-xl border border-blue-200 p-8 hover:shadow-2xl transition-all duration-300">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
              <span className="mr-3 text-3xl">⚓</span>
              Balık Sefası Ailesi
            </h2>
            <p className="text-slate-700 text-lg leading-relaxed mb-6">
              Yılların deneyimiyle İstanbul Boğazı'nda profesyonel balık avı turları düzenliyoruz. 
              Denizcilik alanında uzman ekibimizle güvenli ve keyifli bir deneyim sunuyoruz.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="w-3 h-3 bg-blue-500 rounded-full mx-auto mb-2"></div>
                <span className="text-slate-700 font-medium text-sm">15+ Yıl Deneyim</span>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                <span className="text-slate-700 font-medium text-sm">Lisanslı Kaptan</span>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
                <div className="w-3 h-3 bg-purple-500 rounded-full mx-auto mb-2"></div>
                <span className="text-slate-700 font-medium text-sm">Modern Tekne</span>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-xl border border-orange-200">
                <div className="w-3 h-3 bg-orange-500 rounded-full mx-auto mb-2"></div>
                <span className="text-slate-700 font-medium text-sm">Güvenlik Öncelikli</span>
              </div>
            </div>
          </div>

          {/* Hizmet Felsefemiz */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl shadow-xl border border-blue-200 p-8 hover:shadow-2xl transition-all duration-300">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
              <span className="mr-3 text-3xl">🎯</span>
              Hizmet Felsefemiz
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-4">
                <span className="text-blue-600 text-4xl">🎣</span>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Profesyonel Ekipman</h3>
                  <p className="text-slate-600">Kaliteli oltalar ve taze yemler ile balık avı deneyiminizi en üst seviyeye çıkarıyoruz.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <span className="text-green-600 text-4xl">🛟</span>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Güvenlik İlk Sırada</h3>
                  <p className="text-slate-600">Can yeleği ve güvenlik önlemleri ile tüm misafirlerimizin güvenliğini garanti ediyoruz.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <span className="text-orange-600 text-4xl">👨‍🏫</span>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Rehberlik Hizmeti</h3>
                  <p className="text-slate-600">Başlangıç seviyesinden ileri düzeye, her seviyede misafirimize özel rehberlik sunuyoruz.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <span className="text-purple-600 text-4xl">🏆</span>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Memnuniyet Garantisi</h3>
                  <p className="text-slate-600">%100 müşteri memnuniyeti hedefi ile her turda en iyi hizmeti vermeye odaklanıyoruz.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Kaptan & Ekip */}
          <div className="bg-white rounded-2xl shadow-xl border border-green-200 p-8 hover:shadow-2xl transition-all duration-300">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
              <span className="mr-3 text-3xl">🧑‍✈️</span>
              Kaptan & Ekibimiz
            </h2>
            <p className="text-slate-700 text-lg leading-relaxed mb-6">
              Denizcilik lisansına sahip profesyonel kaptanımız ve yardımcı ekibimizle, 
              her turda güvenliğinizi ve konforunuzu önceleyerek unutulmaz anılar yaşatıyoruz. 
              İstanbul Boğazı'nın en iyi balık noktalarını biliyoruz!
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-gradient-to-b from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                <div className="text-4xl mb-3">👨‍✈️</div>
                <h3 className="font-bold text-slate-800 mb-2">Profesyonel Kaptan</h3>
                <p className="text-slate-600 text-sm">Denizcilik lisansına sahip, 15+ yıl deneyimli kaptanımız</p>
              </div>
              <div className="text-center p-6 bg-gradient-to-b from-green-50 to-green-100 rounded-xl border border-green-200">
                <div className="text-4xl mb-3">👨‍🔧</div>
                <h3 className="font-bold text-slate-800 mb-2">Teknik Ekip</h3>
                <p className="text-slate-600 text-sm">Tekne bakımı ve ekipman kontrolü konusunda uzman ekibimiz</p>
              </div>
              <div className="text-center p-6 bg-gradient-to-b from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                <div className="text-4xl mb-3">🎣</div>
                <h3 className="font-bold text-slate-800 mb-2">Balık Rehberi</h3>
                <p className="text-slate-600 text-sm">Balık avı teknikleri ve bölge bilgisi konusunda uzman rehberimiz</p>
              </div>
            </div>
          </div>

          {/* Neden Bizi Seçmelisiniz */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl shadow-xl border border-purple-200 p-8 hover:shadow-2xl transition-all duration-300">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
              <span className="mr-3 text-3xl">⭐</span>
              Neden Balık Sefası?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <span className="text-slate-700 font-medium">Güncel güvenlik sertifikaları</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <span className="text-slate-700 font-medium">Sigortalı ve lisanslı tekne</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <span className="text-slate-700 font-medium">Modern navigasyon ekipmanları</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <span className="text-slate-700 font-medium">Kaliteli balık avı malzemeleri</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <span className="text-slate-700 font-medium">Esnek rezervasyon seçenekleri</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <span className="text-slate-700 font-medium">Hava durumu garantisi</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <span className="text-slate-700 font-medium">Özel grup düzenlemeleri</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <span className="text-slate-700 font-medium">7/24 müşteri desteği</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">Hazır mısınız?</h2>
            <p className="text-blue-100 mb-6 text-lg">
              Unutulmaz bir balık avı deneyimi için hemen rezervasyon yapın!
            </p>
            <a
              href="/"
              className="inline-block bg-white text-blue-600 px-8 py-3 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              🎣 Rezervasyon Yap
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 