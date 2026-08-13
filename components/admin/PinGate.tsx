'use client';

import { useEffect, useRef, useState } from 'react';
import { Lock, Delete } from 'lucide-react';

const CORRECT_PIN = '3464';
const SESSION_KEY = 'admin_pin_unlocked';

interface PinGateProps {
  children: React.ReactNode;
}

export default function PinGate({ children }: PinGateProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === '1') {
      setUnlocked(true);
    } else {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, []);

  const handleDigit = (d: string) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 4) verify(next);
  };

  const handleDelete = () => setPin(p => p.slice(0, -1));

  const verify = (value: string) => {
    if (value === CORRECT_PIN) {
      sessionStorage.setItem(SESSION_KEY, '1');
      setUnlocked(true);
    } else {
      setShake(true);
      setTimeout(() => { setPin(''); setShake(false); inputRef.current?.focus(); }, 600);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key >= '0' && e.key <= '9') handleDigit(e.key);
    else if (e.key === 'Backspace') handleDelete();
  };

  if (unlocked) return <>{children}</>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#001F3F] via-[#001529] to-black flex items-center justify-center">
      <div
        className={`flex flex-col items-center gap-6 transition-all ${shake ? 'animate-shake' : ''}`}
        style={shake ? { animation: 'shake 0.4s ease-in-out' } : {}}
      >
        {/* İkon */}
        <div className="w-16 h-16 rounded-2xl bg-[#00A9A5]/10 border border-[#00A9A5]/30 flex items-center justify-center">
          <Lock className="w-7 h-7 text-[#00A9A5]" />
        </div>

        <div className="text-center">
          <h2 className="text-white font-bold text-lg">PIN Gerekli</h2>
          <p className="text-white/40 text-sm mt-1">Bu sayfaya erişmek için PIN girin</p>
        </div>

        {/* PIN dots */}
        <div className="flex gap-4">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                pin.length > i
                  ? 'bg-[#00A9A5] border-[#00A9A5]'
                  : shake
                  ? 'border-red-400'
                  : 'border-white/30'
              }`}
            />
          ))}
        </div>

        {/* Gizli input (klavye için) */}
        <input
          ref={inputRef}
          type="number"
          className="opacity-0 absolute w-0 h-0"
          onKeyDown={handleKeyDown}
          readOnly
        />

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3">
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((key, i) => {
            if (key === '') return <div key={i} />;
            return (
              <button
                key={i}
                onClick={() => key === '⌫' ? handleDelete() : handleDigit(key)}
                className={`w-16 h-16 rounded-2xl text-white font-semibold text-xl transition-all active:scale-95 ${
                  key === '⌫'
                    ? 'bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center'
                    : 'bg-white/8 hover:bg-white/15 border border-white/10'
                }`}
              >
                {key === '⌫' ? <Delete className="w-5 h-5 text-white/60" /> : key}
              </button>
            );
          })}
        </div>
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-8px); }
          40%       { transform: translateX(8px); }
          60%       { transform: translateX(-6px); }
          80%       { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
