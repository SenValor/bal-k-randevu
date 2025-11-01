'use client';

import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

interface TimeSlotSectionProps {
  selectedTime: string | null;
  onTimeSelect: (time: string) => void;
}

// Mock data - ileride Firebase'den gelecek
const timeSlots = [
  { time: '09:00 - 13:00', fullness: 0.2, available: true },
  { time: '10:00 - 14:00', fullness: 0.5, available: true },
  { time: '14:00 - 18:00', fullness: 0.8, available: true },
  { time: '15:00 - 19:00', fullness: 1.0, available: false },
  { time: '17:00 - 21:00', fullness: 0.4, available: true },
  { time: '18:00 - 22:00', fullness: 0.6, available: true },
];

export default function TimeSlotSection({ selectedTime, onTimeSelect }: TimeSlotSectionProps) {
  return (
    <section className="mb-8">
      <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6 md:p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Clock className="w-6 h-6 text-[#00A9A5]" />
          <h2 className="text-2xl font-bold text-white">Uygun Saatler</h2>
        </div>

        {/* Time Slots Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {timeSlots.map((slot, index) => {
            const isSelected = selectedTime === slot.time;
            const isDisabled = !slot.available;

            return (
              <motion.button
                key={slot.time}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, type: 'spring', stiffness: 120, damping: 15 }}
                whileHover={!isDisabled ? { scale: 1.05 } : {}}
                whileTap={!isDisabled ? { scale: 0.95 } : {}}
                onClick={() => !isDisabled && onTimeSelect(slot.time)}
                disabled={isDisabled}
                className={`
                  relative p-5 rounded-2xl border-2 transition-all duration-300
                  ${isSelected
                    ? 'bg-[#00A9A5]/20 border-[#00A9A5] shadow-lg shadow-[#00A9A5]/30'
                    : isDisabled
                    ? 'bg-red-500/10 border-red-500/30 opacity-50 cursor-not-allowed'
                    : 'bg-white/5 border-white/10 hover:border-[#00A9A5]/50 hover:bg-white/10'
                  }
                `}
              >
                {/* Glow Effect for Selected */}
                {isSelected && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl bg-[#00A9A5]/10"
                    animate={{
                      opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                )}

                <div className="relative z-10">
                  {/* Time */}
                  <div className={`text-lg font-bold mb-3 ${isDisabled ? 'text-red-400' : 'text-white'}`}>
                    {slot.time}
                  </div>

                  {/* Fullness Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/60">Doluluk</span>
                      <span className={`font-semibold ${
                        isDisabled ? 'text-red-400' : 'text-[#00A9A5]'
                      }`}>
                        {Math.round(slot.fullness * 100)}%
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${slot.fullness * 100}%` }}
                        transition={{ duration: 1, delay: index * 0.1, ease: 'easeOut' }}
                        className={`h-full rounded-full ${
                          slot.fullness >= 1
                            ? 'bg-red-500'
                            : slot.fullness >= 0.7
                            ? 'bg-yellow-500'
                            : 'bg-[#00A9A5]'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Status Badge */}
                  {isDisabled && (
                    <div className="mt-2 text-xs text-red-400 font-medium">
                      Dolu
                    </div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
