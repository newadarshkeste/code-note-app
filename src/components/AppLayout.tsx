
'use client';

import { TopicSidebar } from '@/components/TopicSidebar';
import { NoteList } from '@/components/NoteList';
import { NoteDisplay } from '@/components/NoteDisplay';
import { StudyToolsPanel } from '@/components/StudyToolsPanel';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { DailyQuoteModal } from './DailyQuoteModal';
import { ImperativePanelHandle } from 'react-resizable-panels';
import React from 'react';
import { PanelLeftClose, PanelRightClose } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';


function AppContent() {
  const topicPanelRef = React.useRef<ImperativePanelHandle>(null);
  const noteListPanelRef = React.useRef<ImperativePanelHandle>(null);

  const [isTopicCollapsed, setIsTopicCollapsed] = React.useState(false);
  const [isNoteListCollapsed, setIsNoteListCollapsed] = React.useState(false);

  const toggleTopicPanel = () => {
      const panel = topicPanelRef.current;
      if (panel) {
          if (panel.getCollapsed()) {
              panel.expand();
          } else {
              panel.collapse();
          }
      }
  };

  const toggleNoteListPanel = () => {
      const panel = noteListPanelRef.current;
      if (panel) {
          if (panel.getCollapsed()) {
              panel.expand();
          } else {
              panel.collapse();
          }
      }
  };


  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel 
        ref={topicPanelRef}
        defaultSize={20} 
        minSize={15} 
        maxSize={30} 
        className="min-w-[240px]"
        collapsible={true}
        onCollapse={() => setIsTopicCollapsed(true)}
        onExpand={() => setIsTopicCollapsed(false)}
      >
        <TopicSidebar />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel 
        ref={noteListPanelRef}
        defaultSize={22} 
        minSize={18} 
        maxSize={35} 
        className="min-w-[260px]"
        collapsible={true}
        onCollapse={() => setIsNoteListCollapsed(true)}
        onExpand={() => setIsNoteListCollapsed(false)}
      >
        <NoteList />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={58} minSize={30}>
         <div className="relative h-full w-full">
            <div className="absolute top-1/2 -translate-y-1/2 left-2 z-10 flex flex-col gap-2">
                 <Button variant="outline" size="icon" onClick={toggleTopicPanel} className={cn("h-8 w-8", !isTopicCollapsed && "hidden")}>
                    <PanelRightClose className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={toggleNoteListPanel} className={cn("h-8 w-8", !isNoteListCollapsed && "hidden")}>
                    <PanelRightClose className="h-4 w-4" />
                </Button>
            </div>
            <NoteDisplay isMobile={false} />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}


export function AppLayout() {
  return (
    <div className="h-dvh w-screen flex text-foreground bg-background font-body overflow-hidden min-h-0">
      <AppContent />
      <StudyToolsPanel />
      <DailyQuoteModal />
    </div>
  );
}
