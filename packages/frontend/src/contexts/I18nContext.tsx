import React, { createContext, useContext, useState } from 'react';
import { dictionaries, Locale, Dictionary } from '@skillmatrix/shared';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem('skillmatrix_locale') as Locale;
    if (saved && (saved === 'ja' || saved === 'en')) return saved;
    // ブラウザの初期言語
    return navigator.language.startsWith('ja') ? 'ja' : 'en';
  });

  const setLocale = (newLocale: Locale) => {
    localStorage.setItem('skillmatrix_locale', newLocale);
    setLocaleState(newLocale);
  };

  const t = dictionaries[locale];

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within I18nProvider');
  return context;
};
