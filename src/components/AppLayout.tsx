'use client';

import React from 'react';
import { TopicSidebar } from '@/components/TopicSidebar';
import { NoteList } from '@/components/NoteList';
import { NoteDisplay } from '@/components/NoteDisplay';
import { StudyToolsPanel } from '@/components/StudyToolsPanel';
import { DailyQuoteModal } from './DailyQuoteModal';
import { Button } from './ui/button';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AppLayout() {
  const [showTopics, setShowTopics] = React.useState(true);
  const [showNotes, setShowNotes] = React.useState(true);

  return (
    <div className="h-dvh w-screen flex bg-background overflow-hidden">
      
      {/* LEFT: TOPICS */}
      {showTopics && (
        <aside className="w-[240px] shrink-0 border-r">
          <TopicSidebar />
        </aside>
      )}

      {/* MIDDLE: NOTES */}
      {showNotes && (
        <aside className="w-[260px] shrink-0 border-r">
          <NoteList />
        </aside>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 relative">
        
        {/* TOP LEFT BUTTONS (YouTube style) */}
        <div className="absolute top-3 left-3 z-50 flex gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setShowTopics(v => !v)}
            title="Toggle topics"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => setShowNotes(v => !v)}
            title="Toggle notes"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <NoteDisplay isMobile={false} />
      </main>

      <StudyToolsPanel />
      <DailyQuoteModal />
    </div>
  );
}
