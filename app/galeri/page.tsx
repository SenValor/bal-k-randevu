'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, X } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import Image from 'next/image';

interface GalleryItem {
  id: string;
  image: string;
  text: string;
  order: number;
}

export default function GaleriPage() {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'gallery'));
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        image: doc.data().image,
        text: doc.data().text,
        order: doc.data().order
      })) as GalleryItem[];
      
      items.sort((a, b) => a.order - b.order);
      setGalleryItems(items);
    } catch (error) {
      console.error('Galeri yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#E8F4F8] via-[#D5E9F0] to-[#F5FAFB] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#6B9BC3] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E8F4F8] via-[#D5E9F0] to-[#F5FAFB] pt-24">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-[#0D2847] mb-4">
            Galeri
          </h1>
          <p className="text-xl text-[#6B9BC3] font-medium">
            Unutulmaz anlarımızdan kareler
          </p>
        </motion.div>

        {/* Gallery Grid */}
        {galleryItems.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#1B3A5C]/50 text-lg">Henüz görsel eklenmemiş</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:gap-6 max-w-5xl mx-auto">
            {galleryItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => {
                  setSelectedImage(item);
                  setCurrentIndex(index);
                }}
                className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer bg-white border-2 border-[#6B9BC3]/30 hover:border-[#6B9BC3] transition-all shadow-md hover:shadow-xl"
              >
                <Image
                  src={item.image}
                  alt={item.text}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <p className="text-white font-semibold text-lg">
                      {item.text}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          
          {/* Previous Button */}
          {currentIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const newIndex = currentIndex - 1;
                setCurrentIndex(newIndex);
                setSelectedImage(galleryItems[newIndex]);
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
            >
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Next Button */}
          {currentIndex < galleryItems.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const newIndex = currentIndex + 1;
                setCurrentIndex(newIndex);
                setSelectedImage(galleryItems[newIndex]);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
            >
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
          
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            className="relative max-w-5xl w-full aspect-video"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={selectedImage.image}
              alt={selectedImage.text}
              fill
              className="object-contain rounded-2xl"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-2xl">
              <p className="text-white text-xl font-semibold text-center">
                {selectedImage.text}
              </p>
              <p className="text-white/60 text-sm text-center mt-2">
                {currentIndex + 1} / {galleryItems.length}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Footer */}
      <div className="border-t border-[#6B9BC3]/20 bg-white/80 backdrop-blur-md py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-white/60">
          <p className="text-[#1B3A5C]/70">© 2024 Balık Sefası. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </div>
  );
}
