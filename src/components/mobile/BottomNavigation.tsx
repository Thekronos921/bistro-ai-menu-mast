
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ChefHat, BarChart3, Package, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

const BottomNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  const navItems = [
    {
      id: 'dashboard',
      icon: Home,
      label: 'Dashboard',
      path: '/',
    },
    {
      id: 'recipes',
      icon: ChefHat,
      label: 'Ricette',
      path: '/mobile/recipes',
    },
    {
      id: 'analytics',
      icon: BarChart3,
      label: 'Analytics',
      path: '/mobile/food-cost',
    },
    {
      id: 'inventory',
      icon: Package,
      label: 'Magazzino',
      path: '/inventory',
    },
    {
      id: 'settings',
      icon: Settings,
      label: 'Impostazioni',
      path: '/configuration',
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 safe-area-bottom">
      <div className="grid grid-cols-5 gap-1 p-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center space-y-1 h-auto py-2 px-1 ${
                isActive 
                  ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' 
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-orange-600' : 'text-slate-500'}`} />
              <span className={`text-xs font-medium ${isActive ? 'text-orange-600' : 'text-slate-600'}`}>
                {item.label}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;
