'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Youtube, Play } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';

interface PressItem {
  id: string;
  title: string;
  youtubeUrl: string;
  order: number;
}

export default function PressSection() {
  const [pressItems, setPressItems] = useState<PressItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPressItems();
  }, []);

  const fetchPressItems = async () => {
    try {
      const docRef = doc(db, 'settings', 'general');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists() && docSnap.data().pressItems) {
        const items = docSnap.data().pressItems as PressItem[];
        setPressItems(items.sort((a, b) => a.order - b.order));
      }
    } catch (error) {
      console.error('Basında Biz yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const getYoutubeEmbedUrl = (url: string) => {
    try {
      const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)?.[1];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    } catch {
      return null;
    }
  };

  if (loading || pressItems.length === 0) {
    return null;
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 md:px-6 bg-gradient-to-b from-[#C5D9E8] via-[#B5C9D8] to-[#D5E9F0] py-20">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="max-w-7xl mx-auto w-full"
      >
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Youtube className="w-10 h-10 text-[#8B3A3A]" />
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#0D2847]">
              Basında Biz
            </h2>
          </div>
          <p className="text-[#1B3A5C]/80 text-lg md:text-xl max-w-2xl mx-auto">
            Medyada yer alan haberlerimiz ve röportajlarımız
          </p>
        </motion.div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {pressItems.map((item, index) => {
            const embedUrl = getYoutubeEmbedUrl(item.youtubeUrl);
            
            if (!embedUrl) return null;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 80 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{
                  delay: index * 0.15,
                  duration: 0.8,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="group"
              >
                <div className="bg-white/70 backdrop-blur-2xl rounded-2xl border-2 border-[#6B9BC3]/40 p-4 shadow-xl hover:shadow-2xl hover:border-[#6B9BC3]/60 transition-all">
                  {/* Video Container */}
                  <div className="relative aspect-video rounded-xl overflow-hidden mb-4 bg-[#0D2847]">
                    <iframe
                      src={embedUrl}
                      title={item.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0 w-full h-full"
                    />
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-lg font-semibold text-[#0D2847] line-clamp-2">
                    {item.title}
                  </h3>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}
