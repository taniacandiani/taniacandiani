'use client';

import { useLanguage } from '@/contexts/LanguageContext';

interface LanguageSelectorProps {
  className?: string;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ className = '' }) => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={toggleLanguage}
        className={`text-sm font-medium transition-colors duration-200 ${
          language === 'es'
            ? 'text-gray-400 hover:text-gray-600'
            : 'text-black hover:text-gray-800'
        }`}
      >
        ES
      </button>
      <span className="text-gray-400">|</span>
      <button
        onClick={toggleLanguage}
        className={`text-sm font-medium transition-colors duration-200 ${
          language === 'en'
            ? 'text-gray-400 hover:text-gray-600'
            : 'text-black hover:text-gray-800'
        }`}
      >
        EN
      </button>
    </div>
  );
};

export default LanguageSelector; 