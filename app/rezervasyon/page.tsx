'use client';

import { motion } from 'framer-motion';
import { Users, Anchor, Loader2, ArrowRight } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Boat, subscribeToBoats } from '@/lib/boatHelpers';
import { useRouter } from 'next/navigation';


export default function RezervasyonPage() {
  const [boats, setBoats] = useState<Boat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBoat, setSelectedBoat] = useState<string | null>(null);
  const router = useRouter();
  const continueButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Firestore'dan aktif tekneleri dinle
    const unsubscribe = subscribeToBoats((updatedBoats) => {
      // Sadece aktif tekneleri göster
      const activeBoats = updatedBoats.filter(boat => boat.isActive);
      setBoats(activeBoats);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);


  return (
    <main className="min-h-screen bg-gradient-to-b from-[#E8F4F8] via-[#D5E9F0] to-[#F5FAFB] pt-24 pb-16 px-4">
      {/* Yılbaşı Teması */}

      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-6xl mx-auto mb-12 text-center"
      >
        <h1 className="text-5xl md:text-6xl font-bold text-[#0D2847] mb-4">
          Tekne <span className="text-[#6B9BC3]">Seçimi</span>
        </h1>
        <p className="text-xl text-[#1B3A5C]/70">
          Size en uygun tekneyi seçin
        </p>
      </motion.div>

      {/* Loading State */}
      {loading ? (
        <div className="max-w-6xl mx-auto flex items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-[#6B9BC3] animate-spin" />
        </div>
      ) : boats.length === 0 ? (
        /* Empty State */
        <div className="max-w-6xl mx-auto text-center py-20">
          <Anchor className="w-16 h-16 text-[#1B3A5C]/40 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-[#0D2847] mb-2">Henüz Tekne Eklenmedi</h3>
          <p className="text-[#1B3A5C]/60">Admin panelden tekne ekleyebilirsiniz.</p>
        </div>
      ) : (
        /* Boats Grid - 2x2 (mobil ve desktop) */
        <div className="max-w-6xl mx-auto grid grid-cols-2 gap-4 md:gap-8">
        {boats.map((boat, index) => (
          <motion.div
            key={boat.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            onClick={() => {
              setSelectedBoat(boat.id);
              // Tekne seçildiğinde devam et butonuna scroll yap
              setTimeout(() => {
                continueButtonRef.current?.scrollIntoView({ 
                  behavior: 'smooth', 
                  block: 'center' 
                });
              }, 300);
            }}
            className={`group relative cursor-pointer bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden border-2 transition-all duration-300 shadow-lg ${
              selectedBoat === boat.id
                ? 'border-[#6B9BC3] shadow-2xl shadow-[#6B9BC3]/30 scale-[1.02]'
                : 'border-[#6B9BC3]/20 hover:border-[#6B9BC3]/50'
            }`}
          >
            {/* Image */}
            <div className="relative h-56 overflow-hidden">
              <img
                src={boat.imageUrl || 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?q=80&w=2070&auto=format&fit=crop'}
                alt={boat.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              {/* Selected Badge */}
              {selectedBoat === boat.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-4 left-4 bg-[#6B9BC3] rounded-full p-2 shadow-lg z-10"
                >
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              )}

              {/* Ribbon (Çapraz Bant) */}
              {boat.isRibbonActive && boat.ribbonText && (
                <div className="absolute top-0 right-0 w-56 h-56 overflow-hidden z-20 pointer-events-none">
                  <div className={`
                    absolute top-10 -right-20 transform rotate-45 w-80 h-8 flex items-center shadow-lg
                    ${boat.ribbonColor === 'red' ? 'bg-red-600' : 
                      boat.ribbonColor === 'blue' ? 'bg-blue-600' : 
                      boat.ribbonColor === 'green' ? 'bg-green-600' :
                      boat.ribbonColor === 'yellow' ? 'bg-yellow-500 text-black' : 
                      boat.ribbonColor === 'purple' ? 'bg-purple-600' :
                      boat.ribbonColor === 'black' ? 'bg-black' : 'bg-red-600'}
                  `}>
                    <motion.div
                      className="flex"
                      animate={{ x: "-50%" }}
                      transition={{ 
                        repeat: Infinity, 
                        duration: 12, 
                        ease: "linear" 
                      }}
                      style={{ color: boat.ribbonColor === 'yellow' ? 'black' : 'white' }}
                    >
                      {/* Metni defalarca tekrarla ki boşluk kalmasın ve sonsuz döngü oluşsun */}
                      {[1, 2, 3, 4].map((i) => (
                        <span key={i} className="whitespace-nowrap font-bold text-xs uppercase px-4 inline-block">
                          {boat.ribbonText}
                        </span>
                      ))}
                    </motion.div>
                  </div>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Title */}
              <div className="flex items-center gap-3">
                <Anchor className="w-6 h-6 text-[#6B9BC3]" />
                <h3 className="text-2xl font-bold text-[#0D2847]">
                  {boat.name}
                </h3>
              </div>

              {/* Description */}
              <p className="text-[#1B3A5C]/70 text-sm">
                {boat.description}
              </p>

              {/* Capacity */}
              <div className="flex items-center gap-2 text-[#1B3A5C]/80">
                <Users className="w-5 h-5 text-[#6B9BC3]" />
                <span className="font-medium">{boat.capacity} Kişilik Kapasite</span>
              </div>
            </div>

            {/* Hover Glow */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-r from-[#6B9BC3]/5 to-[#5B8DB8]/5" />
            </div>
          </motion.div>
        ))}
        </div>
      )}

      {/* Continue Button */}
      {selectedBoat && (
        <motion.div
          ref={continueButtonRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto mt-16 mb-8 flex justify-center"
        >
          <div className="relative">
            {/* Outer Glow Ring */}
            <div className="absolute -inset-2 bg-gradient-to-r from-[#8B3A3A] via-[#A04848] to-[#8B3A3A] rounded-full blur-lg opacity-75 group-hover:opacity-100 animate-pulse" />
            
            <motion.button
              onClick={() => {
                // Seçili tekneyi localStorage'a kaydet
                const selectedBoatData = boats.find(b => b.id === selectedBoat);
                if (selectedBoatData) {
                  localStorage.setItem('selectedBoat', JSON.stringify(selectedBoatData));
                }
                window.location.href = '/rezervasyon/step-two'; // Tur tipi seçimi
              }}
              whileHover={{ scale: 1.08, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="group relative bg-gradient-to-r from-[#8B3A3A] via-[#A04848] to-[#8B3A3A] text-white font-black text-xl py-6 px-20 rounded-full shadow-2xl shadow-[#8B3A3A]/60 transition-all duration-500 overflow-hidden border-2 border-white/20"
            >
              {/* Shine Effect */}
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              
              {/* Animated Background */}
              <span className="absolute inset-0 bg-gradient-to-r from-[#A04848] via-[#8B3A3A] to-[#A04848] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Button Content */}
              <span className="relative flex items-center gap-4 drop-shadow-lg">
                <span className="text-2xl tracking-wide">DEVAM ET</span>
                <ArrowRight className="w-7 h-7 group-hover:translate-x-3 transition-transform duration-300 drop-shadow-md" />
              </span>

              {/* Inner Glow */}
              <span className="absolute inset-0 rounded-full opacity-50 group-hover:opacity-100 blur-md bg-white/10 transition-opacity duration-500" />
            </motion.button>
          </div>
        </motion.div>
      )}
      </main>
  );
}
