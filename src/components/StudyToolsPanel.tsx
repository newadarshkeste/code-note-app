
'use client';

import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Button } from './ui/button';
import { Timer } from 'lucide-react';
import { Pomodoro } from './Pomodoro';
import { DailyTracker } from './DailyTracker';
import { StreakCounter } from './StreakCounter';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { useNotes } from '@/context/NotesContext';
import { cn } from '@/lib/utils';

const TimerProgressButton = ({ onClick }: { onClick: () => void }) => {
    const { studyStats } = useNotes();
    const { isActive, timeLeft, duration } = studyStats.pomodoro;

    const progress = (isActive && duration > 0) ? (timeLeft / duration) : 1;
    const radius = 20;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - progress);

    return (
        <button
            onClick={onClick}
            className={cn(
                "fixed top-1/2 right-0 -translate-y-1/2 z-50 flex items-center justify-center",
                "h-12 w-12 rounded-full bg-background shadow-lg border transition-all hover:scale-110",
                isActive ? "border-transparent" : "border-border"
            )}
            aria-label="Open study tools"
        >
            <svg
                width="48"
                height="48"
                viewBox="0 0 48 48"
                className="absolute inset-0"
            >
                {/* Background Circle */}
                <circle
                    cx="24"
                    cy="24"
                    r={radius}
                    stroke="hsl(var(--border))"
                    strokeWidth="2"
                    fill="transparent"
                    className="opacity-50"
                />
                {/* Progress Circle */}
                {isActive && (
                     <circle
                        cx="24"
                        cy="24"
                        r={radius}
                        stroke="hsl(var(--primary))"
                        strokeWidth="3"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className="transform -rotate-90 origin-center transition-all duration-1000 linear"
                    />
                )}
            </svg>
            <Timer className="h-5 w-5 z-10" />
        </button>
    );
}


export function StudyToolsPanel() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <TimerProgressButton onClick={() => setIsOpen(true)} />
      </SheetTrigger>
      <SheetContent className="w-[320px] sm:w-[320px] sm:max-w-none p-0 flex flex-col">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            <span>Study Tools</span>
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-grow">
            <div className="p-4 space-y-6">
                <Pomodoro />
                <Separator />
                <StreakCounter />
                <DailyTracker />
            </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
