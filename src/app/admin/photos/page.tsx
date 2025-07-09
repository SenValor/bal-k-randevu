'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db, storage } from '@/lib/firebase';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

interface BoatPhoto {
  id: string;
  url: string;
  name: string;
  type?: 'image' | 'video';
}

export default function PhotosPage() {
  const [photos, setPhotos] = useState<BoatPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newPhotoName, setNewPhotoName] = useState('');
  const [newMediaType, setNewMediaType] = useState<'image' | 'video'>('image');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<BoatPhoto | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

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



  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Dosya tipi kontrolü
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      alert('Sadece resim ve video dosyaları yükleyebilirsiniz!');
      return;
    }

    // Dosya boyut kontrolü (maksimum 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Dosya boyutu 10MB\'dan küçük olmalıdır!');
      return;
    }

    setSelectedFile(file);
    setNewMediaType(isImage ? 'image' : 'video');
    
    // Önizleme için URL oluştur
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);
    
    // Dosya adını otomatik olarak doldur
    if (!newPhotoName.trim()) {
      const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, "");
      setNewPhotoName(nameWithoutExtension);
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const storageRef = ref(storage, `media/${fileName}`);
    
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  };

  const addPhoto = async () => {
    if (!selectedFile || !newPhotoName.trim()) {
      alert('Lütfen dosya seçin ve medya adını girin');
      return;
    }

    setUploading(true);
    try {
      // Dosyayı Firebase Storage'a yükle
      const downloadURL = await uploadFile(selectedFile);

      const newPhoto: BoatPhoto = {
        id: Date.now().toString(),
        url: downloadURL,
        name: newPhotoName.trim(),
        type: newMediaType
      };

      const updatedPhotos = [...photos, newPhoto];
      setPhotos(updatedPhotos);
      
      // Formu temizle
      setSelectedFile(null);
      setNewPhotoName('');
      setNewMediaType('image');
      setPreviewUrl('');
      setShowAddForm(false);
      
      // Güncellenmiş array ile otomatik kaydet
      await setDoc(doc(db, 'settings', 'boatPhotos'), {
        photos: updatedPhotos,
        updatedAt: new Date()
      });
      
    } catch (error) {
      console.error('Dosya yükleme hatası:', error);
      alert('Dosya yüklenirken hata oluştu!');
    } finally {
      setUploading(false);
    }
  };

  const updatePhoto = async () => {
    if (!editingPhoto || !newPhotoName.trim()) {
      alert('Lütfen medya adını girin');
      return;
    }

    setUploading(true);
    try {
      let finalUrl = editingPhoto.url; // Varsayılan olarak mevcut URL'yi kullan
      
      // Eğer yeni dosya seçildiyse, yükle
      if (selectedFile) {
        finalUrl = await uploadFile(selectedFile);
      }

      const updatedPhotos = photos.map(photo => 
        photo.id === editingPhoto.id 
          ? { ...photo, url: finalUrl, name: newPhotoName.trim(), type: newMediaType }
          : photo
      );

      setPhotos(updatedPhotos);
      setEditingPhoto(null);
      setSelectedFile(null);
      setNewPhotoName('');
      setNewMediaType('image');
      setPreviewUrl('');
      setShowAddForm(false);
      
      // Güncellenmiş array ile otomatik kaydet
      await setDoc(doc(db, 'settings', 'boatPhotos'), {
        photos: updatedPhotos,
        updatedAt: new Date()
      });
      
    } catch (error) {
      console.error('Güncelleme hatası:', error);
      alert('Medya güncellenirken hata oluştu!');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = async (photoId: string) => {
    if (!confirm('Bu fotoğrafı silmek istediğinize emin misiniz?')) return;
    
    const filteredPhotos = photos.filter(photo => photo.id !== photoId);
    setPhotos(filteredPhotos);
    
    // Güncellenmiş array ile otomatik kaydet
    try {
      await setDoc(doc(db, 'settings', 'boatPhotos'), {
        photos: filteredPhotos,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Silme hatası:', error);
      alert('Medya silinirken hata oluştu!');
    }
  };

  const editPhoto = (photo: BoatPhoto) => {
    setEditingPhoto(photo);
    setSelectedFile(null);
    setNewPhotoName(photo.name);
    setNewMediaType(photo.type || 'image');
    setPreviewUrl(photo.url); // Mevcut medyayı önizleme olarak göster
    setShowAddForm(true);
  };

  const cancelEdit = () => {
    setEditingPhoto(null);
    setSelectedFile(null);
    setNewPhotoName('');
    setNewMediaType('image');
    setPreviewUrl('');
    setShowAddForm(false);
    
    // Eğer önizleme URL varsa temizle
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
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
              <h1 className="text-xl font-bold text-gray-900">📸 Medya Yönetimi (Fotoğraf & Video)</h1>
            </div>
            
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              ➕ Medya Ekle
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz medya yok</h3>
              <p className="text-gray-600">İlk fotoğraf/videonuzu ekleyin</p>
            </div>
          ) : (
            photos.map((photo) => (
              <div key={photo.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="aspect-w-16 aspect-h-12 bg-gray-200 relative">
                  {photo.type === 'video' ? (
                    <>
                      <video
                        src={photo.url}
                        className="w-full h-48 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => openPhotoInNewTab(photo.url)}
                        controls
                        preload="metadata"
                      />
                      <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                        🎥 VİDEO
                      </div>
                    </>
                  ) : (
                    <>
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
                      <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold">
                        📸 FOTOĞRAF
                      </div>
                    </>
                  )}
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
                  {editingPhoto ? 'Medya Düzenle' : 'Yeni Medya Ekle'}
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
                    Medya Tipi
                  </label>
                  <select
                    value={newMediaType}
                    onChange={(e) => setNewMediaType(e.target.value as 'image' | 'video')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="image">📸 Fotoğraf</option>
                    <option value="video">🎥 Video</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {newMediaType === 'video' ? 'Video Adı' : 'Fotoğraf Adı'}
                  </label>
                                     <input
                     type="text"
                     value={newPhotoName}
                     onChange={(e) => setNewPhotoName(e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                     placeholder={newMediaType === 'video' ? 'Video adı girin...' : 'Fotoğraf adı girin...'}
                   />
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Dosya Seç {editingPhoto ? '(Değiştirmek için yeni dosya seçin)' : ''}
                   </label>
                   <input
                     type="file"
                     accept="image/*,video/*"
                     onChange={handleFileSelect}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                   />
                   {selectedFile && (
                     <p className="text-xs text-gray-600 mt-1">
                       Seçilen dosya: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                     </p>
                   )}
                   <p className="text-xs text-gray-500 mt-1">
                     {newMediaType === 'video' 
                       ? 'MP4, WebM, MOV formatları desteklenir (maksimum 10MB)' 
                       : 'JPG, PNG, GIF formatları desteklenir (maksimum 10MB)'
                     }
                   </p>
                </div>
                
                {/* Önizleme */}
                {previewUrl && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Önizleme
                    </label>
                    <div className="border border-gray-300 rounded-lg p-2 relative">
                      {newMediaType === 'video' ? (
                        <>
                          <video
                            src={previewUrl}
                            className="w-full h-32 object-cover rounded"
                            controls
                            preload="metadata"
                          />
                          <div className="absolute top-1 left-1 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                            🎥 VİDEO
                          </div>
                        </>
                      ) : (
                        <>
                          <img
                            src={previewUrl}
                            alt="Önizleme"
                            className="w-full h-32 object-cover rounded"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/placeholder-image.jpg';
                              target.classList.add('opacity-50');
                            }}
                          />
                          <div className="absolute top-1 left-1 bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold">
                            📸 FOTOĞRAF
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    onClick={cancelEdit}
                    disabled={uploading}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    İptal
                  </button>
                  <button
                    onClick={editingPhoto ? updatePhoto : addPhoto}
                    disabled={uploading || (!selectedFile && !editingPhoto) || !newPhotoName.trim()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {uploading ? 'Yükleniyor...' : (editingPhoto ? 'Güncelle' : 'Ekle')}
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