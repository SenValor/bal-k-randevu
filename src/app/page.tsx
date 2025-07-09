'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface BoatPhoto {
  id: string;
  url: string;
  name: string;
  type?: 'image' | 'video';
}

export default function Home() {
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [boatPhotos, setBoatPhotos] = useState<BoatPhoto[]>([]);

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {/* Rezervasyon Butonu */}
            <button
              onClick={() => {
                document.getElementById('rezervasyon-bolumu')?.scrollIntoView({ 
                  behavior: 'smooth' 
                });
              }}
              className="group bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-2xl font-bold text-base hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105 flex flex-col items-center space-y-3 border-2 border-blue-400 hover:border-blue-300"
            >
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-white/20 group-hover:bg-white/30 transition-all duration-300">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <div className="text-center">
                <div className="font-bold">Rezervasyon Yap</div>
                <div className="text-xs text-blue-100 mt-1">Hızlı & Kolay</div>
              </div>
            </button>
            
            {/* WhatsApp Butonu */}
            <a
              href="https://wa.me/905310892537?text=Merhaba,%20Balık%20Sefası%20balık%20avı%20turları%20hakkında%20bilgi%20almak%20istiyorum.%20Konum:%20https://maps.app.goo.gl/fVPxCBB9JphkEMBH7"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-green-500 hover:bg-green-600 text-white p-6 rounded-2xl font-bold text-base transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105 flex flex-col items-center space-y-3 border-2 border-green-400 hover:border-green-300"
            >
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-white/20 group-hover:bg-white/30 transition-all duration-300">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488"/>
                </svg>
              </div>
              <div className="text-center">
                <div className="font-bold">WhatsApp</div>
                <div className="text-xs text-green-100 mt-1">Anında Cevap</div>
              </div>
            </a>
            
            {/* Telefon Butonu */}
            <a
              href="tel:05310892537"
              className="group bg-orange-500 hover:bg-orange-600 text-white p-6 rounded-2xl font-bold text-base transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105 flex flex-col items-center space-y-3 border-2 border-orange-400 hover:border-orange-300"
            >
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-white/20 group-hover:bg-white/30 transition-all duration-300">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
              </div>
              <div className="text-center">
                <div className="font-bold">Hemen Ara</div>
                <div className="text-xs text-orange-100 mt-1">7/24 Hizmet</div>
              </div>
            </a>
            
            {/* Instagram Butonu */}
            <a
              href="https://instagram.com/balik.sefasi"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-gradient-to-r from-pink-500 to-purple-600 text-white p-6 rounded-2xl font-bold text-base hover:from-pink-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105 flex flex-col items-center space-y-3 border-2 border-pink-400 hover:border-pink-300"
            >
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-white/20 group-hover:bg-white/30 transition-all duration-300">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </div>
              <div className="text-center">
                <div className="font-bold">Instagram</div>
                <div className="text-xs text-pink-100 mt-1">Güncel Fotoğraflar</div>
              </div>
            </a>
          </div>
        </div>

        {/* Medya Slider */}
        <div className="relative mb-16">
          <div className="bg-white rounded-3xl shadow-2xl p-4 sm:p-6 lg:p-8 border border-blue-200 overflow-hidden">
            {/* Başlık */}
            <div className="text-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2 flex items-center justify-center space-x-2">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17l-4-4 1.41-1.41L9 14.17l6.59-6.59L17 9l-8 8z"/>
                </svg>
                <span>Medya Galerimiz</span>
              </h2>
              <p className="text-slate-600">Teknemiz ve balık avı anlarımız</p>
            </div>
            
            <div className="aspect-video bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-50 rounded-2xl flex items-center justify-center overflow-hidden relative group">
              {boatPhotos.length > 0 ? (
                <div className="relative w-full h-full">
                  {boatPhotos[currentImageIndex].type === 'video' ? (
                    <video
                      src={boatPhotos[currentImageIndex].url}
                      className="w-full h-full object-cover rounded-2xl"
                      controls
                      muted
                      autoPlay
                      loop
                      playsInline
                    />
                  ) : (
                    <Image
                      src={boatPhotos[currentImageIndex].url}
                      alt={boatPhotos[currentImageIndex].name}
                      fill
                      className="object-cover rounded-2xl"
                      sizes="(max-width: 768px) 100vw, 80vw"
                      priority
                    />
                  )}
                  
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent rounded-2xl"></div>
                  
                  {/* Media type indicator */}
                  <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm text-white px-3 py-2 rounded-xl text-sm font-medium flex items-center space-x-2 border border-white/20">
                    {boatPhotos[currentImageIndex].type === 'video' ? (
                      <>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                        <span>Video</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                        </svg>
                        <span>Fotoğraf</span>
                      </>
                    )}
                  </div>
                  
                  {/* Counter and navigation */}
                  <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-xl text-sm font-medium border border-white/20">
                    {currentImageIndex + 1} / {boatPhotos.length}
                  </div>
                  
                  {/* Navigation dots */}
                  {boatPhotos.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                      {boatPhotos.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            index === currentImageIndex 
                              ? 'bg-white w-6' 
                              : 'bg-white/50 hover:bg-white/80'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-slate-400 py-16">
                  <div className="mb-6">
                    <svg className="w-16 h-16 sm:w-20 sm:h-20 mx-auto text-slate-300" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                    </svg>
                  </div>
                  <p className="text-xl sm:text-2xl font-medium mb-2">Medyalar Yükleniyor...</p>
                  <p className="text-base sm:text-lg">Kısa süre sonra görüntülenecek</p>
                </div>
              )}
            </div>
            
            {/* View All Button */}
            {boatPhotos.length > 0 && (
              <div className="text-center mt-6">
                <Link 
                  href="/gorsellerimiz"
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                  </svg>
                  <span>Tüm Medyaları Görüntüle</span>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                  </svg>
                </Link>
              </div>
            )}
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
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <svg className="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 8h4v6h-4v-6z"/>
                      </svg>
                      <p className="text-white font-bold text-lg">Hızlı Rezervasyon</p>
                      <svg className="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 8h4v6h-4v-6z"/>
                      </svg>
                    </div>
                    <p className="text-green-100 text-sm">
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
              <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-200 p-8 hover:shadow-xl hover:border-blue-300 relative overflow-hidden">
                {/* Background pattern */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-transparent rounded-full -translate-y-8 translate-x-8 opacity-30"></div>
                
                <div className="text-center relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:from-blue-500 group-hover:to-blue-700 transition-all duration-300 shadow-lg group-hover:shadow-xl rotate-3 group-hover:rotate-6">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.5 7.5h-5A1.5 1.5 0 0 0 12.04 8.37L9.5 16H12v6h8zM12.5 11.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5S11 9.17 11 10s.67 1.5 1.5 1.5zM5.5 6c1.11 0 2-.89 2-2s-.89-2-2-2-2 .89-2 2 .89 2 2 2zm2 16v-6H10L7.46 8.37A1.5 1.5 0 0 0 6 7.5H1A1.5 1.5 0 0 0 -.46 8.37L2.08 16H4.5v6H7.5z"/>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-3">
                    Hakkımızda
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    Turlar, ekip ve balık türleri hakkında bilgi
                  </p>
                  <div className="inline-flex items-center text-blue-600 font-medium group-hover:text-blue-700 transition-colors">
                    <span>Detayları Görüntüle</span>
                    <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                    </svg>
                  </div>
                </div>
              </div>
            </Link>

            {/* Görsellerimiz */}
            <Link href="/gorsellerimiz" className="group transform hover:scale-105 transition-all duration-300">
              <div className="bg-white rounded-2xl shadow-lg border-2 border-orange-200 p-8 hover:shadow-xl hover:border-orange-300 relative overflow-hidden">
                {/* Background pattern */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-orange-100 to-transparent rounded-full -translate-y-8 -translate-x-8 opacity-30"></div>
                
                <div className="text-center relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:from-orange-500 group-hover:to-orange-700 transition-all duration-300 shadow-lg group-hover:shadow-xl -rotate-3 group-hover:-rotate-6">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-3">
                    Görsellerimiz
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    Tekne ve avladığımız balıkların fotoğrafları
                  </p>
                  <div className="inline-flex items-center text-orange-600 font-medium group-hover:text-orange-700 transition-colors">
                    <span>Galeriyi İncele</span>
                    <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                    </svg>
                  </div>
                </div>
              </div>
            </Link>

          </div>
        </div>

        {/* Başarı ve İletişim */}
        <div className="text-center">
          <div className="bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-40 h-40 bg-white/10 rounded-full -translate-x-20 -translate-y-20"></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-16 translate-y-16"></div>
            
            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7.5 11H6c-.83 0-1.5.67-1.5 1.5S5.17 14 6 14h1.5v1.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V14H12c.83 0 1.5-.67 1.5-1.5S12.83 11 12 11h-1.5V9.5C10.5 8.67 9.83 8 9 8s-1.5.67-1.5 1.5V11zM12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-3xl font-bold">15+ Yıl Deneyim</p>
                  <p className="text-blue-100">Uzman Ekibimizle</p>
                </div>
              </div>
              
              <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
                Güvenli ve keyifli balık avı deneyimi için bizi tercih edin. 
                İstanbul Boğazı'nda unutulmaz anılar biriktirin!
              </p>
              
              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                  <div className="text-2xl font-bold">500+</div>
                  <div className="text-blue-100 text-sm">Mutlu Müşteri</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                  <div className="text-2xl font-bold">%100</div>
                  <div className="text-blue-100 text-sm">Güvenlik</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                  <div className="text-2xl font-bold">7/24</div>
                  <div className="text-blue-100 text-sm">Hizmet</div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/iletisim" className="group bg-white text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                  <span>İletişim</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                  </svg>
                </Link>
                <a href="tel:05310892537" className="group bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                  </svg>
                  <span>0531 089 25 37</span>
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse group-hover:bg-green-200"></div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating WhatsApp Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <a
          href="https://wa.me/905310892537?text=Merhaba,%20Balık%20Sefası%20balık%20avı%20turları%20hakkında%20bilgi%20almak%20istiyorum.%20Konum:%20https://maps.app.goo.gl/fVPxCBB9JphkEMBH7"
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

      {/* Ana Sayfa Footer */}
      <footer className="bg-slate-800 text-white py-8 mt-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-center md:text-left mb-6 md:mb-0">
              <div className="flex items-center justify-center md:justify-start space-x-3 mb-4">
                <Image
                  src="/logo.png"
                  alt="Balık Sefası Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                />
                <h3 className="text-xl font-bold">Balık Sefası</h3>
              </div>
              <p className="text-slate-300 text-sm mb-2">
                İstanbul Boğazı'nda Balık Avı Keyfi
              </p>
              <p className="text-slate-400 text-xs">
                © 2025 Balık Sefası. Tüm hakları saklıdır.
              </p>
            </div>
            
            <div className="flex flex-col items-center space-y-4">
                             <div className="flex flex-col items-center space-y-3">
                 <span className="text-slate-400 text-sm">Design by</span>
                 <a
                   href="https://wa.me/905304235883"
                   target="_blank"
                   rel="noopener noreferrer"
                   className="group relative bg-gradient-to-r from-green-400 via-green-500 to-emerald-600 hover:from-green-500 hover:via-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-2xl font-bold text-base transition-all duration-500 flex items-center space-x-3 shadow-2xl hover:shadow-green-500/50 transform hover:scale-110 hover:-translate-y-1 border-2 border-green-300/50 hover:border-green-200 overflow-hidden"
                   title="MSV Soft ile iletişime geçin"
                 >
                   {/* Arka plan parlama efekti */}
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                   
                   {/* WhatsApp Icon Container */}
                   <div className="relative w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all duration-300 group-hover:rotate-12">
                     <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                       <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488"/>
                     </svg>
                     <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border border-white"></div>
                   </div>
                   
                   {/* Metin */}
                   <div className="relative z-10 flex flex-col items-start">
                     <span className="text-lg font-black tracking-wide">MSV Soft</span>
                     <span className="text-xs text-green-100 opacity-90 font-medium">Web Developer</span>
                   </div>
                   
                   {/* Sağ ok */}
                   <div className="relative">
                     <svg className="w-5 h-5 transform group-hover:translate-x-1 group-hover:scale-110 transition-all duration-300" fill="currentColor" viewBox="0 0 24 24">
                       <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                     </svg>
                   </div>
                   
                   {/* Alt çizgi efekti */}
                   <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-500"></div>
                 </a>
                 
                 {/* Küçük açıklama */}
                 <p className="text-slate-500 text-xs text-center max-w-xs">
                   Profesyonel web tasarım hizmetleri
                 </p>
               </div>
              
              <div className="flex items-center space-x-4 text-slate-400">
                <a href="tel:05310892537" className="hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                  </svg>
                </a>
                <a href="https://wa.me/905310892537" target="_blank" rel="noopener noreferrer" className="hover:text-green-400 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488"/>
                  </svg>
                </a>
                <a href="https://instagram.com/balik.sefasi" target="_blank" rel="noopener noreferrer" className="hover:text-pink-400 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
