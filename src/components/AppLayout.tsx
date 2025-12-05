
'use client';

import { TopicSidebar } from '@/components/TopicSidebar';
import { NoteList } from '@/components/NoteList';
import { NoteDisplay } from '@/components/NoteDisplay';
import { StudyToolsPanel }from '@/components/StudyToolsPanel';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import React, { useState } from 'react';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { CodeNoteLogo } from './CodeNoteLogo';
import { useNotes } from '@/context/NotesContext';
import { cn } from '@/lib/utils';
import { Input } from './ui/input';


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
          <NoteDisplay isMobile={false} />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

function MobileLayout() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { activeTopicId, setActiveTopicId, activeNote, setActiveNoteId } = useNotes();
  
  const handleNoteSelected = () => {
    setIsDrawerOpen(false);
  };
  
  const handleTopicSelected = (topicId: string) => {
    // When a topic is selected, we want to show the note list for that topic.
    setActiveTopicId(topicId);
    setActiveNoteId(null);
    setIsDrawerOpen(false);
  };

  const showTopics = !activeTopicId && !activeNote;
  const showNotes = activeTopicId && !activeNote;
  const showNoteDisplay = !!activeNote;
  
  const getHeader = () => {
    return (
       <header className="flex-shrink-0 w-full flex items-center justify-between p-2 border-b h-[65px] bg-background">
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <div className="flex-grow min-w-0">
             {showNoteDisplay && activeNote && (
               <Input
                  value={activeNote.title}
                  readOnly
                  className="text-base md:text-lg font-headline border-0 shadow-none focus-visible:ring-0 flex-grow !text-xl h-auto p-0 bg-transparent truncate"
                />
            )}
          </div>
          {showNoteDisplay && (
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-2">
              {/* Actions for NoteDisplay can go here if needed */}
            </div>
          )}
        </header>
    )
  }

  return (
    <div className="flex flex-col h-dvh w-screen overflow-hidden">
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent side="left" className="p-0 w-[300px] flex flex-col">
            <SheetHeader className="p-4 border-b">
                <SheetTitle>
                    <CodeNoteLogo />
                </SheetTitle>
            </SheetHeader>
            <TopicSidebar isMobile={true} onTopicSelect={handleTopicSelected} />
        </SheetContent>
        
        <div className="flex flex-col flex-grow min-h-0">
          <div className="flex-grow min-h-0">
            {showTopics && (
              <div className="h-full w-full flex flex-col">
                 <header className="flex-shrink-0 w-full flex items-center justify-between p-2 border-b h-[65px] bg-background">
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Menu className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>
                    <div/>
                 </header>
                 <TopicSidebar isMobile onTopicSelect={handleTopicSelected} />
              </div>
            )}
            {showNotes && activeTopicId && (
              <div className="h-full w-full flex flex-col">
                 <header className="flex-shrink-0 w-full flex items-center justify-between p-2 border-b h-[65px] bg-background">
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Menu className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>
                    <div/>
                 </header>
                 <NoteList 
                    isMobile={true} 
                    onNoteSelect={handleNoteSelected} 
                    onBack={() => {
                      setActiveNoteId(null);
                      setActiveTopicId(null);
                    }}
                />
              </div>
            )}
            {showNoteDisplay && (
              <NoteDisplay 
                isMobile={true}
                mobileHeaderActions={
                   <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => {
                      // This is the key fix: when showing a note, clicking the hamburger
                      // should go back to the note list of the current topic.
                      setActiveNoteId(null);
                    }}>
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                }
              />
            )}
          </div>
        </div>
      </Sheet>
    </div>
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
