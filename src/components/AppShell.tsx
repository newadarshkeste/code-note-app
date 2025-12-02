'use client';

import { NotesProvider } from '@/context/NotesContext';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TopicSidebar } from '@/components/TopicSidebar';
import { NoteDisplay } from '@/components/NoteDisplay';
import { WebviewPanel } from '@/components/WebviewPanel';
import { Sidebar, SidebarInset } from '@/components/ui/sidebar';

export function AppShell() {
  return (
    <NotesProvider>
      <SidebarProvider>
        <div className="flex h-screen bg-background">
          <Sidebar>
            <TopicSidebar />
          </Sidebar>
          <div className="flex flex-1 min-w-0">
            <SidebarInset className="flex-1">
              <NoteDisplay />
            </SidebarInset>
            <WebviewPanel />
          </div>
        </div>
      </SidebarProvider>
    </NotesProvider>
  );
}
