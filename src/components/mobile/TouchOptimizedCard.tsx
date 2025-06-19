
import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SwipeAction {
  icon: React.ReactNode;
  action: () => void;
  color?: string;
}

interface TouchOptimizedCardProps {
  children: React.ReactNode;
  className?: string;
  onTap?: () => void;
  swipeActions?: {
    left?: SwipeAction;
    right?: SwipeAction;
  };
}

const TouchOptimizedCard: React.FC<TouchOptimizedCardProps> = ({
  children,
  className,
  onTap,
  swipeActions
}) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwipeActive, setIsSwipeActive] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!swipeActions) return;
    startX.current = e.touches[0].clientX;
    setIsSwipeActive(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swipeActions || !isSwipeActive) return;
    
    currentX.current = e.touches[0].clientX;
    const deltaX = currentX.current - startX.current;
    
    // Limita il movimento swipe
    const maxSwipe = 80;
    const clampedDelta = Math.max(-maxSwipe, Math.min(maxSwipe, deltaX));
    setSwipeOffset(clampedDelta);
  };

  const handleTouchEnd = () => {
    if (!swipeActions || !isSwipeActive) return;
    
    const threshold = 40;
    
    if (swipeOffset > threshold && swipeActions.left) {
      swipeActions.left.action();
    } else if (swipeOffset < -threshold && swipeActions.right) {
      swipeActions.right.action();
    }
    
    setSwipeOffset(0);
    setIsSwipeActive(false);
  };

  const handleClick = () => {
    if (Math.abs(swipeOffset) < 10 && onTap) {
      onTap();
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Azioni swipe di sfondo */}
      {swipeActions && (
        <>
          {/* Azione sinistra */}
          {swipeActions.left && (
            <div 
              className={cn(
                "absolute left-0 top-0 h-full w-20 flex items-center justify-center",
                swipeActions.left.color || "bg-blue-500",
                "transform transition-transform duration-200"
              )}
              style={{
                transform: swipeOffset > 0 ? 'translateX(0)' : 'translateX(-100%)'
              }}
            >
              <div className="text-white">
                {swipeActions.left.icon}
              </div>
            </div>
          )}
          
          {/* Azione destra */}
          {swipeActions.right && (
            <div 
              className={cn(
                "absolute right-0 top-0 h-full w-20 flex items-center justify-center",
                swipeActions.right.color || "bg-red-500",
                "transform transition-transform duration-200"
              )}
              style={{
                transform: swipeOffset < 0 ? 'translateX(0)' : 'translateX(100%)'
              }}
            >
              <div className="text-white">
                {swipeActions.right.icon}
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Card principale */}
      <Card 
        className={cn(
          "transition-all duration-200 touch-manipulation relative z-10",
          onTap && "cursor-pointer hover:shadow-md",
          className
        )}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: isSwipeActive ? 'none' : 'transform 0.2s ease-out'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
      >
        <CardContent className="p-4">
          {children}
        </CardContent>
      </Card>
    </div>
  );
};

export default TouchOptimizedCard;
