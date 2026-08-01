'use client';

import { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Tag, Phone, Calendar, Clock, Ship, Loader2, CheckCircle, XCircle } from 'lucide-react';

interface ReservationResult {
  id: string;
  reservationNumber: string;
  userName: string;
  date: string;
  timeSlotDisplay: string;
  boatName: string;
  status: string;
  promoCode: {
    code: string;
    discountType: 'percent' | 'amount';
    discountValue: number;
    description?: string;
  } | null;
}

function normalizePhone(phone: string): string[] {
  const digits = phone.replace(/\D/g, '');
  const variants = new Set<string>();

  variants.add(digits);

  if (digits.startsWith('90') && digits.length === 12) {
    variants.add('0' + digits.slice(2));
    variants.add(digits.slice(2));
  } else if (digits.startsWith('0') && digits.length === 11) {
    variants.add(digits);
    variants.add(digits.slice(1));
    variants.add('90' + digits.slice(1));
  } else if (digits.length === 10) {
    variants.add('0' + digits);
    variants.add('90' + digits);
    variants.add(digits);
  }

  return Array.from(variants);
}

function formatDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-');
    return `${d}.${m}.${y}`;
  } catch {
    return dateStr;
  }
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: 'Bekliyor', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  approved: { label: 'Onaylı', color: 'text-green-400 bg-green-400/10 border-green-400/20' },
  cancelled: { label: 'İptal', color: 'text-red-400 bg-red-400/10 border-red-400/20' },
};

export default function StaffPromoPage() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ReservationResult[] | null>(null);
  const [searched, setSearched] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const handleSearch = async () => {
    const trimmed = phone.trim();
    if (!trimmed) return;

    setLoading(true);
    setSearched(true);
    setResults(null);

    try {
      const variants = normalizePhone(trimmed);
      const allDocs: any[] = [];

      for (const variant of variants) {
        const q = query(
          collection(db, 'reservations'),
          where('userPhone', '==', variant)
        );
        const snap = await getDocs(q);
        snap.docs.forEach((d) => {
          if (!allDocs.find((x) => x.id === d.id)) {
            allDocs.push({ id: d.id, ...d.data() });
          }
        });
      }

      // Bugün ve sonrası, iptal edilmemiş, promo kodu olanlar
      const filtered: ReservationResult[] = allDocs
        .filter((r) => r.date >= today && r.status !== 'cancelled')
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((r) => ({
          id: r.id,
          reservationNumber: r.reservationNumber || '',
          userName: r.userName || '',
          date: r.date || '',
          timeSlotDisplay: r.timeSlotDisplay || '',
          boatName: r.boatName || '',
          status: r.status || 'pending',
          promoCode: r.promoCode || null,
        }));

      setResults(filtered);
    } catch (err) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const hasPromo = results?.some((r) => r.promoCode);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#001F3F] via-[#001529] to-black flex flex-col">
      {/* Header */}
      <div className="border-b border-white/10 px-5 py-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#00A9A5]/20 border border-[#00A9A5]/30 flex items-center justify-center">
          <Tag className="w-5 h-5 text-[#00A9A5]" />
        </div>
        <div>
          <h1 className="text-white font-bold text-lg leading-tight">Kampanya Kodu Sorgulama</h1>
          <p className="text-white/40 text-xs">Balık Sefası — Personel Ekranı</p>
        </div>
      </div>

      <div className="flex-1 px-5 py-8 max-w-lg w-full mx-auto">
        {/* Search */}
        <div className="mb-8">
          <p className="text-white/60 text-sm mb-3">Müşterinin telefon numarasını girin:</p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setSearched(false);
                  setResults(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder="05XX XXX XX XX"
                className="w-full bg-white/5 border border-white/15 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-white/20 focus:outline-none focus:border-[#00A9A5]/60 text-lg"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || !phone.trim()}
              className="w-14 h-14 rounded-2xl bg-[#00A9A5] hover:bg-[#008985] disabled:opacity-40 text-white flex items-center justify-center transition-colors flex-shrink-0"
            >
              {loading
                ? <Loader2 className="w-5 h-5 animate-spin" />
                : <Search className="w-5 h-5" />
              }
            </button>
          </div>
        </div>

        {/* Results */}
        <AnimatePresence>
          {searched && !loading && results !== null && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {results.length === 0 ? (
                <div className="text-center py-12">
                  <XCircle className="w-12 h-12 text-white/20 mx-auto mb-3" />
                  <p className="text-white/40">Bu numarada aktif rezervasyon bulunamadı</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {results.map((res) => {
                    const statusInfo = STATUS_MAP[res.status] || STATUS_MAP.pending;
                    const isToday = res.date === today;

                    return (
                      <motion.div
                        key={res.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
                      >
                        {/* Reservation info */}
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div>
                              <p className="text-white font-bold text-base">{res.userName}</p>
                              <p className="text-white/40 text-xs font-mono mt-0.5">{res.reservationNumber}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${statusInfo.color}`}>
                                {statusInfo.label}
                              </span>
                              {isToday && (
                                <span className="text-[11px] px-2 py-0.5 rounded-full border text-blue-400 bg-blue-400/10 border-blue-400/20 font-medium">
                                  Bugün
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="space-y-1.5 text-sm text-white/60">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-white/30 flex-shrink-0" />
                              <span>{formatDate(res.date)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-white/30 flex-shrink-0" />
                              <span>{res.timeSlotDisplay}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Ship className="w-4 h-4 text-white/30 flex-shrink-0" />
                              <span>{res.boatName}</span>
                            </div>
                          </div>
                        </div>

                        {/* Promo code section */}
                        {res.promoCode ? (
                          <div className="border-t border-[#00A9A5]/20 bg-[#00A9A5]/10 px-4 py-3">
                            <div className="flex items-center gap-2 mb-1">
                              <CheckCircle className="w-4 h-4 text-[#00A9A5]" />
                              <span className="text-[#00A9A5] font-semibold text-sm">Kampanya Kodu Var</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-white font-bold text-xl tracking-widest font-mono">
                                {res.promoCode.code}
                              </span>
                              <span className="text-white font-bold text-2xl text-[#00C9C5]">
                                {res.promoCode.discountType === 'percent'
                                  ? `%${res.promoCode.discountValue}`
                                  : `₺${res.promoCode.discountValue}`}
                              </span>
                            </div>
                            {res.promoCode.description && (
                              <p className="text-white/50 text-xs mt-1">{res.promoCode.description}</p>
                            )}
                          </div>
                        ) : (
                          <div className="border-t border-white/5 bg-white/3 px-4 py-3 flex items-center gap-2">
                            <Tag className="w-4 h-4 text-white/20" />
                            <span className="text-white/30 text-sm">Kampanya kodu yok</span>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}

                  {/* Summary banner */}
                  {hasPromo && (
                    <div className="mt-4 bg-green-500/10 border border-green-500/20 rounded-2xl p-4 text-center">
                      <p className="text-green-400 font-semibold text-sm">
                        ✓ Müşterinin kampanya kodu doğrulandı — indirimi uygulayın
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
