'use client';

import React from 'react';
import { TopicSidebar } from '@/components/TopicSidebar';
import { NoteList } from '@/components/NoteList';
import { NoteDisplay } from '@/components/NoteDisplay';
import { AiAssistantPanel } from '@/components/AiAssistantPanel';
import { cn } from '@/lib/utils';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

export function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  return (
    <div className="h-screen w-screen flex text-foreground bg-background font-body overflow-hidden">
        <TopicSidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(v => !v)} />
        
        <div className={cn(
          "flex-shrink-0 bg-card border-r transition-all duration-300 ease-in-out",
          isSidebarOpen ? 'w-[260px]' : 'w-0 opacity-0'
        )}>
          <NoteList />
        </div>
        
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          <ResizablePanel defaultSize={65} minSize={30}>
            <NoteDisplay 
              isSidebarOpen={isSidebarOpen} 
              toggleSidebar={() => setIsSidebarOpen(v => !v)} 
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={35} minSize={25}>
            <AiAssistantPanel />
          </ResizablePanel>
        </ResizablePanelGroup>
    </div>
  );
}
