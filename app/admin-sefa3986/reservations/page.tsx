'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock,
  Ship,
  User,
  Mail,
  Phone,
  MapPin,
  Loader2,
  ArrowLeft,
  Download,
  Plus
} from 'lucide-react';
import { collection, query, getDocs, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import { Reservation } from '@/lib/reservationHelpers';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';

export default function AdminReservationsPage() {
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [specificDate, setSpecificDate] = useState<string>('');
  const [boatFilter, setBoatFilter] = useState<string>('all');
  const [timeSlotFilter, setTimeSlotFilter] = useState<string>('all');
  const [boats, setBoats] = useState<any[]>([]);
  
  // Export Modal
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportDate, setExportDate] = useState<string>('');
  const [exportBoat, setExportBoat] = useState<string>('all');
  const [exportTimeSlots, setExportTimeSlots] = useState<string[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<any[]>([]);

  useEffect(() => {
    fetchReservations();
    fetchBoats();
  }, []);

  useEffect(() => {
    filterReservations();
  }, [searchTerm, statusFilter, dateFilter, specificDate, boatFilter, timeSlotFilter, reservations]);

  const fetchBoats = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'boats'));
      const boatsList: any[] = [];
      snapshot.forEach((doc) => {
        boatsList.push({ id: doc.id, ...doc.data() });
      });
      setBoats(boatsList);
    } catch (error) {
      console.error('Tekneler alınamadı:', error);
    }
  };

  const fetchReservations = async () => {
    try {
      const q = query(collection(db, 'reservations'));
      const snapshot = await getDocs(q);
      const reservationsList: Reservation[] = [];

      snapshot.forEach((doc) => {
        reservationsList.push({
          id: doc.id,
          ...doc.data(),
        } as Reservation);
      });

      // Oluşturulma tarihine göre sırala (en yeni önce)
      reservationsList.sort((a, b) => {
        // createdAt varsa onu kullan, yoksa date'i kullan
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(a.date);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      });

      console.log('📋 Admin rezervasyonlar sıralandı:', {
        total: reservationsList.length,
        firstCreatedAt: reservationsList[0]?.createdAt,
        lastCreatedAt: reservationsList[reservationsList.length - 1]?.createdAt
      });

      setReservations(reservationsList);
    } catch (error) {
      console.error('Rezervasyonlar alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterReservations = () => {
    let filtered = [...reservations];

    // Arama filtresi
    if (searchTerm) {
      filtered = filtered.filter(
        (res) =>
          res.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          res.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
          res.boatName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          res.tourName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Durum filtresi
    if (statusFilter !== 'all') {
      filtered = filtered.filter((res) => res.status === statusFilter);
    }

    // Tekne filtresi
    if (boatFilter !== 'all') {
      filtered = filtered.filter((res) => res.boatId === boatFilter);
    }

    // Saat dilimi filtresi
    if (timeSlotFilter !== 'all') {
      filtered = filtered.filter((res) => res.timeSlotId === timeSlotFilter);
    }

    // Spesifik tarih filtresi (date picker)
    if (specificDate) {
      filtered = filtered.filter((res) => {
        let resDate = res.date;
        // ISO timestamp ise sadece tarih kısmını al
        if (typeof resDate === 'string' && resDate.includes('T')) {
          resDate = resDate.split('T')[0];
        }
        return resDate === specificDate;
      });
    }

    // Genel tarih filtresi (bugün, gelecek, geçmiş)
    if (dateFilter !== 'all' && !specificDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      filtered = filtered.filter((res) => {
        let resDate = res.date;
        if (typeof resDate === 'string' && resDate.includes('T')) {
          resDate = resDate.split('T')[0];
        }
        const reservationDate = new Date(resDate);
        reservationDate.setHours(0, 0, 0, 0);

        if (dateFilter === 'today') {
          return reservationDate.getTime() === today.getTime();
        } else if (dateFilter === 'upcoming') {
          return reservationDate.getTime() >= today.getTime();
        } else if (dateFilter === 'past') {
          return reservationDate.getTime() < today.getTime();
        }
        return true;
      });
    }

    setFilteredReservations(filtered);
  };

  const updateReservationStatus = async (id: string, newStatus: 'pending' | 'confirmed' | 'cancelled') => {
    try {
      await updateDoc(doc(db, 'reservations', id), {
        status: newStatus,
      });
      // Rezervasyonları yeniden yükle
      fetchReservations();
    } catch (error) {
      console.error('Durum güncellenemedi:', error);
      alert('Durum güncellenirken bir hata oluştu');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500/10 border-green-500/50 text-green-400';
      case 'pending':
        return 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400';
      case 'cancelled':
        return 'bg-red-500/10 border-red-500/50 text-red-400';
      default:
        return 'bg-white/10 border-white/50 text-white';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Onaylandı';
      case 'pending':
        return 'Beklemede';
      case 'cancelled':
        return 'İptal Edildi';
      default:
        return status;
    }
  };

  const handleExport = () => {
    if (!exportDate) {
      alert('Lütfen bir tarih seçin');
      return;
    }

    if (exportTimeSlots.length === 0) {
      alert('Lütfen en az bir saat dilimi seçin');
      return;
    }

    // Seçilen tarihe ve tekneye göre filtrele
    let exportData = reservations.filter(r => {
      const reservationDate = r.date.split('T')[0];
      return reservationDate === exportDate;
    });

    if (exportBoat !== 'all') {
      exportData = exportData.filter(r => r.boatId === exportBoat);
    }

    // Seçilen saat dilimlerine göre filtrele
    exportData = exportData.filter(r => exportTimeSlots.includes(r.timeSlotId));

    if (exportData.length === 0) {
      alert('Seçilen tarih ve tekne için randevu bulunamadı');
      return;
    }

    // Saat dilimlerine göre grupla
    const groupedByTime = exportData.reduce((acc: any, reservation) => {
      const timeSlot = reservation.timeSlotDisplay || 'Belirtilmemiş';
      if (!acc[timeSlot]) {
        acc[timeSlot] = [];
      }
      acc[timeSlot].push(reservation);
      return acc;
    }, {});

    // PDF oluştur ve WhatsApp'a gönder
    generatePDFAndShareWhatsApp(exportData, groupedByTime);
  };

  const generatePDFAndShareWhatsApp = (data: Reservation[], groupedByTime: any) => {
    const selectedBoat = boats.find(b => b.id === exportBoat);
    const boatName = selectedBoat ? selectedBoat.name : 'Tüm Tekneler';
    const formattedDate = new Date(exportDate).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    
    // Seçilen saat dilimlerinin isimlerini al
    const selectedTimeSlotNames = exportTimeSlots.map(slotId => {
      const index = parseInt(slotId);
      const slot = availableTimeSlots[index];
      return slot ? (slot.displayName || `${slot.start} - ${slot.end}`) : '';
    }).filter(name => name).join(', ');

    // PDF oluştur
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPos = 20;
    const lineHeight = 7;
    const margin = 15;

    // Başlık
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('BALIK SEFASI - Randevu Listesi', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    // Bilgiler
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Tarih: ${formattedDate}`, margin, yPos);
    yPos += 6;
    pdf.text(`Tekne: ${boatName}`, margin, yPos);
    yPos += 6;
    pdf.text(`Saat Dilimleri: ${selectedTimeSlotNames}`, margin, yPos);
    yPos += 6;
    pdf.text(`Toplam Randevu: ${data.length}`, margin, yPos);
    yPos += 10;

    // Randevuları saat dilimlerine göre ekle
    Object.keys(groupedByTime).sort().forEach(timeSlot => {
      const reservations = groupedByTime[timeSlot];
      
      // Yeni sayfa kontrolü
      if (yPos > pageHeight - 40) {
        pdf.addPage();
        yPos = 20;
      }

      // Saat dilimi başlığı
      pdf.setFillColor(0, 169, 165);
      pdf.rect(margin, yPos - 5, pageWidth - 2 * margin, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${timeSlot} (${reservations.length} Randevu)`, margin + 2, yPos);
      pdf.setTextColor(0, 0, 0);
      yPos += 10;

      // Her randevu için
      reservations.forEach((reservation: Reservation, index: number) => {
        // Yeni sayfa kontrolü
        if (yPos > pageHeight - 50) {
          pdf.addPage();
          yPos = 20;
        }

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${index + 1}. ${reservation.userName}`, margin, yPos);
        yPos += 5;

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.text(`Tel: ${(reservation as any).userPhone || '-'}`, margin + 5, yPos);
        yPos += 4;
        pdf.text(`Kisi: ${reservation.totalPeople} (${reservation.adultCount}Y, ${reservation.childCount}C)`, margin + 5, yPos);
        yPos += 4;
        pdf.text(`Tutar: ${reservation.totalPrice} TL`, margin + 5, yPos);
        yPos += 4;
        
        if (reservation.selectedSeats && reservation.selectedSeats.length > 0) {
          pdf.text(`Koltuklar: ${reservation.selectedSeats.slice(0, 6).join(', ')}`, margin + 5, yPos);
          yPos += 4;
        }

        // Durum
        const statusText = getStatusText(reservation.status);
        pdf.text(`Durum: ${statusText}`, margin + 5, yPos);
        yPos += 7;

        // Ayırıcı çizgi
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 5;
      });

      yPos += 5;
    });

    // Özet istatistikler
    const totalPeople = data.reduce((sum, r) => sum + r.totalPeople, 0);
    const totalRevenue = data.reduce((sum, r) => sum + (r.totalPrice || 0), 0);
    const confirmedCount = data.filter(r => r.status === 'confirmed').length;

    if (yPos > pageHeight - 40) {
      pdf.addPage();
      yPos = 20;
    }

    pdf.setFillColor(248, 249, 250);
    pdf.rect(margin, yPos, pageWidth - 2 * margin, 30, 'F');
    yPos += 8;

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('OZET ISTATISTIKLER', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    const statsX = margin + 10;
    pdf.text(`Toplam Randevu: ${data.length}`, statsX, yPos);
    pdf.text(`Onaylanmis: ${confirmedCount}`, statsX + 50, yPos);
    yPos += 5;
    pdf.text(`Toplam Kisi: ${totalPeople}`, statsX, yPos);
    pdf.text(`Toplam Gelir: ${totalRevenue.toLocaleString('tr-TR')} TL`, statsX + 50, yPos);

    // PDF'i blob olarak al
    const pdfBlob = pdf.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);

    // Dosya adı oluştur
    const fileName = `Randevu_${boatName.replace(/\s+/g, '_')}_${exportDate}.pdf`;

    // WhatsApp Web için metin oluştur
    const whatsappText = `*BALIK SEFASI - Randevu Listesi*%0A%0A` +
      `📅 Tarih: ${formattedDate}%0A` +
      `🚢 Tekne: ${boatName}%0A` +
      `⏰ Saat: ${selectedTimeSlotNames}%0A` +
      `📊 Toplam: ${data.length} randevu%0A%0A` +
      `PDF dosyası tarayıcınızdan indirildi.%0A` +
      `Lütfen indirilen PDF'i WhatsApp'a manuel olarak ekleyin.`;

    // PDF'i indir
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = fileName;
    link.click();

    // WhatsApp Web'i aç
    setTimeout(() => {
      const whatsappUrl = `https://web.whatsapp.com/send?text=${whatsappText}`;
      window.open(whatsappUrl, '_blank');
      
      // Modal'ı kapat
      setShowExportModal(false);
      
      // Kullanıcıya bilgi ver
      alert(`✅ PDF indirildi: ${fileName}\n\n📱 WhatsApp Web açıldı.\nLütfen indirilen PDF dosyasını WhatsApp sohbetine manuel olarak ekleyin.`);
    }, 500);

    // Cleanup
    setTimeout(() => URL.revokeObjectURL(pdfUrl), 10000);
  };

  const stats = {
    total: reservations.length,
    pending: reservations.filter((r) => r.status === 'pending').length,
    confirmed: reservations.filter((r) => r.status === 'confirmed').length,
    cancelled: reservations.filter((r) => r.status === 'cancelled').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#001F3F] via-[#001529] to-black pb-24 pt-24">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-transparent" />
        <div className="container mx-auto px-4 py-8 relative">
          <button
            onClick={() => router.push('/admin-sefa3986')}
            className="flex items-center gap-2 text-white/60 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Geri Dön
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Randevu Yönetimi 📅
              </h1>
              <p className="text-white/60 text-lg">
                Tüm rezervasyonları görüntüleyin ve yönetin
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/admin-sefa3986/add-reservation')}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-purple-500/30"
              >
                <Plus className="w-5 h-5" />
                Randevu Ekle
              </button>
              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#00A9A5] to-[#008B87] hover:from-[#008B87] hover:to-[#00A9A5] text-white font-semibold rounded-xl transition-all shadow-lg shadow-[#00A9A5]/30"
              >
                <Download className="w-5 h-5" />
                Randevu Listesi İndir
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-xl p-4"
          >
            <p className="text-white/60 text-sm mb-1">Toplam</p>
            <p className="text-3xl font-bold text-white">{stats.total}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4"
          >
            <p className="text-yellow-400/60 text-sm mb-1">Beklemede</p>
            <p className="text-3xl font-bold text-yellow-400">{stats.pending}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-green-500/5 border border-green-500/20 rounded-xl p-4"
          >
            <p className="text-green-400/60 text-sm mb-1">Onaylandı</p>
            <p className="text-3xl font-bold text-green-400">{stats.confirmed}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-red-500/5 border border-red-500/20 rounded-xl p-4"
          >
            <p className="text-red-400/60 text-sm mb-1">İptal</p>
            <p className="text-3xl font-bold text-red-400">{stats.cancelled}</p>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
          {/* İlk Satır */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ad, email, tekne veya tur ara..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/40 focus:border-[#00A9A5] focus:bg-white/10 outline-none transition-all"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:border-[#00A9A5] focus:bg-white/10 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="pending">Beklemede</option>
                <option value="confirmed">Onaylandı</option>
                <option value="cancelled">İptal Edildi</option>
              </select>
            </div>

            {/* Date Filter */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <select
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  if (e.target.value !== 'all') {
                    setSpecificDate(''); // Genel filtre seçilince spesifik tarihi temizle
                  }
                }}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:border-[#00A9A5] focus:bg-white/10 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="all">Tüm Tarihler</option>
                <option value="today">Bugün</option>
                <option value="upcoming">Gelecek</option>
                <option value="past">Geçmiş</option>
              </select>
            </div>
          </div>

          {/* İkinci Satır */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Specific Date Picker */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="date"
                value={specificDate}
                onChange={(e) => {
                  setSpecificDate(e.target.value);
                  if (e.target.value) {
                    setDateFilter('all'); // Spesifik tarih seçilince genel filtreyi temizle
                  }
                }}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:border-[#00A9A5] focus:bg-white/10 outline-none transition-all"
              />
            </div>

            {/* Boat Filter */}
            <div className="relative">
              <Ship className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <select
                value={boatFilter}
                onChange={(e) => setBoatFilter(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:border-[#00A9A5] focus:bg-white/10 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="all">Tüm Tekneler</option>
                {boats.map((boat) => (
                  <option key={boat.id} value={boat.id}>
                    {boat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Time Slot Filter */}
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <select
                value={timeSlotFilter}
                onChange={(e) => setTimeSlotFilter(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:border-[#00A9A5] focus:bg-white/10 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="all">Tüm Saatler</option>
                <option value="0">09:00 - 12:00</option>
                <option value="1">12:00 - 15:00</option>
                <option value="2">15:00 - 18:00</option>
                <option value="3">18:00 - 21:00</option>
              </select>
            </div>
          </div>

          {/* Clear Filters Button */}
          {(searchTerm || statusFilter !== 'all' || dateFilter !== 'all' || specificDate || boatFilter !== 'all' || timeSlotFilter !== 'all') && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setDateFilter('all');
                  setSpecificDate('');
                  setBoatFilter('all');
                  setTimeSlotFilter('all');
                }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors text-sm"
              >
                Filtreleri Temizle
              </button>
            </div>
          )}
        </div>

        {/* Reservations List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-[#00A9A5] animate-spin" />
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
            <Calendar className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">
              Rezervasyon Bulunamadı
            </h3>
            <p className="text-white/60">
              {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                ? 'Filtreleri değiştirerek tekrar deneyin'
                : 'Henüz hiç rezervasyon yapılmamış'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReservations.map((reservation, index) => (
              <motion.div
                key={reservation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all"
              >
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  {/* Left: Compact Info */}
                  <div className="lg:col-span-3 space-y-3">
                    {/* Status & Reservation Number */}
                    <div className="flex items-center justify-between">
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(reservation.status)}`}>
                        {reservation.status === 'confirmed' && <CheckCircle className="w-4 h-4" />}
                        {reservation.status === 'pending' && <Clock className="w-4 h-4" />}
                        {reservation.status === 'cancelled' && <XCircle className="w-4 h-4" />}
                        <span className="text-sm font-medium">{getStatusText(reservation.status)}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-white/40 text-xs">Rezervasyon No</p>
                        <p className="text-[#00A9A5] font-mono font-bold">
                          {(reservation as any).reservationNumber || `RV-${reservation.id.slice(0, 8)}`}
                        </p>
                      </div>
                    </div>

                    {/* Compact Info Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <p className="text-white/40 text-xs">🚢 Tekne</p>
                        <p className="text-white font-medium">{reservation.boatName}</p>
                      </div>
                      <div>
                        <p className="text-white/40 text-xs">🎣 Tur</p>
                        <p className="text-white font-medium">{reservation.tourName}</p>
                      </div>
                      <div>
                        <p className="text-white/40 text-xs">📅 Tarih</p>
                        <p className="text-white font-medium">
                          {(() => {
                            // Tarih string'ini parse et (UTC değil!)
                            let dateStr = reservation.date;
                            if (typeof dateStr === 'string' && dateStr.includes('T')) {
                              dateStr = dateStr.split('T')[0];
                            }
                            const [year, month, day] = dateStr.split('-');
                            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                            return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
                          })()}
                        </p>
                      </div>
                      <div>
                        <p className="text-white/40 text-xs">⏰ Saat</p>
                        <p className="text-white font-medium">{reservation.timeSlotDisplay}</p>
                      </div>
                    </div>

                    {/* User Info - Compact */}
                    <div className="flex items-center gap-4 text-sm border-t border-white/10 pt-3">
                      <div className={`px-2 py-1 rounded text-xs font-semibold ${
                        reservation.userId === 'guest' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {reservation.userId === 'guest' ? '👤' : '⭐'}
                      </div>
                      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div>
                          <p className="text-white/40 text-xs">👤 Ad</p>
                          <p className="text-white font-medium truncate">{reservation.userName}</p>
                        </div>
                        <div>
                          <p className="text-white/40 text-xs">📞 Telefon</p>
                          <p className="text-white font-medium">{(reservation as any).userPhone || '-'}</p>
                        </div>
                        <div>
                          <p className="text-white/40 text-xs">👥 Kişi</p>
                          <p className="text-white font-medium">{reservation.totalPeople} kişi</p>
                        </div>
                        <div>
                          <p className="text-white/40 text-xs">💰 Tutar</p>
                          <p className="text-[#00A9A5] font-bold">₺{reservation.totalPrice}</p>
                        </div>
                      </div>
                    </div>

                    {/* Ekipman & Koltuk - Compact */}
                    <div className="flex items-center gap-4 text-xs border-t border-white/10 pt-3">
                      {(reservation.adultCount > 0 || reservation.childCount > 0) && (
                        <div className="flex items-center gap-2">
                          <span className="text-white/40">🎣</span>
                          <span className="text-white">
                            {reservation.adultCount > 0 && `${reservation.adultCount} Yetişkin`}
                            {reservation.childCount > 0 && ` • ${reservation.childCount} Çocuk`}
                            {(reservation as any).equipmentType === 'with' ? ' (Ekipman ✓)' : ' (Kendi)'}
                          </span>
                        </div>
                      )}
                      {reservation.selectedSeats && reservation.selectedSeats.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-white/40">💺</span>
                          <span className="text-white">
                            {reservation.selectedSeats.slice(0, 4).map((seatId: number) => {
                              const side = seatId <= 6 ? 'IS' : 'SA';
                              const position = seatId <= 6 ? seatId : seatId - 6;
                              return `T1_${side}${position}`;
                            }).join(', ')}
                            {reservation.selectedSeats.length > 4 && ` +${reservation.selectedSeats.length - 4}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col justify-center">
                    {/* Actions - Compact */}
                    <div className="space-y-1.5">
                      {/* Bekliyor Butonu */}
                      <button
                        onClick={() => updateReservationStatus(reservation.id, 'pending')}
                        disabled={reservation.status === 'pending'}
                        className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                          reservation.status === 'pending'
                            ? 'bg-yellow-500/30 border-2 border-yellow-500 text-yellow-300 cursor-not-allowed'
                            : 'bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 text-yellow-400'
                        }`}
                      >
                        <Clock className="w-4 h-4" />
                        {reservation.status === 'pending' ? '● Bekliyor' : 'Bekliyor Yap'}
                      </button>

                      {/* Onayla Butonu */}
                      <button
                        onClick={() => updateReservationStatus(reservation.id, 'confirmed')}
                        disabled={reservation.status === 'confirmed'}
                        className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                          reservation.status === 'confirmed'
                            ? 'bg-green-500/30 border-2 border-green-500 text-green-300 cursor-not-allowed'
                            : 'bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-400'
                        }`}
                      >
                        <CheckCircle className="w-4 h-4" />
                        {reservation.status === 'confirmed' ? '● Onaylandı' : 'Onayla'}
                      </button>

                      {/* İptal Et Butonu */}
                      <button
                        onClick={() => updateReservationStatus(reservation.id, 'cancelled')}
                        disabled={reservation.status === 'cancelled'}
                        className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                          reservation.status === 'cancelled'
                            ? 'bg-red-500/30 border-2 border-red-500 text-red-300 cursor-not-allowed'
                            : 'bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400'
                        }`}
                      >
                        <XCircle className="w-4 h-4" />
                        {reservation.status === 'cancelled' ? '● İptal Edildi' : 'İptal Et'}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl p-8 max-w-md w-full"
          >
            <h3 className="text-2xl font-bold text-white mb-6">Randevu Listesi İndir</h3>
            
            {/* Date Input */}
            <div className="mb-4">
              <label className="block text-white/80 text-sm font-medium mb-2">
                Tarih Seçin
              </label>
              <input
                type="date"
                value={exportDate}
                onChange={(e) => setExportDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#00A9A5] focus:bg-white/10 outline-none transition-all"
              />
            </div>

            {/* Boat Select */}
            <div className="mb-4">
              <label className="block text-white/80 text-sm font-medium mb-2">
                Tekne Seçin
              </label>
              <select
                value={exportBoat}
                onChange={(e) => {
                  const boatId = e.target.value;
                  setExportBoat(boatId);
                  setExportTimeSlots([]);
                  
                  // Seçilen teknenin saat dilimlerini al
                  if (boatId !== 'all') {
                    const selectedBoat = boats.find(b => b.id === boatId);
                    if (selectedBoat && selectedBoat.timeSlots && selectedBoat.timeSlots.length > 0) {
                      setAvailableTimeSlots(selectedBoat.timeSlots);
                    } else {
                      setAvailableTimeSlots([]);
                    }
                  } else {
                    setAvailableTimeSlots([]);
                  }
                }}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#00A9A5] focus:bg-white/10 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="all">Tüm Tekneler</option>
                {boats.map((boat) => (
                  <option key={boat.id} value={boat.id}>
                    {boat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Time Slots Selection */}
            {exportBoat !== 'all' && availableTimeSlots.length > 0 && (
              <div className="mb-6">
                <label className="block text-white/80 text-sm font-medium mb-3">
                  Saat Dilimleri Seçin (Birden fazla seçilebilir)
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableTimeSlots.map((slot, index) => {
                    const slotId = index.toString();
                    const isSelected = exportTimeSlots.includes(slotId);
                    
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setExportTimeSlots(exportTimeSlots.filter(id => id !== slotId));
                          } else {
                            setExportTimeSlots([...exportTimeSlots, slotId]);
                          }
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-[#00A9A5]/20 border-[#00A9A5] text-white'
                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            isSelected ? 'bg-[#00A9A5] border-[#00A9A5]' : 'border-white/30'
                          }`}>
                            {isSelected && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <div className="text-left">
                            <div className="font-semibold">{slot.displayName || `${slot.start} - ${slot.end}`}</div>
                            <div className="text-xs text-white/50">⏰ {slot.start} - {slot.end}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                
                {/* Tümünü Seç / Temizle Butonları */}
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => setExportTimeSlots(availableTimeSlots.map((_, i) => i.toString()))}
                    className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 text-white/70 text-sm rounded-lg transition-colors"
                  >
                    Tümünü Seç
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportTimeSlots([])}
                    className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 text-white/70 text-sm rounded-lg transition-colors"
                  >
                    Temizle
                  </button>
                </div>
              </div>
            )}

            {/* Uyarı mesajı */}
            {exportBoat !== 'all' && availableTimeSlots.length === 0 && (
              <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                <p className="text-yellow-400 text-sm">
                  ⚠️ Bu teknede henüz saat dilimi tanımlanmamış. Lütfen önce tekne ayarlarından saat dilimlerini ekleyin.
                </p>
              </div>
            )}

            {exportBoat === 'all' && (
              <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <p className="text-blue-400 text-sm">
                  ℹ️ Saat dilimi seçimi için lütfen önce bir tekne seçin.
                </p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleExport}
                disabled={!exportDate || exportTimeSlots.length === 0}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-[#00A9A5] to-[#008B87] hover:from-[#008B87] hover:to-[#00A9A5] text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                İndir {exportTimeSlots.length > 0 && `(${exportTimeSlots.length} Saat)`}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// Yardımcı fonksiyonlar burada kalacak
function getStatusColor(status: string) {
  switch (status) {
    case 'confirmed':
      return 'bg-green-500/20 border-green-500/50 text-green-400';
    case 'pending':
      return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400';
    case 'cancelled':
      return 'bg-red-500/20 border-red-500/50 text-red-400';
    default:
      return 'bg-white/20 border-white/50 text-white';
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'confirmed':
      return 'Onaylandı';
    case 'pending':
      return 'Bekliyor';
    case 'cancelled':
      return 'İptal Edildi';
    default:
      return status;
  }
}
