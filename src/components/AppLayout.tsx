
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

function AppContent() {
  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="min-w-[240px]">
        <TopicSidebar />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={22} minSize={18} maxSize={35} className="min-w-[260px]">
        <NoteList />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={58} minSize={30}>
        <NoteDisplay isMobile={false} />
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
