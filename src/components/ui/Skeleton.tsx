import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  animation?: 'pulse' | 'wave' | 'none';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  animation = 'pulse',
  width,
  height
}) => {
  const baseClasses = 'bg-gray-200';

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: ''
  };

  const variantClasses = {
    text: 'rounded',
    rectangular: 'rounded-md',
    circular: 'rounded-full'
  };

  const style: React.CSSProperties = {
    width: width || '100%',
    height: height || (variant === 'text' ? '1em' : '100%')
  };

  return (
    <div
      className={`${baseClasses} ${animationClasses[animation]} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
};

// Componente para News Card Skeleton
export const NewsCardSkeleton: React.FC = () => {
  return (
    <div className="rounded-lg overflow-hidden bg-white">
      <Skeleton height={200} />
      <div className="p-4">
        <Skeleton variant="text" height={24} className="mb-2" />
        <Skeleton variant="text" height={16} className="mb-2 w-3/4" />
        <Skeleton variant="text" height={16} className="w-1/2" />
      </div>
    </div>
  );
};

// Componente para Exhibition Card Skeleton
export const ExhibitionCardSkeleton: React.FC = () => {
  return (
    <div className="rounded-lg overflow-hidden bg-white">
      <Skeleton height={200} />
      <div className="p-4">
        <Skeleton variant="text" height={20} className="mb-2" />
        <Skeleton variant="text" height={16} className="mb-1 w-3/4" />
        <Skeleton variant="text" height={16} className="w-1/2" />
      </div>
    </div>
  );
};

// Componente para Hero Skeleton
export const HeroSkeleton: React.FC = () => {
  return (
    <div className="relative w-full h-screen">
      <Skeleton className="absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      <div className="absolute bottom-20 left-20 right-20">
        <Skeleton variant="text" height={48} className="mb-4 max-w-2xl" />
        <Skeleton variant="text" height={24} className="max-w-xl" />
      </div>
    </div>
  );
};

// Para agregar animación shimmer si se necesita
export const shimmerKeyframes = `
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}
`;