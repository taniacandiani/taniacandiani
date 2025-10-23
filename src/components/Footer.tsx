import React from 'react';
import Section from '@/components/Section';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200">
      <Section fullWidth indented>
        <div className="py-5 flex justify-center items-center">
          <div className="text-xl sm:text-2xl font-medium tracking-widest text-center">
            TANIA CANDIANI <span className="text-lg">©</span>
          </div>
        </div>
      </Section>
    </footer>
  );
};

export default Footer; 