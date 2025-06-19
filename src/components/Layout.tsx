
import React from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import Header from './Header';
import BottomNavigation from './mobile/BottomNavigation';
import MobileSafeArea from './mobile/MobileSafeArea';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <Header />
          <main className="flex-1 pb-16 md:pb-0">
            <MobileSafeArea includeTop={false}>
              {children}
            </MobileSafeArea>
          </main>
        </SidebarInset>
        <BottomNavigation />
      </div>
    </SidebarProvider>
  );
};

export default Layout;
