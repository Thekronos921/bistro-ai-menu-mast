
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import MobileSafeArea from './MobileSafeArea';
import BottomNavigation from './BottomNavigation';

interface MobilePageWrapperProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  backUrl?: string;
  headerActions?: React.ReactNode;
  background?: 'default' | 'gradient' | 'white';
  icon?: React.ReactNode;
  className?: string;
}

const MobilePageWrapper: React.FC<MobilePageWrapperProps> = ({
  children,
  title,
  subtitle,
  backUrl = '/',
  headerActions,
  background = 'gradient',
  icon,
  className
}) => {
  return (
    <MobileSafeArea background={background} className={className}>
      {/* Header ultra-compatto fullscreen */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-stone-200 sticky top-0 z-50 w-full">
        <div className="px-2 py-2 w-full max-w-full">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <Link to={backUrl} className="p-1 hover:bg-stone-100 rounded-lg transition-colors flex-shrink-0">
                <ArrowLeft className="w-4 h-4 text-slate-600" />
              </Link>
              
              {icon && (
                <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                  {icon}
                </div>
              )}
              
              <div className="min-w-0 flex-1">
                <h1 className="text-sm font-bold text-slate-800 truncate leading-tight">{title}</h1>
                {subtitle && (
                  <p className="text-xs text-slate-500 truncate leading-tight">{subtitle}</p>
                )}
              </div>
            </div>
            
            {headerActions && (
              <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                {headerActions}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Content fullscreen */}
      <main className="flex-1 pb-16 w-full max-w-full">
        {children}
      </main>

      <BottomNavigation />
    </MobileSafeArea>
  );
};

export default MobilePageWrapper;
