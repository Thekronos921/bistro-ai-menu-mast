
import React from 'react';
import { Link } from 'react-router-dom';
import { ChefHat, LogOut, Settings, User } from 'lucide-react';
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
import { useAuth } from '@/contexts/AuthContext';

const Header = () => {
  const { user, userProfile, signOut } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <Link to="/" className="flex items-center space-x-2">
            <ChefHat className="h-8 w-8 text-orange-600" />
            <span className="text-xl font-bold text-gray-900">Bistro AI</span>
          </Link>

          {/* User Menu */}
          {user && userProfile ? (
            <div className="flex items-center space-x-4">
              {/* Restaurant Info */}
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-gray-900">
                  {userProfile.restaurant?.name}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {userProfile.restaurant?.type}
                </p>
              </div>

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-orange-100 text-orange-700">
                        {getInitials(userProfile.full_name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {userProfile.full_name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {userProfile.email}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground capitalize">
                        {userProfile.role}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="md:hidden">
                    <div className="flex flex-col">
                      <span className="font-medium">{userProfile.restaurant?.name}</span>
                      <span className="text-xs text-gray-500 capitalize">
                        {userProfile.restaurant?.type}
                      </span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="md:hidden" />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profilo</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Impostazioni</span>
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
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost">Accedi</Button>
              </Link>
              <Link to="/register">
                <Button>Registrati</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
