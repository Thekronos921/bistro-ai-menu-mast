
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface TouchOptimizedCardProps {
  children: React.ReactNode;
  className?: string;
  onTap?: () => void;
  swipeActions?: {
    left?: { icon: React.ReactNode; action: () => void; color?: string };
    right?: { icon: React.ReactNode; action: () => void; color?: string };
  };
}

const TouchOptimizedCard: React.FC<TouchOptimizedCardProps> = ({
  children,
  className,
  onTap,
  swipeActions
}) => {
  return (
    <Card 
      className={cn(
        "transition-all duration-200 active:scale-95 touch-manipulation",
        onTap && "cursor-pointer hover:shadow-md",
        className
      )}
      onClick={onTap}
    >
      <CardContent className="p-4">
        {children}
      </CardContent>
    </Card>
  );
};

export default TouchOptimizedCard;
