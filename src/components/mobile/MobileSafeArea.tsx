
import React from 'react';
import { cn } from '@/lib/utils';

interface MobileSafeAreaProps {
  children: React.ReactNode;
  className?: string;
  includeBottom?: boolean;
  includeTop?: boolean;
}

const MobileSafeArea: React.FC<MobileSafeAreaProps> = ({ 
  children, 
  className,
  includeBottom = true,
  includeTop = true 
}) => {
  return (
    <div className={cn(
      includeTop && "pt-safe-top",
      includeBottom && "pb-safe-bottom",
      className
    )}>
      {children}
    </div>
  );
};

export default MobileSafeArea;
