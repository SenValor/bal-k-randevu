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
}

export default function GorsellerimizPage() {
  const [boatPhotos, setBoatPhotos] = useState<BoatPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<BoatPhoto | null>(null);

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
        console.error('Fotoğraflar yüklenemedi:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBoatPhotos();
  }, []);

  const openLightbox = (photo: BoatPhoto) => {
    setSelectedPhoto(photo);
  };

  const closeLightbox = () => {
    setSelectedPhoto(null);
  };

  const nextPhoto = () => {
    if (!selectedPhoto) return;
    const currentIndex = boatPhotos.findIndex(p => p.id === selectedPhoto.id);
    const nextIndex = (currentIndex + 1) % boatPhotos.length;
    setSelectedPhoto(boatPhotos[nextIndex]);
  };

  const prevPhoto = () => {
    if (!selectedPhoto) return;
    const currentIndex = boatPhotos.findIndex(p => p.id === selectedPhoto.id);
    const prevIndex = (currentIndex - 1 + boatPhotos.length) % boatPhotos.length;
    setSelectedPhoto(boatPhotos[prevIndex]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Link href="/" className="inline-block mb-6 text-orange-100 hover:text-white transition-colors">
            ← Ana Sayfaya Dön
          </Link>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">📸 Görsellerimiz</h1>
          <p className="text-xl text-orange-100">
            Teknemiz ve unutulmaz balık avı anlarımız
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Fotoğraflar yükleniyor...</p>
          </div>
        ) : boatPhotos.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-8xl mb-8">📷</div>
            <h3 className="text-2xl font-bold text-gray-600 mb-4">Henüz Fotoğraf Eklenmemiş</h3>
            <p className="text-gray-500 text-lg">Yakında güzel fotoğraflarımızı paylaşacağız!</p>
          </div>
        ) : (
          <>
            {/* Başlık ve Açıklama */}
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-800 mb-4">
                Balık Sefası Fotoğraf Galerisi
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                İstanbul Boğazı'nda geçirdiğimiz keyifli anlar, yakaladığımız balıklar ve 
                teknemizdeki mutlu misafirlerimizin fotoğrafları
              </p>
              <div className="mt-6 text-orange-600 font-medium">
                {boatPhotos.length} fotoğraf • Büyütmek için tıklayın
              </div>
            </div>

            {/* Fotoğraf Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {boatPhotos.map((photo, index) => (
                <div 
                  key={photo.id}
                  onClick={() => openLightbox(photo)}
                  className="relative aspect-square bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group border-4 border-white hover:border-orange-200"
                >
                  <Image
                    src={photo.url}
                    alt={photo.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                    <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform scale-75 group-hover:scale-100">
                      <div className="text-3xl mb-2">🔍</div>
                      <p className="text-sm font-medium">Büyüt</p>
                    </div>
                  </div>

                  {/* Fotoğraf Numarası */}
                  <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full font-bold">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>

            {/* Alt Bilgi */}
            <div className="mt-16 text-center bg-white rounded-3xl p-8 shadow-lg border border-orange-100">
              <div className="text-4xl mb-4">🎣</div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">
                Siz de Bu Anıları Yaşayın!
              </h3>
              <p className="text-slate-600 mb-6 max-w-lg mx-auto">
                Profesyonel ekibimizle birlikte İstanbul Boğazı'nda unutulmaz balık avı deneyimi yaşayın.
              </p>
              <Link 
                href="/randevu"
                className="inline-block bg-gradient-to-r from-orange-500 to-red-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:from-orange-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                🎣 Hemen Rezervasyon Yap
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          {/* Kapat Butonu */}
          <button
            onClick={closeLightbox}
            className="absolute top-6 right-6 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white text-2xl font-bold transition-all duration-300 z-10"
          >
            ×
          </button>

          {/* Önceki Fotoğraf */}
          <button
            onClick={prevPhoto}
            className="absolute left-6 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white text-xl font-bold transition-all duration-300 z-10"
          >
            ←
          </button>

          {/* Sonraki Fotoğraf */}
          <button
            onClick={nextPhoto}
            className="absolute right-6 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white text-xl font-bold transition-all duration-300 z-10"
          >
            →
          </button>

          {/* Fotoğraf */}
          <div className="relative w-full h-full max-w-4xl max-h-[80vh]">
            <Image
              src={selectedPhoto.url}
              alt={selectedPhoto.name}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>

          {/* Fotoğraf Bilgisi */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-6 py-3 rounded-full">
            <span className="font-medium">
              {boatPhotos.findIndex(p => p.id === selectedPhoto.id) + 1} / {boatPhotos.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
} 