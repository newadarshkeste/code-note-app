'use client';

import { NotesProvider } from '@/context/NotesContext';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TopicSidebar } from '@/components/TopicSidebar';
import { NoteDisplay } from '@/components/NoteDisplay';
import { Sidebar, SidebarInset } from '@/components/ui/sidebar';

export function AppShell() {
  return (
    <NotesProvider>
      <SidebarProvider>
        <div className="flex h-screen bg-background">
          <Sidebar>
            <TopicSidebar />
          </Sidebar>
          <SidebarInset>
            <NoteDisplay />
          </SidebarInset>
        </div>
      </SidebarProvider>
    </NotesProvider>
  );
}
