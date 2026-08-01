'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, ChevronLeft, Loader2, Search, X,
  ChevronDown, ChevronUp, Tag, Clock, Phone, Users, Anchor,
} from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import { subscribeToBoats, Boat } from '@/lib/boatHelpers';

interface Reservation {
  id: string;
  reservationNumber?: string;
  userName?: string;
  userPhone?: string;
  date: string;
  timeSlotDisplay?: string;
  boatId?: string;
  boatName?: string;
  tourName?: string;
  totalPeople: number;
  adultCount?: number;
  childCount?: number;
  selectedSeats?: number[];
  status: string;
  promoCode?: { code: string; discountType: string; discountValue: number } | null;
  totalPrice?: number;
}

const STATUS = {
  pending:   { label: 'Bekliyor', cls: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30' },
  confirmed: { label: 'Onaylı',   cls: 'text-green-400  bg-green-400/10  border-green-400/30'  },
  cancelled: { label: 'İptal',    cls: 'text-red-400    bg-red-400/10    border-red-400/30'    },
} as const;

const TR_MONTHS = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
const TR_DAYS   = ['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'];

function formatDate(d: string) {
  try {
    const [y, m, day] = d.split('-').map(Number);
    const date = new Date(y, m - 1, day);
    return `${day} ${TR_MONTHS[m - 1]}, ${TR_DAYS[date.getDay()]}`;
  } catch { return d; }
}

/* Extract short label from timeSlotDisplay:
   "Sabah Turu (08:00 - 13:00)"  → "Sabah Turu"
   "08:00 - 13:00"               → "08:00 - 13:00"
*/
function slotLabel(display: string): string {
  const parenMatch = display.match(/^(.+?)\s*\(/);
  return parenMatch ? parenMatch[1].trim() : display.trim();
}

function ReservationCard({ res, today }: { res: Reservation; today: string }) {
  const [open, setOpen] = useState(false);
  const status = STATUS[res.status as keyof typeof STATUS] ?? STATUS.pending;
  const isToday = res.date === today;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      {/* Collapsed row */}
      <button onClick={() => setOpen(p => !p)} className="w-full text-left">
        <div className="flex items-stretch">
          {/* Status stripe */}
          <div className={`w-1 flex-shrink-0 rounded-l-2xl ${
            res.status === 'confirmed' ? 'bg-green-400' :
            res.status === 'cancelled' ? 'bg-red-400' : 'bg-yellow-400'
          }`} />

          <div className="flex-1 p-3 flex items-start gap-3 min-w-0">
            {/* Main info */}
            <div className="flex-1 min-w-0">
              {/* Badges row */}
              <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-semibold ${status.cls}`}>
                  {status.label}
                </span>
                {isToday && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full border text-blue-400 bg-blue-400/10 border-blue-400/20 font-semibold">
                    Bugün
                  </span>
                )}
                {res.promoCode && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full border text-[#00A9A5] bg-[#00A9A5]/10 border-[#00A9A5]/20 font-semibold flex items-center gap-0.5">
                    <Tag className="w-2.5 h-2.5" /> {res.promoCode.code}
                  </span>
                )}
              </div>

              {/* Name */}
              <p className="text-white font-semibold text-sm leading-tight truncate">{res.userName || '—'}</p>

              {/* Time + boat mini info */}
              <div className="flex items-center gap-3 mt-1.5 text-xs text-white/50">
                {res.timeSlotDisplay && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {slotLabel(res.timeSlotDisplay)}
                  </span>
                )}
                {res.boatName && (
                  <span className="flex items-center gap-1 truncate">
                    <Anchor className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{res.boatName}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Right side */}
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span className="text-white/60 text-xs font-medium">{res.totalPeople} kişi</span>
              {open
                ? <ChevronUp  className="w-4 h-4 text-white/25 mt-1" />
                : <ChevronDown className="w-4 h-4 text-white/25 mt-1" />
              }
            </div>
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/10 px-4 py-3 space-y-2.5 text-sm">
              {/* Res number */}
              {res.reservationNumber && (
                <p className="text-white/35 text-xs font-mono tracking-wide">{res.reservationNumber}</p>
              )}

              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                <InfoRow label="Tekne"    value={res.boatName  || '—'} />
                <InfoRow label="Tur"      value={res.tourName  || '—'} />
                {res.userPhone && (
                  <InfoRow label="Telefon" value={res.userPhone} />
                )}
                <InfoRow
                  label="Kişi"
                  value={`${res.totalPeople} kişi${
                    (res.adultCount != null || res.childCount != null)
                      ? ` (${res.adultCount ?? 0}Y${res.childCount ? ` ${res.childCount}Ç` : ''})`
                      : ''
                  }`}
                />
                {res.selectedSeats && res.selectedSeats.length > 0 && (
                  <div className="col-span-2">
                    <p className="text-white/35 text-[11px] mb-0.5">Koltuklar</p>
                    <p className="text-white">{res.selectedSeats.join(', ')}</p>
                  </div>
                )}
                {res.totalPrice != null && (
                  <InfoRow label="Fiyat" value={`₺${res.totalPrice}`} highlight />
                )}
                {res.promoCode && (
                  <InfoRow
                    label="İndirim"
                    value={`${res.promoCode.discountType === 'percent' ? '%' : '₺'}${res.promoCode.discountValue} — ${res.promoCode.code}`}
                    highlight
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-white/35 text-[11px] mb-0.5">{label}</p>
      <p className={highlight ? 'text-[#00A9A5] font-bold' : 'text-white text-sm'}>{value}</p>
    </div>
  );
}

export default function TamayReservationsPage() {
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [boats, setBoats] = useState<Boat[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [boatFilter, setBoatFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [slotFilter, setSlotFilter] = useState('all');

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const unsub = subscribeToBoats(b => setBoats(b));
    return () => unsub();
  }, []);

  useEffect(() => { fetchReservations(); }, []);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 14);
      const cutoffStr = cutoff.toISOString().split('T')[0];
      const snap = await getDocs(query(collection(db, 'reservations'), where('date', '>=', cutoffStr)));
      const list: Reservation[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as Reservation));
      list.sort((a, b) => a.date.localeCompare(b.date));
      setReservations(list);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  /* Unique time slot labels extracted from data */
  const uniqueSlots = useMemo(() => {
    const labels = new Set<string>();
    reservations.forEach(r => {
      if (r.timeSlotDisplay) labels.add(slotLabel(r.timeSlotDisplay));
    });
    return Array.from(labels).sort();
  }, [reservations]);

  const filtered = useMemo(() => reservations.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (boatFilter  !== 'all' && r.boatId  !== boatFilter)  return false;
    if (dateFilter  && r.date !== dateFilter) return false;
    if (slotFilter  !== 'all' && slotLabel(r.timeSlotDisplay || '') !== slotFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (r.userName || '').toLowerCase().includes(q) ||
        (r.userPhone || '').includes(q) ||
        (r.reservationNumber || '').toLowerCase().includes(q)
      );
    }
    return true;
  }), [reservations, statusFilter, boatFilter, dateFilter, slotFilter, search]);

  const grouped = useMemo(() => filtered.reduce<Record<string, Reservation[]>>((acc, r) => {
    (acc[r.date] = acc[r.date] || []).push(r);
    return acc;
  }, {}), [filtered]);

  const sortedDates = Object.keys(grouped).sort();

  const hasFilter = search || dateFilter || boatFilter !== 'all' || statusFilter !== 'all' || slotFilter !== 'all';

  const clearAll = () => { setSearch(''); setDateFilter(''); setBoatFilter('all'); setStatusFilter('all'); setSlotFilter('all'); };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#001F3F] via-[#001529] to-black pb-16">
      {/* Header */}
      <div className="border-b border-white/10 px-4 py-4 flex items-center gap-3 sticky top-0 z-10 bg-[#001529]/80 backdrop-blur-md">
        <button
          onClick={() => router.push('/tamay-3313')}
          className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-white font-bold text-base">Rezervasyonlar</h1>
          <p className="text-white/40 text-[11px]">Son 14 gün + gelecek · Sadece görüntüleme</p>
        </div>
        {hasFilter && (
          <button onClick={clearAll} className="text-red-400 text-xs px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/20 flex-shrink-0">
            Temizle
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="px-4 pt-3 pb-2 space-y-2.5">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Ad, telefon, rezervasyon no..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-9 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#00A9A5]/50"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-white/40" />
            </button>
          )}
        </div>

        {/* Date + Boat row */}
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-2 py-2.5 text-white text-sm focus:outline-none focus:border-[#00A9A5]/50"
            />
          </div>
          <div className="relative">
            <Anchor className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
            <select
              value={boatFilter}
              onChange={e => setBoatFilter(e.target.value)}
              className="w-full bg-[#001529] border border-white/10 rounded-xl pl-9 pr-2 py-2.5 text-white text-sm focus:outline-none focus:border-[#00A9A5]/50 appearance-none"
            >
              <option value="all">Tüm Tekneler</option>
              {boats.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </div>

        {/* Status pills */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
          {(['all', 'pending', 'confirmed', 'cancelled'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                statusFilter === s
                  ? 'bg-[#00A9A5] border-[#00A9A5] text-white'
                  : 'bg-white/5 border-white/15 text-white/50'
              }`}
            >
              {s === 'all' ? 'Tüm Durumlar' : s === 'pending' ? 'Bekliyor' : s === 'confirmed' ? 'Onaylı' : 'İptal'}
            </button>
          ))}
        </div>

        {/* Time slot pills — shown only when slots exist */}
        {uniqueSlots.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
            <button
              onClick={() => setSlotFilter('all')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                slotFilter === 'all'
                  ? 'bg-purple-500 border-purple-500 text-white'
                  : 'bg-white/5 border-white/15 text-white/50'
              }`}
            >
              <Clock className="w-3 h-3" />
              Tüm Saatler
            </button>
            {uniqueSlots.map(slot => (
              <button
                key={slot}
                onClick={() => setSlotFilter(slot)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  slotFilter === slot
                    ? 'bg-purple-500 border-purple-500 text-white'
                    : 'bg-white/5 border-white/15 text-white/50'
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Summary bar */}
      {!loading && (
        <div className="px-4 pb-3">
          <p className="text-white/35 text-xs">
            {filtered.length} rezervasyon görüntüleniyor
            {hasFilter ? ' (filtreli)' : ''}
          </p>
        </div>
      )}

      {/* Content */}
      <div className="px-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-[#00A9A5] animate-spin" />
          </div>
        ) : sortedDates.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/40 text-sm">Rezervasyon bulunamadı</p>
            {hasFilter && (
              <button onClick={clearAll} className="mt-3 text-[#00A9A5] text-xs underline">
                Filtreleri temizle
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {sortedDates.map(date => {
              const dayRes = grouped[date];
              const isToday = date === today;
              const isPast  = date < today;
              return (
                <div key={date}>
                  {/* Date heading */}
                  <div className={`flex items-center gap-2 mb-2 pb-1.5 border-b ${isToday ? 'border-[#00A9A5]/30' : 'border-white/5'}`}>
                    <p className={`text-sm font-bold ${isToday ? 'text-[#00A9A5]' : isPast ? 'text-white/35' : 'text-white'}`}>
                      {isToday ? '🟢 Bugün — ' : ''}{formatDate(date)}
                    </p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${isToday ? 'bg-[#00A9A5]/20 text-[#00A9A5]' : 'bg-white/5 text-white/35'}`}>
                      {dayRes.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {dayRes.map(r => <ReservationCard key={r.id} res={r} today={today} />)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
