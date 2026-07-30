'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'tr' | 'en';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

import { translations } from '@/lib/translations';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('tr');

  useEffect(() => {
    const saved = localStorage.getItem('language') as Language;
    if (saved === 'tr' || saved === 'en') {
      setLanguage(saved);
    }
  }, []);

  const toggleLanguage = () => {
    const next: Language = language === 'tr' ? 'en' : 'tr';
    setLanguage(next);
    localStorage.setItem('language', next);
  };

  const t = (key: string): string => {
    const lang = translations[language] as Record<string, string>;
    return lang[key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
