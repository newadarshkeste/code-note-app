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
      {/* Topic Sidebar */}
      {showTopics ? (
        <aside className="w-[240px] shrink-0">
          <TopicSidebar onToggle={() => setShowTopics(false)} />
        </aside>
      ) : (
        <div className="flex-shrink-0 border-r">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowTopics(true)}
            title="Show topics"
            className="m-2"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Note List Sidebar */}
      {showNotes ? (
        <aside className="w-[260px] shrink-0">
          <NoteList onToggle={() => setShowNotes(false)} />
        </aside>
      ) : (
        <div className="flex-shrink-0 border-r">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowNotes(true)}
            title="Show notes"
            className="m-2"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 relative">
        <NoteDisplay isMobile={false} />
      </main>

      <StudyToolsPanel />
      <DailyQuoteModal />
    </div>
  );
}