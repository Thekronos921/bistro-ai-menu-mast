
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Package, ChefHat, BarChart3, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/ui/sidebar';

const bottomNavItems = [
  {
    icon: Home,
    label: 'Dashboard',
    route: '/',
    key: 'dashboard'
  },
  {
    icon: Package,
    label: 'Inventario',
    route: '/inventory',
    key: 'inventory'
  },
  {
    icon: ChefHat,
    label: 'Ricette',
    route: '/recipes',
    key: 'recipes'
  },
  {
    icon: BarChart3,
    label: 'Analytics',
    route: '/food-cost',
    key: 'analytics'
  },
];

const BottomNavigation = () => {
  const location = useLocation();
  const { toggleSidebar } = useSidebar();

  const isActive = (route: string) => {
    if (route === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(route);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-stone-200 safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {bottomNavItems.map((item) => (
          <Link
            key={item.key}
            to={item.route}
            className={cn(
              "flex flex-col items-center justify-center min-w-[44px] min-h-[44px] px-2 py-1 rounded-lg transition-colors",
              isActive(item.route)
                ? "text-orange-600 bg-orange-50"
                : "text-slate-600 hover:text-orange-600 hover:bg-orange-50"
            )}
          >
            <item.icon className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium truncate">{item.label}</span>
          </Link>
        ))}
        
        {/* Menu trigger per aprire sidebar */}
        <button
          onClick={toggleSidebar}
          className={cn(
            "flex flex-col items-center justify-center min-w-[44px] min-h-[44px] px-2 py-1 rounded-lg transition-colors",
            "text-slate-600 hover:text-orange-600 hover:bg-orange-50"
          )}
        >
          <Menu className="w-5 h-5 mb-1" />
          <span className="text-xs font-medium">Menu</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNavigation;
