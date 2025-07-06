'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function Home() {
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [boatPhotos, setBoatPhotos] = useState<{id: string, url: string, name: string}[]>([]);

  // Fotoğrafları Firebase'den çek
  useEffect(() => {
    const fetchBoatPhotos = async () => {
      try {
        const photosDoc = await getDoc(doc(db, 'settings', 'boatPhotos'));
        if (photosDoc.exists()) {
          const data = photosDoc.data();
          if (data.photos && Array.isArray(data.photos)) {
            setBoatPhotos(data.photos);
          }
        }
      } catch (error) {
        console.error('Fotoğraflar çekilemedi:', error);
        setBoatPhotos([]);
      }
    };

    fetchBoatPhotos();
  }, []);

  // Fotoğraf rotasyonu
  useEffect(() => {
    if (boatPhotos.length > 0) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % boatPhotos.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [boatPhotos]);
    
    return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Ana İçerik */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        
        {/* Logo ve Başlık */}
        <div className="text-center mb-16">
          <div className="mb-8">
            <Image
              src="/logo.png"
              alt="Balık Sefası Logo"
              width={160}
              height={80}
              className="object-contain mx-auto"
              priority
            />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-slate-800 mb-6">
            Balık Sefası
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 mb-4">
            İstanbul Boğazı'nda Balık Avı Keyfi
          </p>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed mb-8">
            Eyüp Odabaşı Sporcular Parkı'ndan kalkan profesyonel balık avı turları
          </p>
          
          {/* Hızlı Aksiyonlar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => {
                document.getElementById('rezervasyon-bolumu')?.scrollIntoView({ 
                  behavior: 'smooth' 
                });
              }}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2"
            >
              <span>🎣</span>
              <span>Hemen Rezervasyon Yap</span>
              <span>↓</span>
            </button>
            
            <a
              href="https://wa.me/905310892537?text=Merhaba,%20Balık%20Sefası%20balık%20avı%20turları%20hakkında%20bilgi%20almak%20istiyorum."
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2"
            >
              <span>💬</span>
              <span>WhatsApp</span>
            </a>
            
            <a
              href="tel:05310892537"
              className="bg-orange-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-orange-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2"
            >
              <span>📞</span>
              <span>Hemen Ara</span>
            </a>
          </div>
        </div>

        {/* Fotoğraf Slider */}
        <div className="relative mb-16">
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-blue-200">
            <div className="aspect-video bg-gradient-to-r from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center overflow-hidden">
            {boatPhotos.length > 0 ? (
                <div className="relative w-full h-full">
                  <Image
                    src={boatPhotos[currentImageIndex].url}
                    alt={boatPhotos[currentImageIndex].name}
                    fill
                    className="object-cover rounded-2xl"
                    sizes="(max-width: 768px) 100vw, 80vw"
                    priority
                  />
                  <div className="absolute bottom-6 right-6 bg-black/60 text-white px-4 py-2 rounded-full text-sm font-medium">
                  {currentImageIndex + 1} / {boatPhotos.length}
                </div>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <div className="text-8xl mb-6">🎣</div>
                  <p className="text-2xl font-medium mb-2">Tekne Fotoğrafları</p>
                  <p className="text-lg">Yükleniyor...</p>
                </div>
            )}
          </div>
        </div>
            </div>

                {/* Ana Rezervasyon Butonu */}
        <div id="rezervasyon-bolumu" className="mb-16">
          
          {/* Öne Çıkan Rezervasyon Kartı */}
          <div className="flex justify-center mb-12">
            <Link href="/randevu" className="group transform hover:scale-105 transition-all duration-300">
              <div className="bg-gradient-to-br from-green-400 via-green-500 to-green-600 rounded-3xl shadow-2xl border-4 border-green-300 p-12 hover:shadow-3xl hover:border-green-200 relative overflow-hidden max-w-lg">
                {/* Parlak efekt */}
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
                
                <div className="text-center relative z-10">
                  <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-all duration-300 shadow-2xl p-4">
                    <Image
                      src="/logo.png"
                      alt="Balık Sefası Logo"
                      width={80}
                      height={80}
                      className="object-contain"
                    />
                  </div>
                  <h3 className="text-4xl font-bold text-white mb-6 drop-shadow-lg">
                    Rezervasyon Yap
                  </h3>
                  <p className="text-green-100 text-xl leading-relaxed mb-6">
                    Balık avı turu için hemen rezervasyon yapın
                  </p>
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                    <p className="text-white font-bold text-lg">
                      ⚡ Hızlı Rezervasyon ⚡
                    </p>
                    <p className="text-green-100 text-sm mt-2">
                      3 kolay adımda rezervasyonunuzu tamamlayın
                    </p>
                  </div>
                </div>
                
                {/* Köşe süsleme */}
                <div className="absolute -top-6 -right-6 w-20 h-20 bg-yellow-300 rounded-full opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-blue-300 rounded-full opacity-20 animate-pulse delay-1000"></div>
              </div>
            </Link>
          </div>

          {/* Diğer 2 Buton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            
            {/* Hakkımızda */}
            <Link href="/hakkimizda" className="group transform hover:scale-105 transition-all duration-300">
              <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-200 p-8 hover:shadow-xl hover:border-blue-300">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:from-blue-500 group-hover:to-blue-700 transition-all duration-300 shadow-lg">
                    <span className="text-white text-3xl">👥</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-3">
                    Hakkımızda
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    Turlar, ekip ve balık türleri hakkında bilgi
                  </p>
                </div>
              </div>
            </Link>

            {/* Görsellerimiz */}
            <Link href="/gorsellerimiz" className="group transform hover:scale-105 transition-all duration-300">
              <div className="bg-white rounded-2xl shadow-lg border-2 border-orange-200 p-8 hover:shadow-xl hover:border-orange-300">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:from-orange-500 group-hover:to-orange-700 transition-all duration-300 shadow-lg">
                    <span className="text-white text-3xl">📸</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-3">
                    Görsellerimiz
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    Tekne ve avladığımız balıkların fotoğrafları
                  </p>
                </div>
              </div>
            </Link>

          </div>
        </div>

        {/* Alt Bilgi */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
            <p className="text-2xl font-bold mb-4">🏆 15+ Yıl Deneyim</p>
            <p className="text-blue-100 text-lg mb-6">
              Güvenli ve keyifli balık avı deneyimi için bizi tercih edin
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/iletisim" className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-all duration-300">
                📞 İletişim
              </Link>
              <a href="tel:05310892537" className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-all duration-300">
                📱 0531 089 25 37
                </a>
              </div>
            </div>
                      </div>

                </div>
      
      {/* Floating WhatsApp Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <a
          href="https://wa.me/905310892537?text=Merhaba,%20Balık%20Sefası%20balık%20avı%20turları%20hakkında%20bilgi%20almak%20istiyorum."
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center animate-pulse"
          title="WhatsApp ile iletişim kurun"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488"/>
          </svg>
        </a>
      </div>
    </div>
  );
}
