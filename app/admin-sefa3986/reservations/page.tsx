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
  Plus,
  MessageCircle,
  Send,
  Trash2
} from 'lucide-react';
import { collection, query, getDocs, doc, updateDoc, orderBy, deleteDoc } from 'firebase/firestore';
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
  const [specificDate, setSpecificDate] = useState<string>('');
  const [boatFilter, setBoatFilter] = useState<string>('all');
  const [timeSlotFilter, setTimeSlotFilter] = useState<string>('all');
  const [boats, setBoats] = useState<any[]>([]);
  const [availableTimeSlotsForFilter, setAvailableTimeSlotsForFilter] = useState<any[]>([]);
  
  // Toplu Onay
  const [selectedReservations, setSelectedReservations] = useState<string[]>([]);
  const [bulkApproving, setBulkApproving] = useState(false);
  
  // Export Modal
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportDate, setExportDate] = useState<string>('');
  const [exportBoat, setExportBoat] = useState<string>('all');
  const [exportTimeSlots, setExportTimeSlots] = useState<string[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<any[]>([]);
  
  // Edit Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [editPeopleCount, setEditPeopleCount] = useState(0);
  const [editSelectedSeats, setEditSelectedSeats] = useState<number[]>([]);
  const [editOccupiedSeats, setEditOccupiedSeats] = useState<number[]>([]);
  const [editPhoneNumber, setEditPhoneNumber] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    fetchReservations();
    fetchBoats();
  }, []);

  useEffect(() => {
    filterReservations();
  }, [searchTerm, statusFilter, specificDate, boatFilter, timeSlotFilter, reservations]);

  // Tekne seçildiğinde saat dilimlerini güncelle
  useEffect(() => {
    if (boatFilter !== 'all') {
      const selectedBoat = boats.find(b => b.id === boatFilter);
      if (selectedBoat && selectedBoat.timeSlots && selectedBoat.timeSlots.length > 0) {
        setAvailableTimeSlotsForFilter(selectedBoat.timeSlots);
      } else {
        setAvailableTimeSlotsForFilter([]);
      }
    } else {
      // Tüm tekneler seçiliyse, tüm saat dilimlerini topla
      const allTimeSlots: any[] = [];
      boats.forEach(boat => {
        if (boat.timeSlots && boat.timeSlots.length > 0) {
          boat.timeSlots.forEach((slot: any) => {
            const slotKey = `${slot.start}-${slot.end}`;
            if (!allTimeSlots.find(s => `${s.start}-${s.end}` === slotKey)) {
              allTimeSlots.push(slot);
            }
          });
        }
      });
      setAvailableTimeSlotsForFilter(allTimeSlots);
    }
    // Tekne değiştiğinde saat filtresini sıfırla
    setTimeSlotFilter('all');
  }, [boatFilter, boats]);

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
          (res.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (res.userEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (res.boatName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (res.tourName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (res.userPhone || '').includes(searchTerm) ||
          (res.reservationNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
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
      filtered = filtered.filter((res) => {
        const timeSlotDisplay = res.timeSlotDisplay || '';
        const timeMatch = timeSlotDisplay.match(/\((\d{2}:\d{2}\s*-\s*\d{2}:\d{2})\)/);
        if (timeMatch) {
          const displayTime = timeMatch[1].replace(/\s/g, '');
          const filterTime = timeSlotFilter.replace(/\s/g, '');
          return displayTime === filterTime;
        }
        return false;
      });
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

    // Genel tarih filtresi kaldırıldı - sadece spesifik tarih kullanılıyor

    setFilteredReservations(filtered);
  };

  const updateReservationStatus = async (id: string, newStatus: 'pending' | 'confirmed' | 'cancelled') => {
    try {
      await updateDoc(doc(db, 'reservations', id), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });

      // Yerel state'i güncelle
      setReservations(reservations.map(r => 
        r.id === id ? { ...r, status: newStatus } : r
      ));
      setFilteredReservations(filteredReservations.map(r => 
        r.id === id ? { ...r, status: newStatus } : r
      ));
    } catch (error) {
      console.error('Durum güncelleme hatası:', error);
      alert('Durum güncellenirken bir hata oluştu');
    }
  };

  // Toplu onay fonksiyonu
  const handleBulkApprove = async () => {
    if (selectedReservations.length === 0) {
      alert('Lütfen en az bir rezervasyon seçin');
      return;
    }

    const confirmMsg = `${selectedReservations.length} rezervasyonu onaylamak istediğinize emin misiniz?`;
    if (!confirm(confirmMsg)) return;

    setBulkApproving(true);
    
    try {
      // Tüm seçili rezervasyonları onayla
      const promises = selectedReservations.map(id => 
        updateDoc(doc(db, 'reservations', id), {
          status: 'confirmed',
          updatedAt: new Date().toISOString(),
        })
      );

      await Promise.all(promises);

      // Yerel state'i güncelle
      setReservations(reservations.map(r => 
        selectedReservations.includes(r.id) ? { ...r, status: 'confirmed' } : r
      ));
      setFilteredReservations(filteredReservations.map(r => 
        selectedReservations.includes(r.id) ? { ...r, status: 'confirmed' } : r
      ));

      // Seçimi temizle
      setSelectedReservations([]);
      alert(`${selectedReservations.length} rezervasyon başarıyla onaylandı!`);
    } catch (error) {
      console.error('Toplu onay hatası:', error);
      alert('Toplu onay sırasında bir hata oluştu');
    } finally {
      setBulkApproving(false);
    }
  };

  // Checkbox toggle
  const toggleReservationSelection = (id: string) => {
    setSelectedReservations(prev => 
      prev.includes(id) 
        ? prev.filter(resId => resId !== id)
        : [...prev, id]
    );
  };

  // Rezervasyon silme
  const handleDeleteReservation = async (id: string, reservationNumber: string) => {
    if (!confirm(`${reservationNumber} numaralı rezervasyonu kalıcı olarak silmek istediğinize emin misiniz?\n\nBu işlem geri alınamaz!`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'reservations', id));
      
      // Yerel state'ten kaldır
      setReservations(prev => prev.filter(r => r.id !== id));
      setFilteredReservations(prev => prev.filter(r => r.id !== id));
      
      alert('✅ Rezervasyon başarıyla silindi.');
    } catch (error) {
      console.error('Silme hatası:', error);
      alert('❌ Rezervasyon silinirken bir hata oluştu.');
    }
  };

  // Rezervasyon düzenleme modal'ını aç
  const openEditModal = (reservation: Reservation) => {
    setEditingReservation(reservation);
    setEditPeopleCount(reservation.totalPeople || 0);
    setEditSelectedSeats(reservation.selectedSeats || []);
    setEditPhoneNumber((reservation as any).userPhone || '');
    
    // Aynı tekne, tarih ve saat dilimindeki diğer rezervasyonların koltukları
    const occupiedSeats: number[] = [];
    reservations.forEach(r => {
      // Kendisi hariç, aynı tekne/tarih/saat ve aktif rezervasyonlar
      if (
        r.id !== reservation.id &&
        r.boatId === reservation.boatId &&
        r.date === reservation.date &&
        r.timeSlotId === reservation.timeSlotId &&
        (r.status === 'confirmed' || r.status === 'pending')
      ) {
        if (r.selectedSeats && Array.isArray(r.selectedSeats)) {
          occupiedSeats.push(...r.selectedSeats);
        }
      }
    });
    
    setEditOccupiedSeats([...new Set(occupiedSeats)]); // Tekrarları kaldır
    setShowEditModal(true);
  };

  // Koltuk seçimini toggle et
  const toggleSeatSelection = (seatId: number) => {
    // Dolu koltuk ise seçilemesin
    if (editOccupiedSeats.includes(seatId)) {
      alert('Bu koltuk başka bir rezervasyonda kullanılıyor!');
      return;
    }
    
    setEditSelectedSeats(prev => 
      prev.includes(seatId) 
        ? prev.filter(id => id !== seatId)
        : [...prev, seatId]
    );
  };

  // Düzenlemeyi kaydet
  const handleSaveEdit = async () => {
    if (!editingReservation) return;

    // Kişi sayısı ve koltuk sayısı eşleşmeli
    if (editSelectedSeats.length !== editPeopleCount) {
      alert(`Lütfen ${editPeopleCount} kişi için ${editPeopleCount} koltuk seçin!`);
      return;
    }

    // Telefon numarası kontrolü
    if (!editPhoneNumber.trim()) {
      alert('Lütfen telefon numarası girin!');
      return;
    }

    setEditSaving(true);
    try {
      await updateDoc(doc(db, 'reservations', editingReservation.id), {
        totalPeople: editPeopleCount,
        selectedSeats: editSelectedSeats,
        userPhone: editPhoneNumber.trim(),
        updatedAt: new Date().toISOString(),
      });

      // Yerel state'i güncelle
      setReservations(prev => prev.map(r => 
        r.id === editingReservation.id 
          ? { ...r, totalPeople: editPeopleCount, selectedSeats: editSelectedSeats, userPhone: editPhoneNumber.trim() } as any
          : r
      ));
      setFilteredReservations(prev => prev.map(r => 
        r.id === editingReservation.id 
          ? { ...r, totalPeople: editPeopleCount, selectedSeats: editSelectedSeats, userPhone: editPhoneNumber.trim() } as any
          : r
      ));

      alert('✅ Rezervasyon başarıyla güncellendi!');
      setShowEditModal(false);
      setEditingReservation(null);
    } catch (error) {
      console.error('Güncelleme hatası:', error);
      alert('❌ Rezervasyon güncellenirken bir hata oluştu.');
    } finally {
      setEditSaving(false);
    }
  };

  // Tümünü seç/kaldır
  const toggleSelectAll = () => {
    if (selectedReservations.length === filteredReservations.filter(r => r.status === 'pending').length) {
      setSelectedReservations([]);
    } else {
      setSelectedReservations(filteredReservations.filter(r => r.status === 'pending').map(r => r.id));
    }
  };

  // Tarihi Türkçe formatla
  const formatDateTurkish = (dateStr: string): string => {
    if (!dateStr) return "";
    
    try {
      const date = new Date(dateStr);
      const months = [
        "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
        "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
      ];
      
      const day = date.getDate();
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      
      return `${day} ${month} ${year}`;
    } catch (error) {
      return dateStr;
    }
  };

  // Telefon numarasını formatla
  const formatPhoneForWhatsApp = (phone: string): string => {
    if (!phone) return "";
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("90")) return cleaned;
    if (cleaned.startsWith("0")) return "90" + cleaned.substring(1);
    return "90" + cleaned;
  };

  // WhatsApp Onay Mesajı Gönder (Manuel - WhatsApp Web)
  const sendApprovalMessage = (reservation: Reservation) => {
    if (!reservation.userPhone) {
      alert('❌ Telefon numarası bulunamadı!');
      return;
    }

    const formattedPhone = formatPhoneForWhatsApp(reservation.userPhone);
    const formattedDate = formatDateTurkish(reservation.date);
    const seats = reservation.selectedSeats?.join(", ") || "";
    const locationLink = reservation.boatMapsLink || "";

    const message = `🐟 Balık Sefası

Merhaba ${reservation.userName || "Değerli Müşterimiz"},

Rezervasyonunuz onaylandı! 🎉

🎫 Rezervasyon No: ${reservation.reservationNumber || ""}
📅 Tarih: ${formattedDate}
🕐 Saat: ${reservation.timeSlotDisplay || "Belirtilmemiş"}
⛵ Tekne: ${reservation.boatName || "BALIK SEFASI"}
💺 Koltuklar: ${seats}
${locationLink ? `📍 Konum: ${locationLink}` : ''}

Teşekkürler, iyi avlar dileriz ⚓

Bu numarayı kullanarak rezervasyonunuzu sorgulayabilir veya iptal edebilirsiniz.
www.baliksefasi.com`;

    // WhatsApp Web'e yönlendir
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // WhatsApp İptal Mesajı Gönder (Manuel - WhatsApp Web)
  const sendCancellationMessage = (reservation: Reservation) => {
    if (!reservation.userPhone) {
      alert('❌ Telefon numarası bulunamadı!');
      return;
    }

    const formattedPhone = formatPhoneForWhatsApp(reservation.userPhone);
    const formattedDate = formatDateTurkish(reservation.date);
    const locationLink = reservation.boatMapsLink || "";

    const message = `🐟 Balık Sefası

Merhaba ${reservation.userName || "Değerli Müşterimiz"},

Rezervasyonunuz iptal edildi.

🎫 Rezervasyon No: ${reservation.reservationNumber || ""}
📅 Tarih: ${formattedDate}
🕐 Saat: ${reservation.timeSlotDisplay || "Belirtilmemiş"}
⛵ Tekne: ${reservation.boatName || "BALIK SEFASI"}
${locationLink ? `📍 Konum: ${locationLink}` : ''}

Tekrar görüşmek dileğiyle 🙏
www.baliksefasi.com`;

    // WhatsApp Web'e yönlendir
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
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
    // Türkçe karakter dönüştürme fonksiyonu
    const toAscii = (text: string) => {
      const charMap: { [key: string]: string } = {
        'ç': 'c', 'Ç': 'C',
        'ğ': 'g', 'Ğ': 'G',
        'ı': 'i', 'İ': 'I',
        'ö': 'o', 'Ö': 'O',
        'ş': 's', 'Ş': 'S',
        'ü': 'u', 'Ü': 'U'
      };
      return text.replace(/[çÇğĞıİöÖşŞüÜ]/g, (char) => charMap[char] || char);
    };

    const selectedBoat = boats.find(b => b.id === exportBoat);
    const boatName = selectedBoat ? toAscii(selectedBoat.name) : 'Tum Tekneler';
    const formattedDate = new Date(exportDate).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    
    // Seçilen saat dilimlerinin sadece saat aralıklarını al
    const selectedTimeSlotNames = exportTimeSlots.map(slotId => {
      const index = parseInt(slotId);
      const slot = availableTimeSlots[index];
      return slot ? `${slot.start} - ${slot.end}` : '';
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
    pdf.text(toAscii('BALIK SEFASI - Randevu Listesi'), pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    // Bilgiler
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(toAscii(`Tarih: ${formattedDate}`), margin, yPos);
    yPos += 6;
    pdf.text(toAscii(`Tekne: ${boatName}`), margin, yPos);
    yPos += 6;
    pdf.text(toAscii(`Saat Dilimleri: ${selectedTimeSlotNames}`), margin, yPos);
    yPos += 6;
    pdf.text(toAscii(`Toplam Randevu: ${data.length}`), margin, yPos);
    yPos += 10;

    // Randevuları saat dilimlerine göre ekle
    Object.keys(groupedByTime).sort().forEach(timeSlot => {
      const reservations = groupedByTime[timeSlot];
      
      // Yeni sayfa kontrolü
      if (yPos > pageHeight - 40) {
        pdf.addPage();
        yPos = 20;
      }

      // Saat dilimi başlığı - sadece saat aralığını göster
      const timeSlotMatch = timeSlot.match(/(\d{2}:\d{2}\s*-\s*\d{2}:\d{2})/);
      const timeSlotDisplay = timeSlotMatch ? timeSlotMatch[1] : timeSlot;
      
      pdf.setFillColor(0, 169, 165);
      pdf.rect(margin, yPos - 5, pageWidth - 2 * margin, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(toAscii(`${timeSlotDisplay} (${reservations.length})`), margin + 2, yPos);
      pdf.setTextColor(0, 0, 0);
      yPos += 10;

      // Her randevu için
      reservations.forEach((reservation: Reservation, index: number) => {
        // Yeni sayfa kontrolü
        if (yPos > pageHeight - 50) {
          pdf.addPage();
          yPos = 20;
        }

        // Rezervasyon numarası ve isim
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(toAscii(`${index + 1}. ${reservation.userName || 'Isimsiz'}`), margin, yPos);
        yPos += 5;

        // Bilgiler - daha düzenli tablo formatı
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        
        const phone = (reservation as any).userPhone || '-';
        const people = `${reservation.totalPeople} (${reservation.adultCount}Y, ${reservation.childCount || 0}C)`;
        const seats = reservation.selectedSeats && reservation.selectedSeats.length > 0 
          ? reservation.selectedSeats.join(', ') 
          : '-';
        const statusText = getStatusText(reservation.status);
        
        pdf.text(toAscii(`   Tel: ${phone}`), margin, yPos);
        yPos += 4;
        pdf.text(toAscii(`   Kisi: ${people}`), margin, yPos);
        yPos += 4;
        pdf.text(toAscii(`   Koltuklar: ${seats}`), margin, yPos);
        yPos += 4;
        pdf.text(toAscii(`   Durum: ${statusText}`), margin, yPos);
        yPos += 6;

        // Ayırıcı çizgi
        pdf.setDrawColor(220, 220, 220);
        pdf.line(margin + 5, yPos, pageWidth - margin - 5, yPos);
        yPos += 4;
      });

      yPos += 5;
    });

    // Özet istatistikler
    const totalPeople = data.reduce((sum, r) => sum + r.totalPeople, 0);
    const confirmedCount = data.filter(r => r.status === 'confirmed').length;

    if (yPos > pageHeight - 40) {
      pdf.addPage();
      yPos = 20;
    }

    pdf.setFillColor(248, 249, 250);
    pdf.rect(margin, yPos, pageWidth - 2 * margin, 25, 'F');
    yPos += 8;

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text(toAscii('OZET ISTATISTIKLER'), pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    const statsX = margin + 10;
    pdf.text(toAscii(`Toplam Randevu: ${data.length}`), statsX, yPos);
    pdf.text(toAscii(`Onaylanmis: ${confirmedCount}`), statsX + 50, yPos);
    yPos += 5;
    pdf.text(toAscii(`Toplam Kisi: ${totalPeople}`), statsX, yPos);

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
          {/* Durum Filtresi Butonları */}
          <div className="flex flex-wrap gap-3 mb-6 pb-6 border-b border-white/10">
            <button
              onClick={() => setStatusFilter('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                statusFilter === 'all'
                  ? 'bg-white/20 text-white border-2 border-white/40'
                  : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
              }`}
            >
              <span>📋</span>
              <span>Tümü</span>
              <span className="ml-1 px-2 py-0.5 bg-white/10 rounded-full text-xs">
                {stats.total}
              </span>
            </button>
            
            <button
              onClick={() => setStatusFilter('pending')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                statusFilter === 'pending'
                  ? 'bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/40'
                  : 'bg-white/5 text-white/60 border border-white/10 hover:bg-yellow-500/10'
              }`}
            >
              <span>⏳</span>
              <span>Bekleyen</span>
              <span className="ml-1 px-2 py-0.5 bg-yellow-500/20 rounded-full text-xs">
                {stats.pending}
              </span>
            </button>
            
            <button
              onClick={() => setStatusFilter('confirmed')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                statusFilter === 'confirmed'
                  ? 'bg-green-500/20 text-green-400 border-2 border-green-500/40'
                  : 'bg-white/5 text-white/60 border border-white/10 hover:bg-green-500/10'
              }`}
            >
              <span>✅</span>
              <span>Onaylı</span>
              <span className="ml-1 px-2 py-0.5 bg-green-500/20 rounded-full text-xs">
                {stats.confirmed}
              </span>
            </button>
            
            <button
              onClick={() => setStatusFilter('cancelled')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                statusFilter === 'cancelled'
                  ? 'bg-red-500/20 text-red-400 border-2 border-red-500/40'
                  : 'bg-white/5 text-white/60 border border-white/10 hover:bg-red-500/10'
              }`}
            >
              <span>❌</span>
              <span>İptal</span>
              <span className="ml-1 px-2 py-0.5 bg-red-500/20 rounded-full text-xs">
                {stats.cancelled}
              </span>
            </button>
          </div>

          {/* İlk Satır */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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

            {/* Date Filter - Kaldırıldı, sadece spesifik tarih kullanılıyor */}
          </div>

          {/* İkinci Satır */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Specific Date Picker */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="date"
                value={specificDate}
                onChange={(e) => setSpecificDate(e.target.value)}
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
                disabled={availableTimeSlotsForFilter.length === 0}
              >
                <option value="all">
                  {availableTimeSlotsForFilter.length === 0 ? 'Önce Tekne Seçin' : 'Tüm Saatler'}
                </option>
                {availableTimeSlotsForFilter.map((slot, index) => (
                  <option key={index} value={`${slot.start}-${slot.end}`}>
                    {slot.start} - {slot.end}
                    {slot.displayName ? ` (${slot.displayName})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear Filters Button */}
          {(searchTerm || statusFilter !== 'all' || specificDate || boatFilter !== 'all' || timeSlotFilter !== 'all') && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setSpecificDate('');
                  setBoatFilter('all');
                  setTimeSlotFilter('all');
                  setSelectedReservations([]);
                }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors text-sm"
              >
                Filtreleri Temizle
              </button>
            </div>
          )}
        </div>

        {/* Toplu Onay Butonları */}
        {filteredReservations.filter(r => r.status === 'pending').length > 0 && (
          <div className="bg-gradient-to-r from-[#00A9A5]/10 to-[#6B9BC3]/10 border border-[#00A9A5]/30 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleSelectAll}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <input
                    type="checkbox"
                    checked={selectedReservations.length === filteredReservations.filter(r => r.status === 'pending').length && selectedReservations.length > 0}
                    onChange={() => {}}
                    className="w-4 h-4 rounded"
                  />
                  Tümünü Seç ({filteredReservations.filter(r => r.status === 'pending').length})
                </button>
                
                {selectedReservations.length > 0 && (
                  <span className="text-white/70 text-sm">
                    {selectedReservations.length} rezervasyon seçildi
                  </span>
                )}
              </div>

              {selectedReservations.length > 0 && (
                <button
                  onClick={handleBulkApprove}
                  disabled={bulkApproving}
                  className="px-6 py-2 bg-gradient-to-r from-[#00A9A5] to-[#008985] hover:from-[#00C9C5] hover:to-[#00A9A5] text-white rounded-lg font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {bulkApproving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Onaylanıyor...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Seçilenleri Onayla ({selectedReservations.length})
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

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
              {searchTerm || statusFilter !== 'all' || specificDate || boatFilter !== 'all' || timeSlotFilter !== 'all'
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
                      <div className="flex items-center gap-3">
                        {/* Checkbox - Sadece pending rezervasyonlar için */}
                        {reservation.status === 'pending' && (
                          <input
                            type="checkbox"
                            checked={selectedReservations.includes(reservation.id)}
                            onChange={() => toggleReservationSelection(reservation.id)}
                            className="w-5 h-5 rounded border-2 border-[#00A9A5] text-[#00A9A5] focus:ring-[#00A9A5] cursor-pointer"
                          />
                        )}
                        <div className="flex items-center gap-2">
                          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(reservation.status)}`}>
                            {reservation.status === 'confirmed' && <CheckCircle className="w-4 h-4" />}
                            {reservation.status === 'pending' && <Clock className="w-4 h-4" />}
                            {reservation.status === 'cancelled' && <XCircle className="w-4 h-4" />}
                            <span className="text-sm font-medium">{getStatusText(reservation.status)}</span>
                          </div>
                          
                          {/* WhatsApp Durum Badges */}
                          <div className="flex items-center gap-1">
                            {/* Hoş Geldiniz Mesajı Badge (Opt-in) */}
                            {(reservation as any).whatsappConsent && (
                              <div 
                                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                  (reservation as any).welcomeMessageSent 
                                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' 
                                    : 'bg-gray-500/20 text-gray-400 border border-gray-500/50'
                                }`}
                                title={
                                  (reservation as any).welcomeMessageSent 
                                    ? `Hoş geldiniz mesajı gönderildi (Opt-in)` 
                                    : 'Hoş geldiniz mesajı bekliyor'
                                }
                              >
                                <MessageCircle className="w-3 h-3" />
                                {(reservation as any).welcomeMessageSent ? '👋' : '⏳'}
                              </div>
                            )}
                            
                            {/* Onay Mesajı Badge */}
                            {reservation.status === 'confirmed' && (
                              <div 
                                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                  (reservation as any).whatsappSent 
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
                                    : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                                }`}
                                title={
                                  (reservation as any).whatsappSent 
                                    ? `Onay mesajı gönderildi: ${(reservation as any).whatsappSentAt ? new Date((reservation as any).whatsappSentAt).toLocaleString('tr-TR') : ''}` 
                                    : 'Onay mesajı henüz gönderilmedi'
                                }
                              >
                                <MessageCircle className="w-3 h-3" />
                                {(reservation as any).whatsappSent ? '✓' : '⏳'}
                              </div>
                            )}
                          </div>
                        </div>
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

                      {/* WhatsApp Onay Mesajı */}
                      <button
                        onClick={() => sendApprovalMessage(reservation)}
                        disabled={!reservation.userPhone}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/50 text-[#25D366] disabled:opacity-50 disabled:cursor-not-allowed"
                        title="WhatsApp Onay Mesajı Gönder"
                      >
                        <MessageCircle className="w-4 h-4" />
                        WhatsApp
                      </button>

                      {/* Düzenle Butonu */}
                      <button
                        onClick={() => openEditModal(reservation)}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-400"
                        title="Rezervasyonu Düzenle"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Düzenle
                      </button>

                      {/* Sil Butonu */}
                      <button
                        onClick={() => handleDeleteReservation(reservation.id, reservation.reservationNumber || 'N/A')}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors bg-gray-500/20 hover:bg-red-500/30 border border-gray-500/50 hover:border-red-500/50 text-gray-400 hover:text-red-400"
                        title="Rezervasyonu Kalıcı Olarak Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                        Sil
                      </button>

                      {/* WhatsApp İptal Mesajı */}
                      <button
                        onClick={() => sendCancellationMessage(reservation)}
                        disabled={!reservation.userPhone}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/50 text-orange-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="WhatsApp İptal Mesajı Gönder"
                      >
                        <Send className="w-4 h-4" />
                        İptal Mesajı
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

      {/* Edit Modal */}
      {showEditModal && editingReservation && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">Rezervasyon Düzenle</h3>
              {editOccupiedSeats.length > 0 && (
                <p className="text-red-400 text-sm">
                  ⚠️ Bu saat diliminde {editOccupiedSeats.length} koltuk başka rezervasyonlarda kullanılıyor
                </p>
              )}
            </div>
            
            {/* Rezervasyon Bilgileri */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-white/40">Müşteri</p>
                  <p className="text-white font-medium">{editingReservation.userName}</p>
                </div>
                <div>
                  <p className="text-white/40">Tekne</p>
                  <p className="text-white font-medium">{editingReservation.boatName}</p>
                </div>
                <div>
                  <p className="text-white/40">Tarih</p>
                  <p className="text-white font-medium">{editingReservation.date}</p>
                </div>
                <div>
                  <p className="text-white/40">Saat</p>
                  <p className="text-white font-medium">{editingReservation.timeSlotDisplay}</p>
                </div>
              </div>
            </div>

            {/* Telefon Numarası */}
            <div className="mb-6">
              <label className="block text-white/80 text-sm font-medium mb-3">
                Telefon Numarası
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="tel"
                  value={editPhoneNumber}
                  onChange={(e) => setEditPhoneNumber(e.target.value)}
                  placeholder="0555 123 4567"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/40 focus:border-[#00A9A5] focus:bg-white/10 outline-none transition-all"
                />
              </div>
            </div>

            {/* Kişi Sayısı */}
            <div className="mb-6">
              <label className="block text-white/80 text-sm font-medium mb-3">
                Kişi Sayısı
              </label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setEditPeopleCount(Math.max(1, editPeopleCount - 1))}
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center justify-center"
                >
                  -
                </button>
                <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center font-bold text-xl">
                  {editPeopleCount} Kişi
                </div>
                <button
                  onClick={() => setEditPeopleCount(Math.min(12, editPeopleCount + 1))}
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>

            {/* Koltuk Seçimi */}
            <div className="mb-6">
              <label className="block text-white/80 text-sm font-medium mb-3">
                Koltuk Seçimi ({editSelectedSeats.length}/{editPeopleCount} seçildi)
              </label>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="grid grid-cols-6 gap-2">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((seatId) => {
                    const isSelected = editSelectedSeats.includes(seatId);
                    const isOriginal = (editingReservation.selectedSeats || []).includes(seatId);
                    const isOccupied = editOccupiedSeats.includes(seatId);
                    const side = seatId <= 6 ? 'IS' : 'SA';
                    const position = seatId <= 6 ? seatId : seatId - 6;
                    
                    return (
                      <button
                        key={seatId}
                        onClick={() => toggleSeatSelection(seatId)}
                        disabled={isOccupied}
                        className={`
                          aspect-square rounded-lg border-2 transition-all text-xs font-bold
                          ${isOccupied
                            ? 'bg-red-500/20 border-red-500 text-red-400 cursor-not-allowed opacity-70'
                            : isSelected 
                            ? 'bg-[#00A9A5]/30 border-[#00A9A5] text-[#00A9A5]' 
                            : 'bg-white/5 border-white/20 text-white/60 hover:border-white/40'
                          }
                          ${isOriginal && !isSelected && !isOccupied ? 'ring-2 ring-orange-500' : ''}
                        `}
                        title={
                          isOccupied 
                            ? 'Dolu - Başka rezervasyonda kullanılıyor' 
                            : isOriginal && !isSelected 
                            ? 'Orijinal koltuk - Kaldırılacak' 
                            : ''
                        }
                      >
                        <div className="text-[10px]">T1_{side}{position}</div>
                        <div>{seatId}</div>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-[#00A9A5]/30 border-2 border-[#00A9A5] rounded"></div>
                    <span className="text-white/60">Seçili</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500/20 border-2 border-red-500 rounded"></div>
                    <span className="text-white/60">Dolu (Başka Rez.)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-white/5 border-2 border-white/20 ring-2 ring-orange-500 rounded"></div>
                    <span className="text-white/60">Kaldırılacak</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-white/5 border-2 border-white/20 rounded"></div>
                    <span className="text-white/60">Boş</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Uyarı */}
            {editSelectedSeats.length !== editPeopleCount && (
              <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                <p className="text-yellow-400 text-sm">
                  ⚠️ Lütfen {editPeopleCount} kişi için {editPeopleCount} koltuk seçin!
                </p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingReservation(null);
                }}
                className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={editSaving || editSelectedSeats.length !== editPeopleCount}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-[#00A9A5] to-[#008B87] hover:from-[#008B87] hover:to-[#00A9A5] text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {editSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  'Kaydet'
                )}
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
