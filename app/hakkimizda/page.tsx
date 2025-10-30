'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Anchor, Target, Eye, Heart, Loader2 } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import Link from 'next/link';

interface AboutContent {
  title: string;
  subtitle: string;
  description: string;
  mission: string;
  vision: string;
  values: string[];
}

export default function HakkimizdaPage() {
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<AboutContent>({
    title: 'Hakkımızda',
    subtitle: 'İstanbul Boğazı\'nda Balık Avı Deneyimi',
    description: 'Balık Sefası olarak, İstanbul Boğazı\'nın eşsiz güzelliğinde unutulmaz balık avı deneyimleri sunuyoruz. Profesyonel ekibimiz ve modern teknelerimizle, hem amatör hem de profesyonel balıkçılara hizmet veriyoruz.',
    mission: 'Misyonumuz, deniz tutkunlarına güvenli, keyifli ve unutulmaz balık avı deneyimleri sunmak. Doğaya saygılı, sürdürülebilir balıkçılık anlayışıyla hizmet vermektir.',
    vision: 'Vizyonumuz, İstanbul Boğazı\'nda balık avı turizminin öncü markası olmak ve bu alanda en yüksek standartları belirlemektir.',
    values: ['Güvenlik', 'Kalite', 'Müşteri Memnuniyeti', 'Doğaya Saygı'],
  });

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const docRef = doc(db, 'settings', 'about');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setContent(docSnap.data() as AboutContent);
      }
    } catch (error) {
      console.error('İçerik yükleme hatası:', error);
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
            {content.title}
          </h1>
          <p className="text-xl text-[#6B9BC3] font-medium">
            {content.subtitle}
          </p>
        </motion.div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-4xl mx-auto mb-16"
        >
          <div className="bg-white/90 backdrop-blur-xl border-2 border-[#6B9BC3]/30 rounded-3xl p-8 md:p-12 shadow-xl">
            <p className="text-[#1B3A5C]/80 text-lg leading-relaxed">
              {content.description}
            </p>
          </div>
        </motion.div>

        {/* Mission, Vision, Values */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16">
          {/* Mission */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-[#6B9BC3]/20 to-[#5B8DB8]/10 border-2 border-[#6B9BC3]/40 rounded-3xl p-8 shadow-lg"
          >
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-8 h-8 text-[#6B9BC3]" />
              <h2 className="text-2xl font-bold text-[#0D2847]">Misyonumuz</h2>
            </div>
            <p className="text-[#1B3A5C]/80 leading-relaxed">
              {content.mission}
            </p>
          </motion.div>

          {/* Vision */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-[#8B3A3A]/20 to-[#722E2E]/10 border-2 border-[#8B3A3A]/40 rounded-3xl p-8 shadow-lg"
          >
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-8 h-8 text-[#8B3A3A]" />
              <h2 className="text-2xl font-bold text-[#0D2847]">Vizyonumuz</h2>
            </div>
            <p className="text-[#1B3A5C]/80 leading-relaxed">
              {content.vision}
            </p>
          </motion.div>

          {/* Values */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-[#6B9BC3]/20 to-[#5B8DB8]/10 border-2 border-[#6B9BC3]/40 rounded-3xl p-8 shadow-lg"
          >
            <div className="flex items-center gap-3 mb-4">
              <Heart className="w-8 h-8 text-[#6B9BC3]" />
              <h2 className="text-2xl font-bold text-[#0D2847]">Değerlerimiz</h2>
            </div>
            <ul className="space-y-2">
              {content.values.map((value, index) => (
                <li key={index} className="text-[#1B3A5C]/80 flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#6B9BC3] rounded-full" />
                  {value}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <Link
            href="/rezervasyon"
            className="inline-block px-8 py-4 bg-gradient-to-r from-[#8B3A3A] to-[#722E2E] hover:from-[#A04848] hover:to-[#8B3A3A] text-white font-bold text-lg rounded-2xl shadow-lg shadow-[#8B3A3A]/30 transition-all"
          >
            Hemen Rezervasyon Yap
          </Link>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="border-t border-[#6B9BC3]/20 bg-white/80 backdrop-blur-md py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-white/60">
          <p className="text-[#1B3A5C]/70">© 2024 Balık Sefası. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </div>
  );
}
