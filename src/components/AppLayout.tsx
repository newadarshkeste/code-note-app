'use client';

import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { NoteDisplay } from '@/components/NoteDisplay';
import { StudyToolsPanel } from '@/components/StudyToolsPanel';
import { DailyQuoteModal } from './DailyQuoteModal';
import { Header } from './Header';

export function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  return (
    <div className="h-dvh w-screen flex flex-col bg-background overflow-hidden">
      <Header 
        isSidebarOpen={isSidebarOpen} 
        toggleSidebar={() => setIsSidebarOpen(v => !v)} 
      />
      <div className="flex flex-1 overflow-hidden">
        {isSidebarOpen && (
          <Sidebar />
        )}
        <main className="flex-1 relative">
          <NoteDisplay isMobile={false} />
        </main>
      </div>
      <StudyToolsPanel />
      <DailyQuoteModal />
    </div>
  );
}
