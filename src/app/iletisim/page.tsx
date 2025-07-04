"use client";

import type { Metadata } from "next";

// Metadata'yı client component'te export edemeyiz, bu yüzden kaldırıyoruz
// Bunun yerine layout.tsx'te tanımlanabilir

export default function IletisimPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">
            📞 İletişim
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Rezervasyon yapmak, soru sormak veya bilgi almak için bizimle iletişime geçin
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* İletişim Bilgileri */}
          <div className="space-y-6">
            {/* Telefon */}
            <div className="bg-white rounded-2xl shadow-xl border border-green-200 p-6 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">📞</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Telefon</h3>
                  <a 
                    href="tel:05310892537" 
                    className="text-2xl font-bold text-green-600 hover:text-green-700 transition-colors duration-300"
                  >
                    0531 089 25 37
                  </a>
                  <p className="text-slate-600 text-sm mt-2">
                    7/24 rezervasyon ve bilgi hattı
                  </p>
                  <div className="mt-4 flex flex-col sm:flex-row gap-2">
                    <a
                      href="tel:05310892537"
                      className="inline-flex items-center justify-center px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-all duration-300"
                    >
                      📞 Hemen Ara
                    </a>
                    <a
                      href="https://wa.me/905310892537"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all duration-300"
                    >
                      💬 WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Adres */}
            <div className="bg-white rounded-2xl shadow-xl border border-blue-200 p-6 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">📍</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Buluşma Noktası</h3>
                  <div className="text-slate-700 leading-relaxed mb-4">
                    <p className="font-medium">Eyüp Odabaşı Sporcular Parkı</p>
                    <p>Yenimahalle Mah. Yeni Mahalle Cd</p>
                    <p>34450 Sarıyer/İstanbul</p>
                  </div>
                  <div className="mt-4">
                    <a
                      href="https://maps.google.com/?q=Eyüp+Odabaşı+Sporcular+Parkı"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-all duration-300"
                    >
                      🗺️ Haritada Görüntüle
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Çalışma Saatleri */}
            <div className="bg-white rounded-2xl shadow-xl border border-orange-200 p-6 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">🕐</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-800 mb-4">Çalışma Saatleri</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-slate-600">Pazartesi - Cuma</span>
                      <span className="font-bold text-slate-800">07:00 - 20:00</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-slate-600">Cumartesi</span>
                      <span className="font-bold text-slate-800">06:00 - 21:00</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-slate-600">Pazar</span>
                      <span className="font-bold text-slate-800">06:00 - 21:00</span>
                    </div>
                  </div>
                  <p className="text-orange-600 text-sm mt-3 font-medium">
                    ⚠️ Hava durumuna göre değişiklik gösterebilir
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Rezervasyon Formu */}
          <div className="bg-white rounded-2xl shadow-xl border border-purple-200 p-6 hover:shadow-2xl transition-all duration-300">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
              <span className="mr-3 text-2xl">📝</span>
              Hızlı İletişim
            </h3>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Ad Soyad
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-slate-800 bg-white focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300"
                  placeholder="Adınız ve soyadınız"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Telefon
                </label>
                <input
                  type="tel"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-slate-800 bg-white focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300"
                  placeholder="05XX XXX XX XX"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Konu
                </label>
                <select className="w-full px-4 py-3 rounded-xl border border-gray-300 text-slate-800 bg-white focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300">
                  <option value="">Konu seçiniz</option>
                  <option value="rezervasyon">Rezervasyon</option>
                  <option value="fiyat">Fiyat Bilgisi</option>
                  <option value="ozel-tur">Özel Tur</option>
                  <option value="iptal">İptal/Değişiklik</option>
                  <option value="diger">Diğer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Mesaj
                </label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-slate-800 bg-white focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 resize-none"
                  placeholder="Mesajınızı yazın..."
                ></textarea>
              </div>

              <button
                type="button"
                onClick={() => alert('Bu form henüz aktif değil. Lütfen telefon ile iletişime geçin: 0531 089 25 37')}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-bold hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                📤 Mesaj Gönder
              </button>
            </form>

            <div className="mt-6 p-4 bg-purple-50 rounded-xl border border-purple-200">
              <p className="text-purple-800 text-sm text-center">
                <strong>💡 Hızlı Rezervasyon:</strong> Direkt telefon aramanız daha hızlı sonuç alacaksınız!
              </p>
            </div>
          </div>
        </div>

        {/* Nasıl Ulaşılır */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-8 hover:shadow-2xl transition-all duration-300">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
            <span className="mr-3 text-3xl">🚗</span>
            Nasıl Ulaşılır?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <h4 className="font-bold text-slate-800 mb-2 flex items-center">
                  <span className="mr-2">🚗</span>
                  Araçla Ulaşım
                </h4>
                <ul className="text-slate-600 text-sm space-y-1">
                  <li>• Sarıyer istikametine doğru ilerleyin</li>
                  <li>• Eyüp - Alibeyköy yolunu takip edin</li>
                  <li>• Odabaşı Sporcular Parkı tabelalarını izleyin</li>
                  <li>• Park içerisinde ücretsiz otopark mevcut</li>
                </ul>
              </div>

              <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                <h4 className="font-bold text-slate-800 mb-2 flex items-center">
                  <span className="mr-2">🚌</span>
                  Toplu Taşıma
                </h4>
                <ul className="text-slate-600 text-sm space-y-1">
                  <li>• Hacıosman Metro + 42T otobüs</li>
                  <li>• Şişli/Mecidiyeköy'den 42 otobüs</li>
                  <li>• Alibeyköy Cep Otogarı + kısa yürüyüş</li>
                </ul>
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
              <h4 className="font-bold text-slate-800 mb-3 flex items-center">
                <span className="mr-2">⏰</span>
                Buluşma Detayları
              </h4>
              <div className="text-slate-600 text-sm space-y-2">
                <p><strong>📍 Buluşma Yeri:</strong> Park girişindeki büyük ağaç altı</p>
                <p><strong>🕐 Buluşma Saati:</strong> Tur saatinden 15 dakika önce</p>
                <p><strong>📞 Gelirken Arayın:</strong> Konum paylaşımı için</p>
                <p><strong>🎣 Hazırlık:</strong> Rahat kıyafet ve güneş kremi</p>
              </div>
              
              <div className="mt-4 p-3 bg-orange-100 rounded-lg border border-orange-300">
                <p className="text-orange-800 text-xs font-medium">
                  ⚠️ <strong>Önemli:</strong> Buluşma noktasını bulamadığınızda hemen arayın!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Harita */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 hover:shadow-2xl transition-all duration-300">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
            <span className="mr-3 text-2xl">🗺️</span>
            Konum Haritası
          </h2>
          
          <div className="bg-gray-100 rounded-xl h-64 flex items-center justify-center border border-gray-200">
            <div className="text-center text-gray-600">
              <div className="text-4xl mb-2">🗺️</div>
              <p className="font-medium mb-2">Interaktif Harita</p>
              <a
                href="https://maps.google.com/?q=Eyüp+Odabaşı+Sporcular+Parkı"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-all duration-300"
              >
                Google Maps'te Aç
              </a>
            </div>
          </div>
          
          <p className="text-gray-600 text-sm mt-3 text-center">
            Detaylı yol tarifi ve canlı trafik bilgisi için Google Maps'i kullanın
          </p>
        </div>

        {/* CTA Section */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">Hemen Rezervasyon Yapın!</h2>
            <p className="text-blue-100 mb-6 text-lg">
              Unutulmaz bir balık avı deneyimi için bugün arayın
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="tel:05310892537"
                className="inline-block bg-white text-blue-600 px-8 py-3 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                📞 0531 089 25 37
              </a>
              <a
                href="/"
                className="inline-block bg-transparent border-2 border-white text-white px-8 py-3 rounded-xl font-bold text-lg hover:bg-white hover:text-blue-600 transition-all duration-300"
              >
                🎣 Online Rezervasyon
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 