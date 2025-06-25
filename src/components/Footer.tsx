import React from 'react';
import Section from '@/components/Section';
import Navigation from '@/components/ui/Navigation';
import LanguageSelector from '@/components/ui/LanguageSelector';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200">
      <Section fullWidth indented>
        <div className="py-5 flex justify-between items-center">
          <div className="text-2xl font-medium tracking-widest">
            TANIA CANDIANI <span className="text-lg">©</span>
          </div>
          
          <div className="flex-1 flex justify-center">
            <Navigation className="mx-auto" />
          </div>
          
          <div>
            <LanguageSelector />
          </div>
        </div>
      </Section>
    </footer>
  );
};

export default Footer; 