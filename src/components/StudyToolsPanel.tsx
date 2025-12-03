'use client';

import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Button } from './ui/button';
import { Timer, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Pomodoro } from './Pomodoro';
import { DailyTracker } from './DailyTracker';
import { StreakCounter } from './StreakCounter';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';

export function StudyToolsPanel() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="fixed top-1/2 right-0 -translate-y-1/2 z-50 rounded-r-none"
        >
          <Timer className="h-5 w-5" />
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
