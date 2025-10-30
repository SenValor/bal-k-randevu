'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, Edit2, Save, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  order: number;
  createdAt: string;
}

export default function AdminFAQPage() {
  const router = useRouter();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    order: 0,
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingFAQ) {
        await updateDoc(doc(db, 'faq', editingFAQ.id), {
          question: formData.question,
          answer: formData.answer,
          order: formData.order,
        });
      } else {
        await addDoc(collection(db, 'faq'), {
          question: formData.question,
          answer: formData.answer,
          order: formData.order,
          createdAt: new Date().toISOString(),
        });
      }
      
      setIsModalOpen(false);
      setEditingFAQ(null);
      setFormData({ question: '', answer: '', order: 0 });
      fetchFAQs();
    } catch (error) {
      console.error('Kaydetme hatası:', error);
      alert('Bir hata oluştu!');
    }
  };

  const handleEdit = (faq: FAQ) => {
    setEditingFAQ(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      order: faq.order,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu soruyu silmek istediğinize emin misiniz?')) return;
    
    try {
      await deleteDoc(doc(db, 'faq', id));
      fetchFAQs();
    } catch (error) {
      console.error('Silme hatası:', error);
      alert('Silme işlemi başarısız!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#001F3F] via-[#001529] to-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#00A9A5] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#001F3F] via-[#001529] to-black pb-24 pt-20">
      {/* Header */}
      <div className="border-b border-white/10 bg-white/5 backdrop-blur-md sticky top-20 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin-sefa3986')}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-white" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">SSS Yönetimi</h1>
                <p className="text-white/60 text-sm">Sık Sorulan Soruları yönetin</p>
              </div>
            </div>
            <button
              onClick={() => {
                setEditingFAQ(null);
                setFormData({ question: '', answer: '', order: faqs.length });
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#00A9A5] to-[#008B87] hover:from-[#008B87] hover:to-[#00A9A5] text-white font-semibold rounded-xl transition-all"
            >
              <Plus className="w-5 h-5" />
              Yeni Soru Ekle
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {faqs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-white/40 text-lg mb-4">Henüz soru eklenmemiş</p>
            <button
              onClick={() => {
                setFormData({ question: '', answer: '', order: 0 });
                setIsModalOpen(true);
              }}
              className="px-6 py-3 bg-[#00A9A5]/20 hover:bg-[#00A9A5]/30 text-[#00A9A5] rounded-xl transition-colors"
            >
              İlk Soruyu Ekle
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-[#00A9A5]/20 text-[#00A9A5] rounded text-xs font-medium">
                        Sıra: {faq.order + 1}
                      </span>
                    </div>
                    <h3 className="text-white font-semibold text-lg mb-2">{faq.question}</h3>
                    <p className="text-white/60 text-sm">{faq.answer}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(faq)}
                      className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(faq.id)}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
            />

            {/* Modal Content */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-gradient-to-br from-[#001F3F] to-[#001529] border border-white/10 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    {editingFAQ ? 'Soruyu Düzenle' : 'Yeni Soru Ekle'}
                  </h2>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Soru */}
                  <div>
                    <label className="block text-white font-semibold mb-2">Soru</label>
                    <input
                      type="text"
                      value={formData.question}
                      onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:border-[#00A9A5] focus:outline-none"
                      placeholder="Soru..."
                    />
                  </div>

                  {/* Cevap */}
                  <div>
                    <label className="block text-white font-semibold mb-2">Cevap</label>
                    <textarea
                      value={formData.answer}
                      onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                      required
                      rows={6}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:border-[#00A9A5] focus:outline-none resize-none"
                      placeholder="Cevap..."
                    />
                  </div>

                  {/* Sıra */}
                  <div>
                    <label className="block text-white font-semibold mb-2">Sıra</label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                      required
                      min="0"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:border-[#00A9A5] focus:outline-none"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl transition-all"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-[#00A9A5] to-[#008B87] hover:from-[#008B87] hover:to-[#00A9A5] text-white font-semibold rounded-xl transition-all"
                    >
                      {editingFAQ ? 'Güncelle' : 'Ekle'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
