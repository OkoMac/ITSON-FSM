import React from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-glass-black to-glass-black-light">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="lg:ml-[240px] min-h-screen flex flex-col">
        {/* Header */}
        <Header />

        {/* Page content */}
        <main className="flex-1 p-16 md:p-24 lg:p-32 pb-24 md:pb-32 lg:pb-32">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>

        {/* Mobile bottom navigation */}
        <div className="lg:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  );
};
