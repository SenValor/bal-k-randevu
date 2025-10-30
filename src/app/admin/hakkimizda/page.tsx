'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface QuestionAnswer {
  id: string;
  question: string;
  answer: string;
  emoji: string;
  color: string;
  order: number;
}

const availableColors = [
  'blue-700', 'green-700', 'orange-700', 'purple-700', 'red-700',
  'indigo-700', 'teal-700', 'pink-700', 'amber-700', 'cyan-700'
];

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

export default function AdminHakkimizdaPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [questionsAnswers, setQuestionsAnswers] = useState<QuestionAnswer[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);

  // Auth kontrolü
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Firebase'den verileri çek
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubscribe = onSnapshot(doc(db, 'settings', 'hakkimizda'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.questionsAnswers && Array.isArray(data.questionsAnswers)) {
          const sortedQA = data.questionsAnswers.sort((a: QuestionAnswer, b: QuestionAnswer) => a.order - b.order);
          setQuestionsAnswers(sortedQA);
        } else {
          setQuestionsAnswers(getDefaultQuestionsAnswers());
        }
      } else {
        setQuestionsAnswers(getDefaultQuestionsAnswers());
      }
    }, (error) => {
      console.error('Firebase bağlantı hatası:', error);
      // Hata durumunda varsayılan verileri göster
      setQuestionsAnswers(getDefaultQuestionsAnswers());
    });

    return () => unsubscribe();
  }, [isAuthenticated]);

  // Varsayılan soru-cevaplar
  const getDefaultQuestionsAnswers = (): QuestionAnswer[] => [
    {
      id: '1',
      question: 'Nereden Kalkıyoruz?',
      answer: 'Turlarımız Eyüp Odabaşı Sporcular Parkı\'ndan başlıyor. Metro ile Eyüpsultan durağından veya otobüsle kolayca ulaşabilirsiniz.',
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

  // Kaydet
  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'hakkimizda'), {
        questionsAnswers: questionsAnswers,
        updatedAt: new Date()
      });
      alert('Hakkımızda içeriği başarıyla güncellendi!');
    } catch (error) {
      console.error('Kaydetme hatası:', error);
      alert('Kaydetme hatası! Lütfen tekrar deneyin.');
    } finally {
      setSaving(false);
    }
  };

  // Soru-cevap güncelle
  const updateQuestionAnswer = (id: string, field: keyof QuestionAnswer, value: string | number) => {
    setQuestionsAnswers(prev => prev.map(qa => 
      qa.id === id ? { ...qa, [field]: value } : qa
    ));
  };

  // Yeni soru ekle
  const addNewQuestion = () => {
    const newId = String(Date.now());
    const maxOrder = Math.max(...questionsAnswers.map(qa => qa.order), 0);
    const newQA: QuestionAnswer = {
      id: newId,
      question: 'Yeni Soru?',
      answer: 'Buraya cevabınızı yazın...',
      emoji: '❓',
      color: availableColors[questionsAnswers.length % availableColors.length],
      order: maxOrder + 1
    };
    setQuestionsAnswers(prev => [...prev, newQA]);
    setIsEditing(newId);
  };

  // Soru sil
  const deleteQuestion = (id: string) => {
    if (confirm('Bu soruyu silmek istediğinizden emin misiniz?')) {
      setQuestionsAnswers(prev => prev.filter(qa => qa.id !== id));
    }
  };

  // Sıralama değiştir
  const moveQuestion = (id: string, direction: 'up' | 'down') => {
    const index = questionsAnswers.findIndex(qa => qa.id === id);
    if (
      (direction === 'up' && index > 0) ||
      (direction === 'down' && index < questionsAnswers.length - 1)
    ) {
      const newQuestions = [...questionsAnswers];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];
      
      // Order değerlerini güncelle
      newQuestions.forEach((qa, idx) => {
        qa.order = idx + 1;
      });
      
      setQuestionsAnswers(newQuestions);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🔐 Giriş Gerekli</h2>
          <p className="text-gray-600 mb-6">Bu sayfaya erişmek için giriş yapmanız gerekiyor.</p>
          <Link href="/admin" className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg">
            Admin Paneline Git
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-blue-600 hover:text-blue-800">
                ← Admin Panel
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">📝 Hakkımızda Düzenle</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                href="/hakkimizda"
                target="_blank"
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm"
              >
                👁️ Önizleme
              </Link>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium"
              >
                {saving ? 'Kaydediliyor...' : '💾 Kaydet'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Bilgi Kartı */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-start space-x-3">
            <div className="text-blue-500 text-xl">ℹ️</div>
            <div>
              <h3 className="text-blue-800 font-semibold mb-2">Hakkımızda Sayfası Yönetimi</h3>
              <p className="text-blue-700 text-sm mb-2">
                Burada Hakkımızda sayfasındaki soru-cevapları düzenleyebilirsiniz. 
                Değişiklikler anında web sitesinde görünecektir.
              </p>
              <div className="flex items-center space-x-2 text-blue-600 text-xs">
                <span>✅ Sistem aktif</span>
                <span>•</span>
                <span>📱 Real-time güncellemeler</span>
                <span>•</span>
                <span>🎨 10 farklı renk seçeneği</span>
              </div>
            </div>
          </div>
        </div>

        {/* Yeni Soru Ekle */}
        <div className="mb-8">
          <button
            onClick={addNewQuestion}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2"
          >
            <span>➕</span>
            <span>Yeni Soru Ekle</span>
          </button>
        </div>

        {/* Soru-Cevap Listesi */}
        <div className="space-y-6">
          {questionsAnswers.map((qa, index) => (
            <div key={qa.id} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              {/* Soru Başlığı ve Kontroller */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <span className="text-2xl font-bold text-gray-500">#{qa.order}</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => moveQuestion(qa.id, 'up')}
                      disabled={index === 0}
                      className="bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-700 p-2 rounded"
                      title="Yukarı taşı"
                    >
                      ⬆️
                    </button>
                    <button
                      onClick={() => moveQuestion(qa.id, 'down')}
                      disabled={index === questionsAnswers.length - 1}
                      className="bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-700 p-2 rounded"
                      title="Aşağı taşı"
                    >
                      ⬇️
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsEditing(isEditing === qa.id ? null : qa.id)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm"
                  >
                    {isEditing === qa.id ? '👁️ Görüntüle' : '✏️ Düzenle'}
                  </button>
                  <button
                    onClick={() => deleteQuestion(qa.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm"
                  >
                    🗑️ Sil
                  </button>
                </div>
              </div>

              {isEditing === qa.id ? (
                /* Düzenleme Modu */
                <div className="space-y-4">
                  {/* Emoji */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Emoji</label>
                    <input
                      type="text"
                      value={qa.emoji}
                      onChange={(e) => updateQuestionAnswer(qa.id, 'emoji', e.target.value)}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-2xl text-center"
                      placeholder="🎯"
                    />
                  </div>

                  {/* Renk */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Renk</label>
                    <select
                      value={qa.color}
                      onChange={(e) => updateQuestionAnswer(qa.id, 'color', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      {availableColors.map(color => (
                        <option key={color} value={color}>
                          {color.replace('-700', '').charAt(0).toUpperCase() + color.replace('-700', '').slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Soru */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Soru</label>
                    <input
                      type="text"
                      value={qa.question}
                      onChange={(e) => updateQuestionAnswer(qa.id, 'question', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-lg font-medium"
                      placeholder="Sorunuzu buraya yazın..."
                    />
                  </div>

                  {/* Cevap */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cevap</label>
                    <textarea
                      value={qa.answer}
                      onChange={(e) => updateQuestionAnswer(qa.id, 'answer', e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Cevabınızı buraya yazın..."
                    />
                  </div>
                </div>
              ) : (
                /* Görüntüleme Modu */
                <div className="text-center">
                  <h3 className={`text-3xl font-bold mb-4 ${colorClasses[qa.color] || 'text-blue-700'}`}>
                    {qa.emoji} {qa.question}
                  </h3>
                  <p className="text-xl text-gray-700 leading-relaxed">
                    {qa.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Kaydet Butonu - Alt */}
        <div className="mt-8 text-center">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-medium text-lg"
          >
            {saving ? 'Kaydediliyor...' : '💾 Değişiklikleri Kaydet'}
          </button>
        </div>
      </main>
    </div>
  );
} 