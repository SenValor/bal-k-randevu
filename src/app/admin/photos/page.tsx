'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';

interface BoatPhoto {
  id: string;
  url: string;
  name: string;
}

export default function PhotosPage() {
  const [photos, setPhotos] = useState<BoatPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoName, setNewPhotoName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<BoatPhoto | null>(null);

  // Fotoğrafları dinle
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'settings'),
      (snapshot) => {
        const photosDoc = snapshot.docs.find(doc => doc.id === 'boatPhotos');
        if (photosDoc) {
          const data = photosDoc.data();
          setPhotos(data.photos || []);
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const savePhotos = async () => {
    try {
      await setDoc(doc(db, 'settings', 'boatPhotos'), {
        photos: photos,
        updatedAt: new Date()
      });
      console.log('Fotoğraflar kaydedildi');
    } catch (error: any) {
      console.error('Fotoğraf kaydetme hatası:', error);
    }
  };

  const addPhoto = () => {
    if (!newPhotoUrl.trim() || !newPhotoName.trim()) {
      alert('Lütfen fotoğraf URL\'si ve adını girin');
      return;
    }

    const newPhoto: BoatPhoto = {
      id: Date.now().toString(),
      url: newPhotoUrl.trim(),
      name: newPhotoName.trim()
    };

    setPhotos([...photos, newPhoto]);
    setNewPhotoUrl('');
    setNewPhotoName('');
    setShowAddForm(false);
    
    // Otomatik kaydet
    setTimeout(savePhotos, 500);
  };

  const updatePhoto = () => {
    if (!editingPhoto || !newPhotoUrl.trim() || !newPhotoName.trim()) {
      alert('Lütfen fotoğraf URL\'si ve adını girin');
      return;
    }

    const updatedPhotos = photos.map(photo => 
      photo.id === editingPhoto.id 
        ? { ...photo, url: newPhotoUrl.trim(), name: newPhotoName.trim() }
        : photo
    );

    setPhotos(updatedPhotos);
    setEditingPhoto(null);
    setNewPhotoUrl('');
    setNewPhotoName('');
    setShowAddForm(false);
    
    // Otomatik kaydet
    setTimeout(savePhotos, 500);
  };

  const removePhoto = (photoId: string) => {
    if (!confirm('Bu fotoğrafı silmek istediğinize emin misiniz?')) return;
    
    const filteredPhotos = photos.filter(photo => photo.id !== photoId);
    setPhotos(filteredPhotos);
    
    // Otomatik kaydet
    setTimeout(savePhotos, 500);
  };

  const editPhoto = (photo: BoatPhoto) => {
    setEditingPhoto(photo);
    setNewPhotoUrl(photo.url);
    setNewPhotoName(photo.name);
    setShowAddForm(true);
  };

  const cancelEdit = () => {
    setEditingPhoto(null);
    setNewPhotoUrl('');
    setNewPhotoName('');
    setShowAddForm(false);
  };

  const openPhotoInNewTab = (url: string) => {
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Fotoğraflar yükleniyor...</p>
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
              <h1 className="text-xl font-bold text-gray-900">📸 Fotoğraf Yönetimi</h1>
            </div>
            
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              ➕ Fotoğraf Ekle
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Fotoğraf Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {photos.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="text-4xl mb-4">📸</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz fotoğraf yok</h3>
              <p className="text-gray-600">İlk fotoğrafınızı ekleyin</p>
            </div>
          ) : (
            photos.map((photo) => (
              <div key={photo.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="aspect-w-16 aspect-h-12 bg-gray-200">
                  <img
                    src={photo.url}
                    alt={photo.name}
                    className="w-full h-48 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => openPhotoInNewTab(photo.url)}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-image.jpg';
                      target.classList.add('opacity-50');
                    }}
                  />
                </div>
                
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 mb-2 truncate">{photo.name}</h3>
                  <p className="text-sm text-gray-600 mb-4 truncate">{photo.url}</p>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => editPhoto(photo)}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      ✏️ Düzenle
                    </button>
                    <button
                      onClick={() => openPhotoInNewTab(photo.url)}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      🔍 Aç
                    </button>
                    <button
                      onClick={() => removePhoto(photo.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Fotoğraf Ekleme/Düzenleme Formu */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingPhoto ? 'Fotoğraf Düzenle' : 'Yeni Fotoğraf Ekle'}
                </h2>
                <button
                  onClick={cancelEdit}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fotoğraf Adı
                  </label>
                                     <input
                     type="text"
                     value={newPhotoName}
                     onChange={(e) => setNewPhotoName(e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                     placeholder="Fotoğraf adı girin..."
                   />
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Fotoğraf URL'si
                   </label>
                   <input
                     type="url"
                     value={newPhotoUrl}
                     onChange={(e) => setNewPhotoUrl(e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                     placeholder="https://example.com/photo.jpg"
                   />
                </div>
                
                {/* Önizleme */}
                {newPhotoUrl && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Önizleme
                    </label>
                    <div className="border border-gray-300 rounded-lg p-2">
                      <img
                        src={newPhotoUrl}
                        alt="Önizleme"
                        className="w-full h-32 object-cover rounded"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-image.jpg';
                          target.classList.add('opacity-50');
                        }}
                      />
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    onClick={cancelEdit}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    onClick={editingPhoto ? updatePhoto : addPhoto}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    {editingPhoto ? 'Güncelle' : 'Ekle'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 