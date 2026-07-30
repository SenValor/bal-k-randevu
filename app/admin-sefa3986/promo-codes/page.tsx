'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Plus, Pencil, Trash2, Tag, Check, X, ChevronLeft, ToggleLeft, ToggleRight } from 'lucide-react';
import Link from 'next/link';
import {
  PromoCode,
  getAllPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
} from '@/lib/promoCodeHelpers';

const EMPTY_FORM: Omit<PromoCode, 'id' | 'currentUsage' | 'createdAt'> = {
  code: '',
  description: '',
  discountType: 'percent',
  discountValue: 10,
  maxUsage: 100,
  validFrom: new Date().toISOString().split('T')[0],
  validUntil: '',
  isActive: true,
};

export default function PromoCodesPage() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAllPromoCodes();
      setCodes(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingCode(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowModal(true);
  };

  const openEdit = (code: PromoCode) => {
    setEditingCode(code);
    setForm({
      code: code.code,
      description: code.description,
      discountType: code.discountType,
      discountValue: code.discountValue,
      maxUsage: code.maxUsage,
      validFrom: code.validFrom,
      validUntil: code.validUntil,
      isActive: code.isActive,
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.code.trim()) { setError('Kod gerekli'); return; }
    if (!form.discountValue || form.discountValue <= 0) { setError('İndirim değeri gerekli'); return; }
    if (!form.validUntil) { setError('Bitiş tarihi gerekli'); return; }
    if (form.validFrom > form.validUntil) { setError('Başlangıç tarihi bitiş tarihinden önce olmalı'); return; }

    setSaving(true);
    setError('');
    try {
      if (editingCode?.id) {
        await updatePromoCode(editingCode.id, form);
      } else {
        await createPromoCode(form);
      }
      setShowModal(false);
      await load();
    } catch (e: any) {
      setError(e.message || 'Hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (code: PromoCode) => {
    if (!confirm(`"${code.code}" kodunu silmek istediğinize emin misiniz?`)) return;
    await deletePromoCode(code.id!);
    await load();
  };

  const handleToggle = async (code: PromoCode) => {
    await updatePromoCode(code.id!, { isActive: !code.isActive });
    await load();
  };

  const today = new Date().toISOString().split('T')[0];

  const getStatus = (code: PromoCode) => {
    if (!code.isActive) return { label: 'Pasif', color: 'text-gray-400 bg-gray-400/10 border-gray-400/20' };
    if (code.validUntil < today) return { label: 'Süresi Doldu', color: 'text-red-400 bg-red-400/10 border-red-400/20' };
    if (code.currentUsage >= code.maxUsage) return { label: 'Limit Doldu', color: 'text-orange-400 bg-orange-400/10 border-orange-400/20' };
    return { label: 'Aktif', color: 'text-green-400 bg-green-400/10 border-green-400/20' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#001F3F] via-[#001529] to-black px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin-sefa3986" className="text-white/50 hover:text-white transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Tag className="w-8 h-8 text-[#00A9A5]" />
                Kampanya Kodları
              </h1>
              <p className="text-white/50 text-sm mt-1">Sosyal medya kampanya kodlarını yönetin</p>
            </div>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#00A9A5] hover:bg-[#008985] text-white font-semibold rounded-xl transition-colors"
          >
            <Plus className="w-5 h-5" />
            Yeni Kod
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 text-[#00A9A5] animate-spin" />
          </div>
        ) : codes.length === 0 ? (
          <div className="text-center py-20 text-white/40">
            <Tag className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>Henüz kampanya kodu yok</p>
          </div>
        ) : (
          <div className="space-y-3">
            {codes.map((code) => {
              const status = getStatus(code);
              return (
                <motion.div
                  key={code.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  {/* Code + info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-white font-bold text-lg tracking-widest font-mono">{code.code}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-white/50 text-sm mt-1">{code.description}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-white/40">
                      <span>
                        İndirim: <span className="text-[#00A9A5] font-semibold">
                          {code.discountType === 'percent' ? `%${code.discountValue}` : `₺${code.discountValue}`}
                        </span>
                      </span>
                      <span>
                        Kullanım: <span className="text-white/60">{code.currentUsage}/{code.maxUsage}</span>
                      </span>
                      <span>
                        Geçerlilik: <span className="text-white/60">{code.validFrom} → {code.validUntil}</span>
                      </span>
                    </div>
                  </div>

                  {/* Usage bar */}
                  <div className="w-32 hidden sm:block">
                    <div className="flex justify-between text-[10px] text-white/40 mb-1">
                      <span>Kullanım</span>
                      <span>{Math.round((code.currentUsage / code.maxUsage) * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#00A9A5] rounded-full transition-all"
                        style={{ width: `${Math.min(100, (code.currentUsage / code.maxUsage) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggle(code)}
                      title={code.isActive ? 'Pasife Al' : 'Aktife Al'}
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      {code.isActive
                        ? <ToggleRight className="w-5 h-5 text-green-400" />
                        : <ToggleLeft className="w-5 h-5 text-gray-500" />
                      }
                    </button>
                    <button
                      onClick={() => openEdit(code)}
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors text-blue-400"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(code)}
                      className="p-2 rounded-lg hover:bg-red-500/10 transition-colors text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#001529] border border-white/10 rounded-2xl w-full max-w-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white font-bold text-xl">
                {editingCode ? 'Kodu Düzenle' : 'Yeni Kampanya Kodu'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-white/40 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Code */}
              <div>
                <label className="text-white/60 text-sm mb-1 block">Kod</label>
                <input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="YAZA2025"
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#00A9A5]/60 font-mono tracking-widest text-lg uppercase"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-white/60 text-sm mb-1 block">Açıklama</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Yaz kampanyası"
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#00A9A5]/60"
                />
              </div>

              {/* Discount type + value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/60 text-sm mb-1 block">İndirim Tipi</label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value as 'percent' | 'amount' })}
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00A9A5]/60"
                  >
                    <option value="percent">Yüzde (%)</option>
                    <option value="amount">Sabit Tutar (₺)</option>
                  </select>
                </div>
                <div>
                  <label className="text-white/60 text-sm mb-1 block">
                    Değer {form.discountType === 'percent' ? '(%)' : '(₺)'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={form.discountType === 'percent' ? 100 : undefined}
                    value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })}
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00A9A5]/60"
                  />
                </div>
              </div>

              {/* Max usage */}
              <div>
                <label className="text-white/60 text-sm mb-1 block">Maksimum Kullanım Sayısı</label>
                <input
                  type="number"
                  min={1}
                  value={form.maxUsage}
                  onChange={(e) => setForm({ ...form, maxUsage: Number(e.target.value) })}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00A9A5]/60"
                />
              </div>

              {/* Validity dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/60 text-sm mb-1 block">Başlangıç</label>
                  <input
                    type="date"
                    value={form.validFrom}
                    onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00A9A5]/60"
                  />
                </div>
                <div>
                  <label className="text-white/60 text-sm mb-1 block">Bitiş</label>
                  <input
                    type="date"
                    value={form.validUntil}
                    onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00A9A5]/60"
                  />
                </div>
              </div>

              {/* Active toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setForm({ ...form, isActive: !form.isActive })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${form.isActive ? 'bg-[#00A9A5]' : 'bg-white/20'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.isActive ? 'left-7' : 'left-1'}`} />
                </div>
                <span className="text-white/70 text-sm">Aktif</span>
              </label>

              {error && (
                <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2">{error}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl border border-white/15 text-white/60 hover:text-white hover:border-white/30 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-[#00A9A5] hover:bg-[#008985] text-white font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editingCode ? 'Güncelle' : 'Oluştur'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
