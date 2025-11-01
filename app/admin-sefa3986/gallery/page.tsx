'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebaseClient';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit2, Image as ImageIcon, X, ArrowLeft, Upload } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface GalleryItem {
  id: string;
  image: string;
  text: string;
  order: number;
  createdAt: string;
}

export default function AdminGalleryPage() {
  const router = useRouter();
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [formData, setFormData] = useState({
    image: '',
    text: '',
    order: 0,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    fetchGalleryItems();
  }, []);

  const fetchGalleryItems = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'gallery'));
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GalleryItem[];
      
      items.sort((a, b) => a.order - b.order);
      setGalleryItems(items);
    } catch (error) {
      console.error('Galeri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Preview oluştur
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMultipleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles(files);
      
      // Preview'ler oluştur
      const urls: string[] = [];
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          urls.push(reader.result as string);
          if (urls.length === files.length) {
            setPreviewUrls(urls);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const timestamp = Date.now();
    const fileName = `gallery/${timestamp}_${file.name}`;
    const storageRef = ref(storage, fileName);
    
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  };

  const handleMultipleUpload = async () => {
    if (selectedFiles.length === 0) {
      alert('Lütfen en az bir görsel seçin!');
      return;
    }

    setUploading(true);
    
    try {
      const maxOrder = galleryItems.length > 0 
        ? Math.max(...galleryItems.map(item => item.order))
        : -1;

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const imageUrl = await uploadImage(file);
        
        await addDoc(collection(db, 'gallery'), {
          image: imageUrl,
          text: 'Balık Sefası', // Varsayılan başlık
          order: maxOrder + i + 1,
          createdAt: new Date().toISOString(),
        });
      }
      
      alert(`${selectedFiles.length} görsel başarıyla yüklendi!`);
      setSelectedFiles([]);
      setPreviewUrls([]);
      fetchGalleryItems();
    } catch (error) {
      console.error('Çoklu yükleme hatası:', error);
      alert('Bir hata oluştu!');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    
    try {
      let imageUrl = formData.image;
      
      // Yeni dosya seçildiyse upload et
      if (selectedFile) {
        imageUrl = await uploadImage(selectedFile);
      }
      
      if (editingItem) {
        await updateDoc(doc(db, 'gallery', editingItem.id), {
          image: imageUrl,
          text: formData.text,
          order: formData.order,
          updatedAt: new Date().toISOString(),
        });
      } else {
        await addDoc(collection(db, 'gallery'), {
          image: imageUrl,
          text: formData.text,
          order: formData.order,
          createdAt: new Date().toISOString(),
        });
      }
      
      setIsModalOpen(false);
      setEditingItem(null);
      setFormData({ image: '', text: '', order: 0 });
      setSelectedFile(null);
      setPreviewUrl('');
      fetchGalleryItems();
    } catch (error) {
      console.error('Kaydetme hatası:', error);
      alert('Bir hata oluştu!');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu görseli silmek istediğinize emin misiniz?')) return;
    
    try {
      await deleteDoc(doc(db, 'gallery', id));
      fetchGalleryItems();
    } catch (error) {
      console.error('Silme hatası:', error);
      alert('Silme işlemi başarısız!');
    }
  };

  const handleEdit = (item: GalleryItem) => {
    setEditingItem(item);
    setFormData({
      image: item.image,
      text: item.text,
      order: item.order,
    });
    setPreviewUrl(item.image);
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      image: '',
      text: '',
      order: galleryItems.length,
    });
    setPreviewUrl('');
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#001F3F] via-[#001529] to-black">
        <div className="text-white text-xl">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001F3F] via-[#001529] to-black p-6 pt-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin-sefa3986')}
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Ana Sayfa Görselleri</h1>
                <p className="text-white/60">Ana sayfada gösterilecek görselleri yönetin</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAdd}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#00A9A5] to-[#008B87] text-white rounded-xl font-semibold shadow-lg hover:shadow-[#00A9A5]/50 transition-all"
            >
              <Plus className="w-5 h-5" />
              Tek Görsel Ekle
            </motion.button>
          </div>

          {/* Çoklu Yükleme Kartı */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Upload className="w-6 h-6 text-[#00A9A5]" />
              <div>
                <h3 className="text-lg font-bold text-white">Çoklu Görsel Yükleme</h3>
                <p className="text-white/60 text-sm">Birden fazla görsel aynı anda yükleyin</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <label className="flex-1 cursor-pointer">
                <div className="border-2 border-dashed border-white/20 hover:border-[#00A9A5] rounded-xl p-8 text-center transition-all">
                  <ImageIcon className="w-12 h-12 text-white/40 mx-auto mb-3" />
                  <p className="text-white/80 font-medium mb-1">Görselleri Seçin</p>
                  <p className="text-white/40 text-sm">Birden fazla dosya seçebilirsiniz</p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleMultipleFileSelect}
                    className="hidden"
                  />
                </div>
              </label>
              
              {selectedFiles.length > 0 && (
                <div className="flex-1">
                  <div className="bg-white/5 rounded-xl p-4 mb-3">
                    <p className="text-white font-medium mb-2">{selectedFiles.length} görsel seçildi</p>
                    <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                      {previewUrls.map((url, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                          <img src={url} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={handleMultipleUpload}
                    disabled={uploading}
                    className="w-full px-6 py-3 bg-gradient-to-r from-[#00A9A5] to-[#008B87] hover:from-[#008B87] hover:to-[#00A9A5] text-white rounded-xl font-semibold shadow-lg transition-all disabled:opacity-50"
                  >
                    {uploading ? 'Yükleniyor...' : `${selectedFiles.length} Görseli Yükle`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleryItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group relative bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden hover:border-[#00A9A5]/50 transition-all"
            >
              {/* Image */}
              <div className="relative h-64 bg-black/20">
                <Image
                  src={item.image}
                  alt={item.text}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                
                {/* Order Badge */}
                <div className="absolute top-4 left-4 w-10 h-10 rounded-full bg-[#00A9A5] flex items-center justify-center text-white font-bold shadow-lg">
                  {item.order + 1}
                </div>
                
                {/* Actions */}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(item)}
                    className="w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center text-white transition-colors"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Text */}
              <div className="p-4">
                <h3 className="text-white font-semibold text-lg">{item.text}</h3>
                <p className="text-white/40 text-sm mt-1">Sıra: {item.order + 1}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {galleryItems.length === 0 && (
          <div className="text-center py-20">
            <ImageIcon className="w-20 h-20 text-white/20 mx-auto mb-4" />
            <p className="text-white/60 text-lg">Henüz görsel eklenmemiş</p>
            <p className="text-white/40 text-sm mt-2">Yeni görsel eklemek için yukarıdaki butona tıklayın</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-[#001F3F] to-[#001529] rounded-2xl border border-white/10 p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {editingItem ? 'Görsel Düzenle' : 'Yeni Görsel Ekle'}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingItem(null);
                }}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* File Upload */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  Görsel Dosyası
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex items-center justify-center gap-3 w-full px-4 py-4 bg-white/5 border-2 border-dashed border-white/20 hover:border-[#00A9A5]/50 rounded-xl text-white cursor-pointer transition-all group"
                  >
                    <Upload className="w-6 h-6 group-hover:text-[#00A9A5] transition-colors" />
                    <span className="group-hover:text-[#00A9A5] transition-colors">
                      {selectedFile ? selectedFile.name : 'Dosya Seç veya Sürükle'}
                    </span>
                  </label>
                </div>
                
                {/* Preview */}
                {previewUrl && (
                  <div className="mt-4 relative h-48 rounded-xl overflow-hidden border border-white/10">
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Text */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  Başlık
                </label>
                <input
                  type="text"
                  required
                  value={formData.text}
                  onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  placeholder="Balık Avı Turu"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:border-[#00A9A5] focus:outline-none transition-colors"
                />
              </div>

              {/* Order */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  Sıra (0'dan başlar)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.order || 0}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#00A9A5] focus:outline-none transition-colors"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingItem(null);
                  }}
                  className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-semibold transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[#00A9A5] to-[#008B87] text-white rounded-xl font-semibold shadow-lg hover:shadow-[#00A9A5]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Yükleniyor...' : (editingItem ? 'Güncelle' : 'Ekle')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
