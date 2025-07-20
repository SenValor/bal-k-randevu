'use client';

import { useState, useEffect } from 'react';
import type { Metadata } from "next";
import Link from "next/link";
import { db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

interface QuestionAnswer {
  id: string;
  question: string;
  answer: string;
  emoji: string;
  color: string;
  order: number;
}

// Static color mapping for Tailwind CSS
const colorClasses: { [key: string]: string } = {
  'blue-700': 'text-blue-700',
  'green-700': 'text-green-700',
  'orange-700': 'text-orange-700',
  'purple-700': 'text-purple-700',
  'red-700': 'text-red-700',
  'indigo-700': 'text-indigo-700',
  'teal-700': 'text-teal-700',
  'pink-700': 'text-pink-700',
  'amber-700': 'text-amber-700',
  'cyan-700': 'text-cyan-700'
};

// Not: Metadata export'unu dinamik bileşenlerde kullanamıyoruz, bu yüzden yoruma aldım
// export const metadata: Metadata = { ... };

export default function HakkimizdaPage() {
  const [questionsAnswers, setQuestionsAnswers] = useState<QuestionAnswer[]>([]);
  const [loading, setLoading] = useState(true);

  // Firebase'den soru-cevapları çek
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'hakkimizda'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.questionsAnswers && Array.isArray(data.questionsAnswers)) {
          // Sıralama order'a göre yap
          const sortedQA = data.questionsAnswers.sort((a: QuestionAnswer, b: QuestionAnswer) => a.order - b.order);
          setQuestionsAnswers(sortedQA);
        } else {
          // Varsayılan veriler
          setQuestionsAnswers(getDefaultQuestionsAnswers());
        }
      } else {
        // Varsayılan veriler
        setQuestionsAnswers(getDefaultQuestionsAnswers());
      }
      setLoading(false);
    }, (error) => {
      console.error('Firebase bağlantı hatası:', error);
      // Hata durumunda varsayılan verileri göster
      setQuestionsAnswers(getDefaultQuestionsAnswers());
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Varsayılan soru-cevaplar
  const getDefaultQuestionsAnswers = (): QuestionAnswer[] => [
    {
      id: '1',
      question: 'Nereden Kalkıyoruz?',
      answer: 'Turlarımız Eyüp Odabaşı Sporcular Parkı\'ndan başlıyor. Metro ile Eyüpsultan durağından veya otobüsle kolayca ulaşabilirsiniz. Park içinde otopark da mevcut.',
      emoji: '🚤',
      color: 'blue-700',
      order: 1
    },
    {
      id: '2',
      question: 'Nereye Gidiyoruz?',
      answer: 'İstanbul Boğazı\'nın en bereketli balık noktalarına gidiyoruz. Rumeli Kavağı, Anadolu Kavağı ve Fatih Sultan Mehmet Köprüsü çevresindeki balık zengini alanları geziyoruz.',
      emoji: '🗺️',
      color: 'green-700',
      order: 2
    },
    {
      id: '3',
      question: 'Hangi Balıklar Tutuluyor?',
      answer: 'Mevsime göre çipura, levrek, lüfer, palamut, istavrit, mezgit, barbunya ve daha birçok tür balık yakalama şansınız var. İlkbaharda çipura ve levrek, yazın lüfer ve palamut, sonbaharda barbunya bollaşır.',
      emoji: '🐟',
      color: 'orange-700',
      order: 3
    },
    {
      id: '4',
      question: 'Tur Ne Kadar Sürüyor?',
      answer: 'Normal turlarımız 6 saat sürüyor. Sabah turu 07:00-13:00, öğleden sonra turu 14:00-20:00 saatleri arasında. Özel turlar için istediğiniz saatleri belirleyebilirsiniz.',
      emoji: '⏰',
      color: 'purple-700',
      order: 4
    },
    {
      id: '5',
      question: 'Neler İkram Ediliyor?',
      answer: 'Teknede soğuk içecekler ikram ediyoruz. Çay, kahve ve meşrubat mevcut. Kendi yiyecek ve içeceklerinizi de getirebilirsiniz. Teknede buz dolabı bulunuyor.',
      emoji: '☕',
      color: 'red-700',
      order: 5
    },
    {
      id: '6',
      question: 'Oltam Yoksa Ne Olur?',
      answer: 'Hiç sorun değil! +150 TL ek ücretle olta ve tüm balık avı takımını biz sağlıyoruz. Kaliteli oltalar, ipler, yemler ve çeşitli iğneler dahil. Deneyimli misafirler kendi ekipmanlarını da getirebilir.',
      emoji: '🎣',
      color: 'indigo-700',
      order: 6
    },
    {
      id: '7',
      question: 'Finalde Ne Yapılıyor?',
      answer: 'Tur sonunda avladığınız balıkları temizleyip paketliyoruz. Balıklarınızı eve götürebilir, ailenizle paylaşabilirsiniz. Ayrıca hatıra fotoğrafları çekiyoruz.',
      emoji: '🏁',
      color: 'teal-700',
      order: 7
    },
    {
      id: '8',
      question: 'Güvenlik Nasıl?',
      answer: 'Lisanslı kaptan ve 15+ yıl deneyimli ekibimiz var. Teknede can yelekleri, cankurtaran simidi ve modern güvenlik ekipmanları bulunuyor. Sigortalı ve lisanslı tekne ile güvenliğiniz garantimiz altında.',
      emoji: '🛟',
      color: 'pink-700',
      order: 8
    },
    {
      id: '9',
      question: 'Ne Getirmeli?',
      answer: 'Güneş kremi, şapka, güneş gözlüğü getirin. Yedek kıyafet, havlu ve kendi yiyecek/içeceklerinizi de getirebilirsiniz. Tekne güvertesinde yürürken kaymaz ayakkabı tavsiye ediyoruz.',
      emoji: '🎒',
      color: 'amber-700',
      order: 9
    },
    {
      id: '10',
      question: 'Çocuklar Katılabilir Mi?',
      answer: 'Elbette! 0-99 yaş arası herkes katılabilir. Çocuklar için özel can yelekleri ve güvenlik önlemleri alıyoruz. Deneyimli rehberimiz balık avlamayı öğretir.',
      emoji: '👶',
      color: 'cyan-700',
      order: 10
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-600 text-xl">Sayfa yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-slate-800 mb-6">
            Hakkımızda
          </h1>
          <p className="text-2xl text-slate-600 leading-relaxed">
            Balık avı turlarımız hakkında merak ettiğiniz her şey
          </p>
        </div>

        {/* Soru-Cevap Bölümü */}
        <div className="space-y-16">
          {questionsAnswers.map((qa) => (
            <div key={qa.id} className="text-center">
              <h2 className={`text-4xl font-bold mb-8 ${colorClasses[qa.color] || 'text-blue-700'}`}>
                {qa.emoji} {qa.question}
              </h2>
              <p className="text-2xl text-slate-700 leading-relaxed max-w-3xl mx-auto">
                {qa.answer}
              </p>
            </div>
          ))}
        </div>

        {/* Alt Rezervasyon Bölümü */}
        <div className="mt-20 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-2xl p-12 text-white">
            <h2 className="text-4xl font-bold mb-6">Hazır mısınız?</h2>
            <p className="text-2xl text-blue-100 mb-8">
              Unutulmaz bir balık avı deneyimi için hemen rezervasyon yapın!
            </p>
            <Link
              href="/randevu"
              className="inline-block bg-white text-blue-600 px-12 py-4 rounded-xl font-bold text-2xl hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              🎣 Rezervasyon Yap
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 