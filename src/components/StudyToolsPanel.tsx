
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

const TimerIconWithProgress = () => {
    const { studyStats } = useNotes();
    const { isActive, timeLeft, duration } = studyStats.pomodoro;

    if (!isActive || duration === 0) {
        return <Timer className="h-5 w-5" />;
    }

    const progress = (timeLeft / duration);
    const radius = 14;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - progress);

    return (
        <div className="relative h-7 w-7">
            <svg
                width="28"
                height="28"
                viewBox="0 0 28 28"
                className="-rotate-90"
            >
                <circle
                    cx="14"
                    cy="14"
                    r={radius}
                    stroke="hsl(var(--border))"
                    strokeWidth="2"
                    fill="transparent"
                    className="text-muted"
                />
                <circle
                    cx="14"
                    cy="14"
                    r={radius}
                    stroke="hsl(var(--primary))"
                    strokeWidth="2"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 linear"
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                 <Timer className="h-5 w-5" />
            </div>
        </div>
    )
}


export function StudyToolsPanel() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className={cn(
            "fixed top-1/2 right-0 -translate-y-1/2 z-50 rounded-r-none",
            "h-11 w-11 p-0"
          )}
        >
          <TimerIconWithProgress />
        </Button>
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
