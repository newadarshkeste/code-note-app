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
import type { ImperativePanelHandle } from 'react-resizable-panels';
import React from 'react';
import { PanelLeftOpen, PanelLeftClose } from 'lucide-react';
import { Button } from './ui/button';

function AppContent() {
  const topicPanelRef = React.useRef<ImperativePanelHandle | null>(null);
  const noteListPanelRef = React.useRef<ImperativePanelHandle | null>(null);

  const [isTopicCollapsed, setIsTopicCollapsed] = React.useState(false);
  const [isNoteListCollapsed, setIsNoteListCollapsed] = React.useState(false);

  const toggleTopicPanel = () => {
    const panel = topicPanelRef.current;
    if (!panel) return;

    if (panel.isCollapsed()) {
      panel.expand();
      setIsTopicCollapsed(false);
    } else {
      panel.collapse();
      setIsTopicCollapsed(true);
    }
  };

  const toggleNoteListPanel = () => {
    const panel = noteListPanelRef.current;
    if (!panel) return;

    if (panel.isCollapsed()) {
      panel.expand();
      setIsNoteListCollapsed(false);
    } else {
      panel.collapse();
      setIsNoteListCollapsed(true);
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
        collapsible
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
        collapsible
        onCollapse={() => setIsNoteListCollapsed(true)}
        onExpand={() => setIsNoteListCollapsed(false)}
      >
        <NoteList />
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel defaultSize={58} minSize={30}>
        <div className="relative h-full w-full">
          {/* Floating toggle buttons on the left edge */}
          <div className="absolute inset-y-0 left-0 z-20 flex items-center pointer-events-none">
            <div className="flex flex-col gap-2 ml-2 pointer-events-auto">
              {/* Topic panel toggle */}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={toggleTopicPanel}
                title={isTopicCollapsed ? 'Show topics' : 'Hide topics'}
              >
                {isTopicCollapsed ? (
                  <PanelLeftOpen className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </Button>

              {/* Note list toggle */}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={toggleNoteListPanel}
                title={isNoteListCollapsed ? 'Show note list' : 'Hide note list'}
              >
                {isNoteListCollapsed ? (
                  <PanelLeftOpen className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </Button>
            </div>
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
