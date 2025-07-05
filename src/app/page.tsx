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
          <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <span className="text-white text-4xl">🐟</span>
        </div>
          <h1 className="text-5xl md:text-7xl font-bold text-slate-800 mb-6">
            Balık Sefası
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 mb-4">
            İstanbul Boğazı'nda Balık Avı Keyfi
          </p>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Eyüp Odabaşı Sporcular Parkı'ndan kalkan profesyonel balık avı turları
          </p>
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

                {/* 3 Ana Buton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          
          {/* Hakkımızda */}
          <Link href="/hakkimizda" className="group transform hover:scale-105 transition-all duration-300">
            <div className="bg-white rounded-3xl shadow-xl border-2 border-blue-200 p-10 hover:shadow-2xl hover:border-blue-300">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:from-blue-500 group-hover:to-blue-700 transition-all duration-300 shadow-lg">
                  <span className="text-white text-4xl">👥</span>
                </div>
                <h3 className="text-3xl font-bold text-slate-800 mb-4">
                  Hakkımızda
                </h3>
                <p className="text-slate-600 text-lg leading-relaxed">
                  Turlar, ekip ve balık türleri hakkında bilgi
                </p>
              </div>
            </div>
          </Link>

          {/* Görsellerimiz */}
          <Link href="/gorsellerimiz" className="group transform hover:scale-105 transition-all duration-300">
            <div className="bg-white rounded-3xl shadow-xl border-2 border-orange-200 p-10 hover:shadow-2xl hover:border-orange-300">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:from-orange-500 group-hover:to-orange-700 transition-all duration-300 shadow-lg">
                  <span className="text-white text-4xl">📸</span>
                </div>
                <h3 className="text-3xl font-bold text-slate-800 mb-4">
                  Görsellerimiz
                </h3>
                <p className="text-slate-600 text-lg leading-relaxed">
                  Tekne ve avladığımız balıkların fotoğrafları
                </p>
              </div>
            </div>
          </Link>

          {/* Rezervasyon Yap */}
          <Link href="/randevu" className="group transform hover:scale-105 transition-all duration-300">
            <div className="bg-white rounded-3xl shadow-xl border-2 border-green-200 p-10 hover:shadow-2xl hover:border-green-300">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:from-green-500 group-hover:to-green-700 transition-all duration-300 shadow-lg">
                  <span className="text-white text-4xl">🎣</span>
                </div>
                <h3 className="text-3xl font-bold text-slate-800 mb-4">
                  Rezervasyon Yap
                </h3>
                <p className="text-slate-600 text-lg leading-relaxed">
                  Balık avı turu için hemen rezervasyon yapın
                </p>
              </div>
            </div>
          </Link>

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
    </div>
  );
}
