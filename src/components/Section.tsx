import React, { memo } from 'react';
import { SectionProps } from '@/types';

const Section: React.FC<SectionProps> = ({ 
  fullWidth = false, 
  indented = false, 
  className = '',
  children,
  as: Element = 'section'
}) => {
  const paddingClass = indented ? 'px-4 sm:px-6 lg:px-8' : '';
  const containerClass = fullWidth ? '' : 'max-w-7xl mx-auto';
  
  return (
    <Element className={`w-full ${paddingClass} ${className}`.trim()}>
      <div className={containerClass}>
        {children}
      </div>
    </Element>
  );
};

export default memo(Section); 