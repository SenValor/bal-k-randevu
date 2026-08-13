'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { collection, query, orderBy, limit, getDocs, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ClipboardList, CheckCircle, XCircle, Trash2, Edit, Users, Megaphone, UserX, RefreshCw } from 'lucide-react';
import { AdminAction } from '@/lib/adminHelpers';
import PinGate from '@/components/admin/PinGate';

interface LogEntry {
  id: string;
  adminEmail: string;
  adminName: string;
  action: AdminAction;
  targetId: string | null;
  reservationNumber: string | null;
  details: Record<string, unknown> | null;
  timestamp: Timestamp;
}

const ACTION_LABELS: Record<AdminAction, { label: string; color: string; icon: React.ElementType }> = {
  reservation_approved:    { label: 'Rezervasyon Onaylandı',  color: 'text-green-400 bg-green-500/10 border-green-500/30',   icon: CheckCircle },
  reservation_cancelled:   { label: 'Rezervasyon İptal',      color: 'text-red-400 bg-red-500/10 border-red-500/30',         icon: XCircle },
  reservation_deleted:     { label: 'Rezervasyon Silindi',     color: 'text-red-500 bg-red-500/10 border-red-500/30',         icon: Trash2 },
  reservation_edited:      { label: 'Rezervasyon Düzenlendi',  color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30', icon: Edit },
  bulk_approved:           { label: 'Toplu Onay',              color: 'text-green-400 bg-green-500/10 border-green-500/30',   icon: CheckCircle },
  bulk_cancelled:          { label: 'Toplu İptal',             color: 'text-red-400 bg-red-500/10 border-red-500/30',         icon: XCircle },
  archive_deleted:         { label: 'Arşiv Silindi',           color: 'text-red-500 bg-red-500/10 border-red-500/30',         icon: Trash2 },
  blacklist_added:         { label: 'Kara Listeye Eklendi',    color: 'text-orange-400 bg-orange-500/10 border-orange-500/30', icon: UserX },
  blacklist_removed:       { label: 'Kara Listeden Çıkarıldı', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',      icon: Users },
  announcement_added:      { label: 'Duyuru Eklendi',          color: 'text-purple-400 bg-purple-500/10 border-purple-500/30', icon: Megaphone },
  announcement_toggled:    { label: 'Duyuru Durumu Değişti',   color: 'text-purple-400 bg-purple-500/10 border-purple-500/30', icon: Megaphone },
  announcement_deleted:    { label: 'Duyuru Silindi',          color: 'text-red-400 bg-red-500/10 border-red-500/30',         icon: Trash2 },
};

function formatTimestamp(ts: Timestamp | null): string {
  if (!ts) return '-';
  const d = ts.toDate();
  return d.toLocaleDateString('tr-TR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function DetailsBlock({ details }: { details: Record<string, unknown> | null }) {
  if (!details) return null;
  const entries = Object.entries(details);
  if (entries.length === 0) return null;
  return (
    <div className="mt-1.5 text-xs text-white/40 space-y-0.5">
      {entries.map(([k, v]) => {
        if (v === null || v === undefined) return null;
        const val = Array.isArray(v) ? (v as string[]).join(', ') : String(v);
        return (
          <span key={k} className="inline-block mr-2">
            <span className="text-white/30">{k}:</span> {val}
          </span>
        );
      })}
    </div>
  );
}

export default function LogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminFilter, setAdminFilter] = useState('');
  const [actionFilter, setActionFilter] = useState<AdminAction | ''>('');
  const [admins, setAdmins] = useState<string[]>([]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let q = query(
        collection(db, 'adminLogs'),
        orderBy('timestamp', 'desc'),
        limit(200)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as LogEntry));
      setLogs(data);

      const uniqueAdmins = [...new Set(data.map(l => l.adminEmail).filter(Boolean))];
      setAdmins(uniqueAdmins);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const filtered = logs.filter(l => {
    if (adminFilter && l.adminEmail !== adminFilter) return false;
    if (actionFilter && l.action !== actionFilter) return false;
    return true;
  });

  return (
    <PinGate>
    <div className="min-h-screen bg-gradient-to-b from-[#001F3F] via-[#001529] to-black pb-16 pt-20">
      {/* Header */}
      <div className="container mx-auto px-4 mb-6">
        <button
          onClick={() => router.push('/admin-sefa3986')}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Geri
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#00A9A5] to-teal-600 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">İşlem Logları</h1>
              <p className="text-white/50 text-sm">Adminlerin yaptığı tüm işlemler</p>
            </div>
          </div>
          <button
            onClick={fetchLogs}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white/60 hover:text-white text-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Yenile
          </button>
        </div>

        {/* Filtreler */}
        <div className="flex flex-wrap gap-3 mt-4">
          <select
            value={adminFilter}
            onChange={e => setAdminFilter(e.target.value)}
            className="bg-white/5 border border-white/10 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-[#00A9A5]"
          >
            <option value="">Tüm Adminler</option>
            {admins.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value as AdminAction | '')}
            className="bg-white/5 border border-white/10 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-[#00A9A5]"
          >
            <option value="">Tüm İşlemler</option>
            {(Object.keys(ACTION_LABELS) as AdminAction[]).map(a => (
              <option key={a} value={a}>{ACTION_LABELS[a].label}</option>
            ))}
          </select>

          {(adminFilter || actionFilter) && (
            <button
              onClick={() => { setAdminFilter(''); setActionFilter(''); }}
              className="px-3 py-2 bg-white/5 border border-white/10 text-white/60 hover:text-white text-sm rounded-xl transition-colors"
            >
              Temizle
            </button>
          )}

          <span className="ml-auto flex items-center text-white/40 text-sm">
            {filtered.length} kayıt
          </span>
        </div>
      </div>

      {/* Log listesi */}
      <div className="container mx-auto px-4 space-y-2">
        {loading ? (
          <div className="text-center text-white/40 py-16">Yükleniyor...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-white/40 py-16">Kayıt bulunamadı.</div>
        ) : (
          filtered.map((log, i) => {
            const meta = ACTION_LABELS[log.action] ?? {
              label: log.action,
              color: 'text-white/60 bg-white/5 border-white/10',
              icon: ClipboardList,
            };
            const Icon = meta.icon;
            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
                className="bg-white/5 border border-white/10 rounded-xl p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border ${meta.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                      {meta.label}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-medium text-sm">{log.adminName || log.adminEmail}</span>
                        {log.reservationNumber && (
                          <span className="text-[#00A9A5] text-xs font-mono">{log.reservationNumber}</span>
                        )}
                      </div>
                      <DetailsBlock details={log.details} />
                    </div>
                  </div>
                  <span className="text-white/30 text-xs whitespace-nowrap shrink-0">
                    {formatTimestamp(log.timestamp)}
                  </span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
    </PinGate>
  );
}
