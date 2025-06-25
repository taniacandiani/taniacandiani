'use client';

import { useState } from 'react';

interface LanguageSelectorProps {
  className?: string;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ className = '' }) => {
  const [currentLanguage, setCurrentLanguage] = useState<'es' | 'en'>('es');

  const handleLanguageChange = (lang: 'es' | 'en') => {
    setCurrentLanguage(lang);
    // Here you would implement language switching logic
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button 
        onClick={() => handleLanguageChange('es')}
        className={`hover:text-gray-600 ${currentLanguage === 'es' ? 'font-bold' : ''}`}
      >
        Español
      </button>
      <span className="text-gray-400">|</span>
      <button 
        onClick={() => handleLanguageChange('en')}
        className={`hover:text-gray-600 ${currentLanguage === 'en' ? 'font-bold' : ''}`}
      >
        English
      </button>
    </div>
  );
};

export default LanguageSelector; 