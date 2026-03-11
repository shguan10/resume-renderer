import React, { useState } from 'react';
import { AppHeader } from '@/app/components/AppHeader';
import { AppSidebar, AppTab } from '@/app/components/AppSidebar';
import { Toaster } from 'sonner';

interface AppLayoutProps {
  title: string;
  subtitle?: string | undefined;
  onFeedback: () => void;
  currentTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  children: React.ReactNode;
}

/**
 * AppLayout is the top-level shell for authenticated views.
 * It composes the AppHeader and AppSidebar around a scrollable content slot.
 */
export function AppLayout({
  title,
  subtitle,
  onFeedback,
  currentTab,
  onTabChange,
  children,
}: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen w-full bg-background flex flex-col overflow-hidden font-sans">
      <AppHeader
        title={title}
        subtitle={subtitle}
        onFeedback={onFeedback}
        onMenuOpen={() => setSidebarOpen(true)}
      />

      <Toaster position="bottom-center" richColors closeButton duration={1000} />

      {/* Main content slot */}
      <main className="flex-1 overflow-hidden relative">
        {children}
      </main>

      <AppSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentTab={currentTab}
        onTabChange={onTabChange}
      />
    </div>
  );
}
