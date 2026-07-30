'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Lock, Loader2, Ship } from 'lucide-react';

const PIN = '3464';
const SESSION_KEY = 'tamay_auth';

export default function TamayLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [shaking, setShaking] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored === PIN) {
      setAuthed(true);
    }
    setChecking(false);
  }, []);

  const handleSubmit = () => {
    if (pin === PIN) {
      sessionStorage.setItem(SESSION_KEY, PIN);
      setAuthed(true);
      setError(false);
    } else {
      setError(true);
      setShaking(true);
      setPin('');
      setTimeout(() => setShaking(false), 500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#001F3F] via-[#001529] to-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00A9A5] animate-spin" />
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#001F3F] via-[#001529] to-black flex items-center justify-center px-4">
        <div className={`w-full max-w-sm ${shaking ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#00A9A5]/20 border border-[#00A9A5]/30 flex items-center justify-center mx-auto mb-5">
              <Ship className="w-8 h-8 text-[#00A9A5]" />
            </div>
            <h1 className="text-white font-bold text-xl mb-1">Balık Sefası</h1>
            <p className="text-white/40 text-sm mb-8">Personel Paneli — PIN girin</p>

            <div className="relative mb-4">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, '').slice(0, 4));
                  setError(false);
                }}
                onKeyDown={handleKeyDown}
                placeholder="• • • •"
                className={`w-full bg-white/5 border rounded-2xl pl-12 pr-4 py-4 text-white text-center text-2xl tracking-[0.5em] placeholder-white/20 focus:outline-none transition-colors ${
                  error ? 'border-red-500/60 focus:border-red-500' : 'border-white/15 focus:border-[#00A9A5]/60'
                }`}
                autoFocus
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm mb-4">Yanlış PIN, tekrar deneyin</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={pin.length !== 4}
              className="w-full py-4 rounded-2xl bg-[#00A9A5] hover:bg-[#008985] disabled:opacity-40 text-white font-semibold transition-colors"
            >
              Giriş Yap
            </button>
          </div>
        </div>

        <style jsx global>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-8px); }
            40% { transform: translateX(8px); }
            60% { transform: translateX(-6px); }
            80% { transform: translateX(6px); }
          }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
}
