
import React from 'react';
import { cn } from '@/lib/utils';

interface MobileSafeAreaProps {
  children: React.ReactNode;
  className?: string;
  includeBottom?: boolean;
  includeTop?: boolean;
  background?: 'default' | 'gradient' | 'white';
}

const MobileSafeArea: React.FC<MobileSafeAreaProps> = ({ 
  children, 
  className,
  includeBottom = true,
  includeTop = true,
  background = 'default'
}) => {
  const backgroundClasses = {
    default: 'bg-slate-50',
    gradient: 'bg-gradient-to-br from-slate-50 via-white to-stone-50',
    white: 'bg-white'
  };

  return (
    <div className={cn(
      "min-h-screen w-full max-w-full overflow-x-hidden",
      backgroundClasses[background],
      includeTop && "pt-safe-top",
      includeBottom && "pb-safe-bottom",
      className
    )}>
      {children}
    </div>
  );
};

export default MobileSafeArea;
