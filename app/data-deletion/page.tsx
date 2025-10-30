'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, AlertCircle, CheckCircle2, Mail, Phone, User } from 'lucide-react';

export default function DataDeletionPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    reason: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E8F4F8] to-white py-20 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trash2 className="w-12 h-12 text-[#003366]" />
          </div>
          <h1 className="text-4xl font-bold text-[#003366] mb-4">
            Veri Silme Talebi
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            KVKK kapsamında kişisel verilerinizin silinmesini talep edebilirsiniz. 
            Talebiniz en geç 30 gün içinde değerlendirilecektir.
          </p>
        </motion.div>

        {!submitted ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg p-8 md:p-12"
          >
            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-2">Önemli Bilgiler:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Veri silme talebiniz 30 gün içinde işleme alınacaktır</li>
                  <li>Aktif rezervasyonlarınız varsa önce iptal edilmesi gerekebilir</li>
                  <li>Yasal saklama süresine tabi veriler hemen silinemez</li>
                  <li>Talep sonucu e-posta ile bilgilendirileceksiniz</li>
                </ul>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ad Soyad *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Adınız ve soyadınız"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A9A5] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-posta Adresi *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="ornek@email.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A9A5] focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Kayıtlı e-posta adresinizi kullanın
                </p>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefon Numarası *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="05XX XXX XX XX"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A9A5] focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Kayıtlı telefon numaranızı kullanın
                </p>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Silme Nedeni (İsteğe Bağlı)
                </label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Verilerinizin silinmesini neden talep ettiğinizi belirtebilirsiniz..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A9A5] focus:border-transparent resize-none"
                />
              </div>

              {/* KVKK Notice */}
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
                <p className="font-semibold mb-2">KVKK Kapsamında Haklarınız:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                  <li>İşlenmişse buna ilişkin bilgi talep etme</li>
                  <li>İşlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme</li>
                  <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme</li>
                  <li>Eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme</li>
                  <li>Verilerin silinmesini veya yok edilmesini isteme</li>
                </ul>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Gönderiliyor...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    Veri Silme Talebini Gönder
                  </>
                )}
              </button>
            </form>

            {/* Additional Info */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">Alternatif İletişim Yolları</h3>
              <p className="text-sm text-gray-600 mb-3">
                Veri silme talebinizi aşağıdaki yollarla da iletebilirsiniz:
              </p>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>E-posta:</strong> kvkk@baliksefasi.com</p>
                <p><strong>Telefon:</strong> 0555 123 45 67</p>
                <p><strong>Adres:</strong> İstanbul, Türkiye</p>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Success Message */
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-lg p-8 md:p-12 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="mb-6"
            >
              <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto" />
            </motion.div>

            <h2 className="text-3xl font-bold text-[#003366] mb-4">
              Talebiniz Alındı
            </h2>
            <p className="text-gray-600 mb-6">
              Veri silme talebiniz başarıyla kaydedildi. Talebiniz en geç 30 gün içinde 
              değerlendirilecek ve sonuç e-posta adresinize bildirilecektir.
            </p>

            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Referans Bilgileri:</strong>
              </p>
              <p className="text-sm text-blue-700 mt-2">
                E-posta: {formData.email}
              </p>
              <p className="text-sm text-blue-700">
                Telefon: {formData.phone}
              </p>
            </div>

            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-[#004488] transition-colors"
            >
              Ana Sayfaya Dön
            </button>
          </motion.div>
        )}

        {/* Related Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center space-x-4"
        >
          <a
            href="/privacy-policy"
            className="text-[#00A9A5] hover:underline text-sm"
          >
            Gizlilik Politikası
          </a>
          <span className="text-gray-400">•</span>
          <a
            href="/terms-of-service"
            className="text-[#00A9A5] hover:underline text-sm"
          >
            Kullanım Koşulları
          </a>
          <span className="text-gray-400">•</span>
          <a
            href="/iletisim"
            className="text-[#00A9A5] hover:underline text-sm"
          >
            İletişim
          </a>
        </motion.div>
      </div>
    </div>
  );
}
