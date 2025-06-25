import React from 'react';

interface SectionProps {
  fullWidth?: boolean;
  indented?: boolean;
  className?: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ 
  fullWidth = false, 
  indented = false, 
  className = '',
  children 
}) => {
  const paddingClass = indented ? 'px-4 sm:px-6 lg:px-8' : '';
  const containerClass = fullWidth ? '' : 'max-w-7xl mx-auto';
  
  return (
    <section className={`w-full ${paddingClass} ${className}`}>
      <div className={containerClass}>
        {children}
      </div>
    </section>
  );
};

export default Section; 