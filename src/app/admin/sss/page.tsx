'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

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
  const [editingSSS, setEditingSSS] = useState<string | null>(null);
  const [showSSSForm, setShowSSSForm] = useState(false);
  const [sssForm, setSssForm] = useState<Partial<SSSItem>>({
    question: '',
    answer: '',
    details: [],
    tip: '',
    icon: '❓',
    color: 'blue',
    order: 1,
    active: true
  });

  const colors = [
    { value: 'blue', label: 'Mavi', bg: 'bg-blue-100', text: 'text-blue-800' },
    { value: 'green', label: 'Yeşil', bg: 'bg-green-100', text: 'text-green-800' },
    { value: 'orange', label: 'Turuncu', bg: 'bg-orange-100', text: 'text-orange-800' },
    { value: 'purple', label: 'Mor', bg: 'bg-purple-100', text: 'text-purple-800' },
    { value: 'cyan', label: 'Camgöbeği', bg: 'bg-cyan-100', text: 'text-cyan-800' },
    { value: 'red', label: 'Kırmızı', bg: 'bg-red-100', text: 'text-red-800' },
    { value: 'pink', label: 'Pembe', bg: 'bg-pink-100', text: 'text-pink-800' },
    { value: 'teal', label: 'Teal', bg: 'bg-teal-100', text: 'text-teal-800' }
  ];

  const icons = ['❓', '🎣', '⚓', '🌊', '🛥️', '🐟', '🦈', '🌅', '💡', '📍', '⚠️', '✅', '🔥', '❄️', '☀️', '🌧️'];

  // SSS verilerini dinle
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'settings'),
      (snapshot) => {
        const sssDoc = snapshot.docs.find(doc => doc.id === 'sss');
        if (sssDoc) {
          const data = sssDoc.data();
          setSssData(data.data || []);
        } else {
          // Eğer SSS verisi yoksa varsayılan veriler ekle
          const defaultSSS: SSSItem[] = [
            {
              id: '1',
              question: 'Tekne turu ne kadar sürer?',
              answer: 'Tekne turumuz yaklaşık 6 saat sürmektedir.',
              details: ['Sabah 07:00-13:00 arası', 'Öğleden sonra 14:00-20:00 arası', 'Özel turlar daha esnek saatlerde düzenlenebilir'],
              tip: 'Güneş batımı turları için öğleden sonra seansını tercih edebilirsiniz',
              icon: '⏰',
              color: 'blue',
              order: 1,
              active: true
            },
            {
              id: '2',
              question: 'Hangi balık türleri avlanabilir?',
              answer: 'Sezona göre çipura, levrek, kalkan, istavrit gibi birçok balık türü avlayabilirsiniz.',
              details: ['Çipura ve levrek yıl boyunca', 'Kalkan sonbahar aylarında bol', 'İstavrit yaz aylarında çok', 'Lüfer sonbahar göçü döneminde'],
              tip: 'En bol av için mevsimsel takvimi takip edin',
              icon: '🐟',
              color: 'green',
              order: 2,
              active: true
            },
            {
              id: '3',
              question: 'Malzeme getirmem gerekir mi?',
              answer: 'İsteğe bağlı! Kendi malzemenizi getirebilir veya bizden kiralayabilirsiniz.',
              details: ['Olta, makara, misina bizde mevcut', 'Yem ve iğne dahil', 'Kendi malzemenizle indirim', 'Profesyonel ekipmanlar mevcut'],
              tip: 'İlk kez geliyorsanız bizim malzemelerimizi kullanmanızı öneririz',
              icon: '🎣',
              color: 'orange',
              order: 3,
              active: true
            },
            {
              id: '4',
              question: 'Hava koşulları tur iptaline neden olur mu?',
              answer: 'Güvenlik önceliğimizdir. Olumsuz hava koşullarında tur iptal edilebilir.',
              details: ['Fırtına durumunda iptal', 'Yoğun rüzgar durumunda erteleme', '24 saat önceden bilgilendirme', 'Tam ücret iadesi veya tarih değişikliği'],
              tip: 'Hava durumunu bir gün önceden kontrol edin',
              icon: '🌊',
              color: 'cyan',
              order: 4,
              active: true
            },
            {
              id: '5',
              question: 'Yeme içme dahil mi?',
              answer: 'Temel ikramlar dahildir. Daha geniş menü için ek ücret alınır.',
              details: ['Su, çay, kahve dahil', 'Basit atıştırmalıklar var', 'Öğle yemeği ek ücretli', 'Özel diyet ihtiyaçları önceden bildirin'],
              tip: 'Açık denizde mide bulantısı yaşamamak için hafif bir kahvaltı yapın',
              icon: '🍽️',
              color: 'purple',
              order: 5,
              active: true
            }
          ];
          setSssData(defaultSSS);
          // Varsayılan verileri kaydet
          setDoc(doc(db, 'settings', 'sss'), {
            data: defaultSSS,
            updatedAt: new Date(),
            createdAt: new Date()
          });
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const saveSSS = async (dataToSave?: SSSItem[]) => {
    try {
      const finalData = dataToSave || sssData;
      await setDoc(doc(db, 'settings', 'sss'), {
        data: finalData,
        updatedAt: new Date()
      });
      console.log('SSS kaydedildi');
    } catch (error: any) {
      console.error('SSS kaydetme hatası:', error);
    }
  };

  const addSSS = async () => {
    const newSSS: SSSItem = {
      id: Date.now().toString(),
      question: sssForm.question || '',
      answer: sssForm.answer || '',
      details: sssForm.details || [],
      tip: sssForm.tip || '',
      icon: sssForm.icon || '❓',
      color: sssForm.color || 'blue',
      order: sssData.length + 1,
      active: true
    };

    const updatedData = [...sssData, newSSS];
    setSssData(updatedData);
    setSssForm({
      question: '',
      answer: '',
      details: [],
      tip: '',
      icon: '❓',
      color: 'blue',
      order: 1,
      active: true
    });
    setShowSSSForm(false);
    
    // Anında kaydet
    await saveSSS(updatedData);
  };

  const editSSS = (sss: SSSItem) => {
    setSssForm(sss);
    setEditingSSS(sss.id);
    setShowSSSForm(true);
  };

  const updateSSS = async () => {
    if (!editingSSS) return;

    const updatedSSS = sssData.map(item => 
      item.id === editingSSS 
        ? { ...item, ...sssForm } as SSSItem
        : item
    );

    setSssData(updatedSSS);
    setEditingSSS(null);
    setShowSSSForm(false);
    setSssForm({
      question: '',
      answer: '',
      details: [],
      tip: '',
      icon: '❓',
      color: 'blue',
      order: 1,
      active: true
    });
    
    // Anında kaydet
    await saveSSS(updatedSSS);
  };

  const deleteSSS = async (id: string) => {
    if (!confirm('Bu SSS öğesini silmek istediğinizden emin misiniz?')) return;
    
    const updatedSSS = sssData.filter(item => item.id !== id);
    setSssData(updatedSSS);
    
    // Anında kaydet
    await saveSSS(updatedSSS);
  };

  // Varsayılan SSS'leri yükle
  const loadDefaultSSS = async () => {
    if (!confirm('Mevcut tüm SSS\'ler silinip varsayılan SSS\'ler yüklenecek. Devam etmek istiyor musunuz?')) return;
    
    const defaultSSS: SSSItem[] = [
      {
        id: '1',
        question: 'Tekne turu ne kadar sürer?',
        answer: 'Tekne turumuz yaklaşık 6 saat sürmektedir.',
        details: ['Sabah 07:00-13:00 arası', 'Öğleden sonra 14:00-20:00 arası', 'Özel turlar daha esnek saatlerde düzenlenebilir'],
        tip: 'Güneş batımı turları için öğleden sonra seansını tercih edebilirsiniz',
        icon: '⏰',
        color: 'blue',
        order: 1,
        active: true
      },
      {
        id: '2',
        question: 'Hangi balık türleri avlanabilir?',
        answer: 'Sezona göre çipura, levrek, kalkan, istavrit gibi birçok balık türü avlayabilirsiniz.',
        details: ['Çipura ve levrek yıl boyunca', 'Kalkan sonbahar aylarında bol', 'İstavrit yaz aylarında çok', 'Lüfer sonbahar göçü döneminde'],
        tip: 'En bol av için mevsimsel takvimi takip edin',
        icon: '🐟',
        color: 'green',
        order: 2,
        active: true
      },
      {
        id: '3',
        question: 'Malzeme getirmem gerekir mi?',
        answer: 'İsteğe bağlı! Kendi malzemenizi getirebilir veya bizden kiralayabilirsiniz.',
        details: ['Olta, makara, misina bizde mevcut', 'Yem ve iğne dahil', 'Kendi malzemenizle indirim', 'Profesyonel ekipmanlar mevcut'],
        tip: 'İlk kez geliyorsanız bizim malzemelerimizi kullanmanızı öneririz',
        icon: '🎣',
        color: 'orange',
        order: 3,
        active: true
      },
      {
        id: '4',
        question: 'Hava koşulları tur iptaline neden olur mu?',
        answer: 'Güvenlik önceliğimizdir. Olumsuz hava koşullarında tur iptal edilebilir.',
        details: ['Fırtına durumunda iptal', 'Yoğun rüzgar durumunda erteleme', '24 saat önceden bilgilendirme', 'Tam ücret iadesi veya tarih değişikliği'],
        tip: 'Hava durumunu bir gün önceden kontrol edin',
        icon: '🌊',
        color: 'cyan',
        order: 4,
        active: true
      },
      {
        id: '5',
        question: 'Yeme içme dahil mi?',
        answer: 'Temel ikramlar dahildir. Daha geniş menü için ek ücret alınır.',
        details: ['Su, çay, kahve dahil', 'Basit atıştırmalıklar var', 'Öğle yemeği ek ücretli', 'Özel diyet ihtiyaçları önceden bildirin'],
        tip: 'Açık denizde mide bulantısı yaşamamak için hafif bir kahvaltı yapın',
        icon: '🍽️',
        color: 'purple',
        order: 5,
        active: true
      }
    ];

    try {
      await setDoc(doc(db, 'settings', 'sss'), {
        data: defaultSSS,
        updatedAt: new Date(),
        createdAt: new Date()
      });
      setSssData(defaultSSS);
      alert('Varsayılan SSS\'ler başarıyla yüklendi!');
    } catch (error: any) {
      console.error('Varsayılan SSS yükleme hatası:', error);
      alert('Varsayılan SSS\'ler yüklenirken hata oluştu');
    }
  };

  const toggleSSSActive = async (id: string) => {
    const updatedSSS = sssData.map(item => 
      item.id === id 
        ? { ...item, active: !item.active }
        : item
    );
    setSssData(updatedSSS);
    
    // Anında kaydet
    await saveSSS(updatedSSS);
  };

  const moveSSSUp = async (id: string) => {
    const index = sssData.findIndex(item => item.id === id);
    if (index > 0) {
      const newData = [...sssData];
      [newData[index], newData[index - 1]] = [newData[index - 1], newData[index]];
      setSssData(newData);
      
      // Anında kaydet
      await saveSSS(newData);
    }
  };

  const moveSSSDown = async (id: string) => {
    const index = sssData.findIndex(item => item.id === id);
    if (index < sssData.length - 1) {
      const newData = [...sssData];
      [newData[index], newData[index + 1]] = [newData[index + 1], newData[index]];
      setSssData(newData);
      
      // Anında kaydet
      await saveSSS(newData);
    }
  };

  const addDetail = () => {
    setSssForm({
      ...sssForm,
      details: [...(sssForm.details || []), '']
    });
  };

  const updateDetail = (index: number, value: string) => {
    const newDetails = [...(sssForm.details || [])];
    newDetails[index] = value;
    setSssForm({
      ...sssForm,
      details: newDetails
    });
  };

  const removeDetail = (index: number) => {
    const newDetails = (sssForm.details || []).filter((_, i) => i !== index);
    setSssForm({
      ...sssForm,
      details: newDetails
    });
  };

  const getColorClasses = (color: string) => {
    const colorObj = colors.find(c => c.value === color);
    return colorObj ? { bg: colorObj.bg, text: colorObj.text } : { bg: 'bg-blue-100', text: 'text-blue-800' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">SSS yükleniyor...</p>
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
                ← Dashboard
              </Link>
              <h1 className="text-xl font-bold text-gray-900">❓ SSS Yönetimi</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={loadDefaultSSS}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                🔄 Varsayılan SSS'leri Yükle
              </button>
              
              <button
                onClick={() => setShowSSSForm(true)}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                ➕ SSS Ekle
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* SSS Kartları */}
        <div className="space-y-6">
          {sssData.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">❓</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz SSS yok</h3>
              <p className="text-gray-600">İlk SSS öğenizi ekleyin</p>
            </div>
          ) : (
            sssData.map((sss) => {
              const colorClasses = getColorClasses(sss.color);
              return (
                <div key={sss.id} className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className={`p-3 rounded-lg ${colorClasses.bg} ${colorClasses.text}`}>
                        <span className="text-2xl">{sss.icon}</span>
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{sss.question}</h3>
                        <p className="text-gray-700 mb-3">{sss.answer}</p>
                        
                        {sss.details && sss.details.length > 0 && (
                          <ul className="space-y-1 text-sm text-gray-600 mb-3">
                            {sss.details.map((detail, index) => (
                              <li key={index} className="flex items-center">
                                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                {detail}
                              </li>
                            ))}
                          </ul>
                        )}
                        
                        {sss.tip && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                            <p className="text-sm text-yellow-800">
                              <strong>💡 İpucu:</strong> {sss.tip}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => toggleSSSActive(sss.id)}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          sss.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {sss.active ? '✅ Aktif' : '❌ Pasif'}
                      </button>
                      
                      <button
                        onClick={() => moveSSSUp(sss.id)}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                      >
                        ↑
                      </button>
                      
                      <button
                        onClick={() => moveSSSDown(sss.id)}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                      >
                        ↓
                      </button>
                      
                      <button
                        onClick={() => editSSS(sss)}
                        className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                      >
                        ✏️
                      </button>
                      
                      <button
                        onClick={() => deleteSSS(sss.id)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* SSS Formu Modal */}
      {showSSSForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingSSS ? 'SSS Düzenle' : 'Yeni SSS Ekle'}
              </h2>
              <button
                onClick={() => {
                  setShowSSSForm(false);
                  setEditingSSS(null);
                  setSssForm({
                    question: '',
                    answer: '',
                    details: [],
                    tip: '',
                    icon: '❓',
                    color: 'blue',
                    order: 1,
                    active: true
                  });
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Soru
                </label>
                                 <input
                   type="text"
                   value={sssForm.question || ''}
                   onChange={(e) => setSssForm({...sssForm, question: e.target.value})}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                   placeholder="Soru yazın..."
                 />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cevap
                </label>
                                 <textarea
                   value={sssForm.answer || ''}
                   onChange={(e) => setSssForm({...sssForm, answer: e.target.value})}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                   rows={3}
                   placeholder="Cevap yazın..."
                 />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Detaylar
                </label>
                {(sssForm.details || []).map((detail, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                                         <input
                       type="text"
                       value={detail}
                       onChange={(e) => updateDetail(index, e.target.value)}
                       className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                       placeholder="Detay yazın..."
                     />
                    <button
                      onClick={() => removeDetail(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
                <button
                  onClick={addDetail}
                  className="text-blue-500 hover:text-blue-700 text-sm"
                >
                  + Detay Ekle
                </button>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  İpucu
                </label>
                                 <input
                   type="text"
                   value={sssForm.tip || ''}
                   onChange={(e) => setSssForm({...sssForm, tip: e.target.value})}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                   placeholder="İpucu yazın..."
                 />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    İkon
                  </label>
                                     <select
                     value={sssForm.icon || '❓'}
                     onChange={(e) => setSssForm({...sssForm, icon: e.target.value})}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                   >
                     {icons.map(icon => (
                       <option key={icon} value={icon}>{icon}</option>
                     ))}
                   </select>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Renk
                   </label>
                   <select
                     value={sssForm.color || 'blue'}
                     onChange={(e) => setSssForm({...sssForm, color: e.target.value})}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                   >
                    {colors.map(color => (
                      <option key={color.value} value={color.value}>{color.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  onClick={() => {
                    setShowSSSForm(false);
                    setEditingSSS(null);
                    setSssForm({
                      question: '',
                      answer: '',
                      details: [],
                      tip: '',
                      icon: '❓',
                      color: 'blue',
                      order: 1,
                      active: true
                    });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={editingSSS ? updateSSS : addSSS}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  {editingSSS ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 