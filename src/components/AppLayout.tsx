'use client';

import { TopicSidebar } from '@/components/TopicSidebar';
import { NoteList } from '@/components/NoteList';
import { NoteDisplay } from '@/components/NoteDisplay';
import { AiAssistantPanel } from '@/components/AiAssistantPanel';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

export function AppLayout() {
  return (
    <div className="h-dvh w-screen flex text-foreground bg-background font-body overflow-hidden">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="w-[240px] flex-none">
          <TopicSidebar />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={22} minSize={18} maxSize={35} className="w-[260px] flex-none">
          <NoteList />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={58} minSize={30}>
            <ResizablePanelGroup direction="horizontal">
                <ResizablePanel defaultSize={65} minSize={40}>
                    <NoteDisplay />
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={35} minSize={25} maxSize={40}>
                    <AiAssistantPanel />
                </ResizablePanel>
            </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
