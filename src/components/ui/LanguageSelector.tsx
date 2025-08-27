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
    <div className={`flex items-center ${className}`}>
      <button 
        onClick={() => handleLanguageChange('en')}
        className="hover:text-gray-600 transition-colors duration-200"
      >
        EN
      </button>
    </div>
  );
};

export default LanguageSelector; 