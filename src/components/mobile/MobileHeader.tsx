
import React from 'react';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: {
    icon?: React.ReactNode;
    onClick: () => void;
    label?: string;
  };
  className?: string;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  subtitle,
  onBack,
  rightAction,
  className
}) => {
  return (
    <header className={cn(
      "sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-stone-200",
      "md:hidden", // Solo su mobile
      className
    )}>
      <div className="flex items-center justify-between px-3 py-3">
        {/* Left side */}
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="min-w-[44px] min-h-[44px] p-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold text-slate-800 truncate">{title}</h1>
            {subtitle && (
              <p className="text-sm text-slate-500 truncate">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right action */}
        {rightAction && (
          <Button
            variant="ghost"
            size="sm"
            onClick={rightAction.onClick}
            className="min-w-[44px] min-h-[44px] p-0 flex-shrink-0"
            aria-label={rightAction.label}
          >
            {rightAction.icon || <MoreVertical className="w-5 h-5" />}
          </Button>
        )}
      </div>
    </header>
  );
};

export default MobileHeader;
