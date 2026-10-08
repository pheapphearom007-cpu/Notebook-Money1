import React from 'react';
import appLogo from '../../assets/logo.png';

interface AppLogoProps {
  className?: string;
  imgClassName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'plain' | 'badge';
  alt?: string;
}

const sizeMap = {
  xs: { box: 'w-6 h-6 rounded-lg p-0.5', img: 'w-5 h-5' },
  sm: { box: 'w-8 h-8 rounded-lg p-1', img: 'w-6 h-6' },
  md: { box: 'w-9 h-9 sm:w-10 sm:h-10 rounded-xl p-1', img: 'w-7 h-7 sm:w-8 sm:h-8' },
  lg: { box: 'w-12 h-12 rounded-xl p-1.5', img: 'w-10 h-10' },
  xl: { box: 'w-16 h-16 sm:w-20 sm:h-20 rounded-2xl p-2.5', img: 'w-12 h-12 sm:w-16 sm:h-16' },
};

export const AppLogo: React.FC<AppLogoProps> = ({
  className = '',
  imgClassName = '',
  size = 'md',
  variant = 'badge',
  alt = 'សៀវភៅបញ្ជី',
}) => {
  const { box, img } = sizeMap[size];

  if (variant === 'plain') {
    return (
      <img
        src={appLogo}
        alt={alt}
        className={`${img} object-contain shrink-0 select-none pointer-events-none drop-shadow-xs ${imgClassName} ${className}`}
        loading="eager"
      />
    );
  }

  return (
    <div
      className={`${box} bg-card border border-border/80 shadow-xs flex items-center justify-center shrink-0 transition-transform ${className}`}
    >
      <img
        src={appLogo}
        alt={alt}
        className={`w-full h-full object-contain select-none pointer-events-none drop-shadow-xs ${imgClassName}`}
        loading="eager"
      />
    </div>
  );
};
