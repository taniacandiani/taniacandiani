import React from 'react';

interface SectionProps {
  fullWidth?: boolean;
  indented?: boolean;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ fullWidth = false, indented = false, children }) => {
  return (
    <section
      className={`w-full ${indented ? 'px-4 sm:px-6 lg:px-8' : ''} ${fullWidth ? '' : ''}`}
    >
      <div className={`${fullWidth ? '' : 'max-w-7xl mx-auto'}`}>
        {children}
      </div>
    </section>
  );
};

export default Section; 