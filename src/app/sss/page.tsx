'use client';

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface SSSItem {
  id: string;
  question: string;
  answer: string;
  details: string[];
  tip: string;
  icon: string;
  color: string;
  order: number;
  active: boolean;
}

export default function SSSPage() {
  const [sssData, setSssData] = useState<SSSItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Firebase'den SSS verilerini real-time dinle
  useEffect(() => {
    setLoading(true);
    
    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'sss'),
      (docSnapshot) => {
        try {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            if (data.data && Array.isArray(data.data)) {
              // Aktif soruları sıraya göre sırala
              const activeQuestions = data.data
                .filter((q: SSSItem) => q.active)
                .sort((a: SSSItem, b: SSSItem) => a.order - b.order);
              setSssData(activeQuestions);
              setLastUpdated(new Date());
            } else {
              setSssData([]);
            }
          } else {
            setSssData([]);
          }
        } catch (error) {
          console.error('SSS verileri işlenirken hata:', error);
          setSssData([]);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error('SSS verileri dinlenirken hata:', error);
        setSssData([]);
        setLoading(false);
      }
    );

    // Cleanup function
    return () => {
      unsubscribe();
    };
  }, []);

  // Renk sınıflarını döndürme fonksiyonu
  const getColorClasses = (color: string) => {
    const colorMap: { [key: string]: { border: string; hover: string; text: string; bg: string } } = {
      blue: { border: 'border-blue-200', hover: 'hover:bg-blue-50', text: 'text-blue-600', bg: 'bg-blue-50' },
      green: { border: 'border-green-200', hover: 'hover:bg-green-50', text: 'text-green-600', bg: 'bg-green-50' },
      orange: { border: 'border-orange-200', hover: 'hover:bg-orange-50', text: 'text-orange-600', bg: 'bg-orange-50' },
      purple: { border: 'border-purple-200', hover: 'hover:bg-purple-50', text: 'text-purple-600', bg: 'bg-purple-50' },
      cyan: { border: 'border-cyan-200', hover: 'hover:bg-cyan-50', text: 'text-cyan-600', bg: 'bg-cyan-50' },
      red: { border: 'border-red-200', hover: 'hover:bg-red-50', text: 'text-red-600', bg: 'bg-red-50' },
      pink: { border: 'border-pink-200', hover: 'hover:bg-pink-50', text: 'text-pink-600', bg: 'bg-pink-50' },
      teal: { border: 'border-teal-200', hover: 'hover:bg-teal-50', text: 'text-teal-600', bg: 'bg-teal-50' },
    };
    return colorMap[color] || colorMap.blue;
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Sıkça Sorulan Sorular - Balık Sefası</title>
          <meta name="description" content="Balık avı turu, tekne kiralama, ödeme, ekipman ve güvenlik ile ilgili en çok merak edilen soruların cevaplarını bulun." />
          <meta name="keywords" content="sıkça sorulan sorular, SSS, balık avı, tekne kiralama, ödeme, güvenlik, ekipman" />
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
          <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600">SSS verileri yükleniyor...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Sıkça Sorulan Sorular - Balık Sefası</title>
        <meta name="description" content="Balık avı turu, tekne kiralama, ödeme, ekipman ve güvenlik ile ilgili en çok merak edilen soruların cevaplarını bulun." />
        <meta name="keywords" content="sıkça sorulan sorular, SSS, balık avı, tekne kiralama, ödeme, güvenlik, ekipman" />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-800 mb-4">
              ❓ Sıkça Sorulan Sorular
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Balık avı turumuz hakkında en çok merak edilen soruların cevaplarını burada bulabilirsiniz
            </p>
            {lastUpdated && (
              <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-slate-500">
                <span>🔄 Son güncelleme: {lastUpdated.toLocaleTimeString('tr-TR')}</span>
              </div>
            )}
          </div>

          {sssData.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">❓</div>
              <p className="text-slate-600 text-lg">Henüz SSS verisi bulunmuyor.</p>
              <p className="text-slate-500 text-sm mt-2">Lütfen daha sonra tekrar deneyin.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sssData.map((item) => {
                const colors = getColorClasses(item.color);
                return (
                  <details 
                    key={item.id} 
                    className={`bg-white rounded-2xl shadow-xl border ${colors.border} group hover:shadow-2xl transition-all duration-300`}
                  >
                    <summary className={`p-6 cursor-pointer ${colors.hover} rounded-2xl transition-all duration-300 flex items-center justify-between`}>
                      <span className="font-bold text-slate-800 text-lg flex items-center">
                        <span className="mr-4 text-2xl">{item.icon}</span>
                        {item.question}
                      </span>
                      <span className={`${colors.text} text-2xl group-open:rotate-45 transition-transform duration-300`}>+</span>
                    </summary>
                    <div className="px-6 pb-6">
                      <div className={`pt-4 border-t ${colors.border.replace('border-', 'border-t-')}`}>
                        <p className="text-slate-600 text-lg leading-relaxed mb-4">
                          <strong className={colors.text}>{item.answer}</strong>
                        </p>
                        
                        {item.details && item.details.length > 0 && (
                          <div className={`${colors.bg} p-4 rounded-xl border ${colors.border} mb-4`}>
                            <h4 className="font-bold text-slate-800 mb-2">Detaylar:</h4>
                            <ul className="text-slate-600 space-y-1">
                              {item.details.map((detail, index) => (
                                <li key={index}>• {detail}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {item.tip && (
                          <p className={`${colors.text} font-medium text-sm mt-3 ${colors.bg} p-3 rounded-lg`}>
                            💡 <strong>İpucu:</strong> {item.tip}
                          </p>
                        )}
                      </div>
                    </div>
                  </details>
                );
              })}
            </div>
          )}

          {/* Admin Notu */}
          <div className="mt-12 text-center">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-2">
                💬 Sorunuz Burada Yok mu?
              </h3>
              <p className="text-slate-600 mb-4">
                Cevabını bulamadığınız sorularınız için bizimle iletişime geçin!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="https://wa.me/905310892537?text=Merhaba,%20SSS%20sayfasında%20bulamadığım%20bir%20sorum%20var."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors duration-300 flex items-center justify-center space-x-2"
                >
                  <span>💬</span>
                  <span>WhatsApp</span>
                </a>
                <a
                  href="tel:05310892537"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-300 flex items-center justify-center space-x-2"
                >
                  <span>📞</span>
                  <span>Hemen Ara</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 