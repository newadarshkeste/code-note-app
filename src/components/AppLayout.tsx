
'use client';

import { TopicSidebar } from '@/components/TopicSidebar';
import { NoteList } from '@/components/NoteList';
import { NoteDisplay } from '@/components/NoteDisplay';
import { AiAssistantPanel } from '@/components/AiAssistantPanel';
import { StudyToolsPanel } from '@/components/StudyToolsPanel';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import React, { useState } from 'react';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

function DesktopLayout() {
  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="hidden lg:block min-w-[240px]">
        <TopicSidebar />
      </ResizablePanel>
      <ResizableHandle withHandle className="hidden lg:flex" />
      <ResizablePanel defaultSize={22} minSize={18} maxSize={35} className="hidden md:block min-w-[260px]">
        <NoteList />
      </ResizablePanel>
      <ResizableHandle withHandle className="hidden md:flex" />
      <ResizablePanel defaultSize={58} minSize={30}>
          <ResizablePanelGroup direction="horizontal">
              <ResizablePanel defaultSize={65} minSize={40}>
                  <NoteDisplay isMobile={false} />
              </ResizablePanel>
              <ResizableHandle withHandle className="hidden xl:flex" />
              <ResizablePanel defaultSize={35} minSize={25} maxSize={40} className="hidden xl:block">
                  <AiAssistantPanel />
              </ResizablePanel>
          </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

function MobileLayout() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
      <div className="flex flex-col h-dvh w-screen overflow-hidden">
        <SheetContent side="left" className="p-0 w-[300px] flex flex-col">
          <div className="flex-shrink-0">
            <TopicSidebar />
          </div>
          <div className="flex-grow min-h-0 border-t">
            <NoteList />
          </div>
        </SheetContent>
        
        <div className="flex flex-col flex-grow min-h-0">
          <NoteDisplay 
            isMobile={true}
            mobileHeaderActions={
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
            }
          />
        </div>
      </div>
    </Sheet>
  );
}


export function AppLayout() {
  const isMobile = useIsMobile();
  
  return (
    <div className="h-dvh w-screen flex text-foreground bg-background font-body overflow-hidden min-h-0">
      {isMobile ? <MobileLayout /> : <DesktopLayout />}
      {!isMobile && <StudyToolsPanel />}
    </div>
  );
}
