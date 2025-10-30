'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Anchor, ChevronDown, Loader2 } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import Link from 'next/link';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  order: number;
}

export default function SSSPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'faq'));
      const faqList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FAQ[];
      
      faqList.sort((a, b) => a.order - b.order);
      setFaqs(faqList);
    } catch (error) {
      console.error('FAQ yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
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
            Sık Sorulan Sorular
          </h1>
          <p className="text-xl text-[#6B9BC3] font-medium">
            Merak ettiklerinizin cevapları burada
          </p>
        </motion.div>

        {/* FAQ List */}
        <div className="max-w-4xl mx-auto">
          {faqs.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-[#1B3A5C]/50 text-lg">Henüz soru eklenmemiş</p>
            </div>
          ) : (
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <motion.div
                  key={faq.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/90 backdrop-blur-xl border-2 border-[#6B9BC3]/30 rounded-2xl overflow-hidden hover:border-[#6B9BC3] transition-all shadow-md"
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-[#6B9BC3]/5 transition-all"
                  >
                    <span className="text-[#0D2847] font-semibold text-lg pr-4">
                      {faq.question}
                    </span>
                    <motion.div
                      animate={{ rotate: openIndex === index ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronDown className="w-6 h-6 text-[#6B9BC3] flex-shrink-0" />
                    </motion.div>
                  </button>
                  
                  <AnimatePresence>
                    {openIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-5 pt-2 border-t border-[#6B9BC3]/20">
                          <p className="text-[#1B3A5C]/80 leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-16"
        >
          <p className="text-[#1B3A5C]/70 mb-6">
            Sorunuzun cevabını bulamadınız mı?
          </p>
          <Link
            href="/rezervasyon"
            className="inline-block px-8 py-4 bg-gradient-to-r from-[#8B3A3A] to-[#722E2E] hover:from-[#A04848] hover:to-[#8B3A3A] text-white font-bold text-lg rounded-2xl shadow-lg shadow-[#8B3A3A]/30 transition-all"
          >
            Rezervasyon Yap
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
