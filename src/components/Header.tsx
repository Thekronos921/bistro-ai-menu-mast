
import React from 'react';
import { ChefHat, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

const Header = () => {
  const { user, userProfile, signOut, loading } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <header className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <ChefHat className="h-6 w-6 text-orange-600" />
            <span className="font-bold text-lg">Bistro AI</span>
          </div>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-600"></div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left side - Sidebar trigger + Brand (mobile) */}
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          
          {/* Brand shown only on mobile when sidebar is collapsed */}
          <div className="flex items-center gap-2 md:hidden">
            <ChefHat className="h-6 w-6 text-orange-600" />
            <span className="font-bold text-lg">Bistro AI</span>
          </div>
        </div>

        {/* Right side - User menu */}
        {user ? (
          <div className="flex items-center gap-3">
            {/* Restaurant info - hidden on small screens */}
            {userProfile?.restaurant && (
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900 truncate max-w-32">
                  {userProfile.restaurant.name}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {userProfile.restaurant.type}
                </p>
              </div>
            )}

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-orange-100 text-orange-700 text-xs">
                      {userProfile?.full_name ? getInitials(userProfile.full_name) : user.email?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {userProfile?.full_name || user.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userProfile?.email || user.email}
                    </p>
                    {userProfile?.role && (
                      <p className="text-xs leading-none text-muted-foreground capitalize">
                        {userProfile.role}
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                
                {/* Restaurant info for small screens */}
                {userProfile?.restaurant && (
                  <>
                    <DropdownMenuSeparator className="sm:hidden" />
                    <DropdownMenuItem className="sm:hidden">
                      <div className="flex flex-col">
                        <span className="font-medium">{userProfile.restaurant.name}</span>
                        <span className="text-xs text-gray-500 capitalize">
                          {userProfile.restaurant.type}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  </>
                )}
                
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="w-full">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profilo & Impostazioni</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Disconnetti</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm">Accedi</Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Registrati</Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
