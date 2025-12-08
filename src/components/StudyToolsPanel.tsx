
'use client';

import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Button } from './ui/button';
import { Timer, BrainCircuit, ListTodo } from 'lucide-react';
import { Pomodoro } from './Pomodoro';
import { DailyTracker } from './DailyTracker';
import { StreakCounter } from './StreakCounter';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { useNotes } from '@/context/NotesContext';
import { cn } from '@/lib/utils';
import { AiQuizGenerator } from './AiQuizGenerator';
import { useUI } from '@/context/UIContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { TodoList } from './TodoList';
import { TodoCalendar } from './TodoCalendar';

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
  const { isStudyToolsOpen, setStudyToolsOpen, isQuizGeneratorOpen, setQuizGeneratorOpen } = useUI();
  const isMobile = useIsMobile();
  
  const panelContent = (
    <div className="p-4 space-y-4">
        <Accordion type="multiple" defaultValue={['pomodoro', 'tasks']} className="w-full">
            <AccordionItem value="pomodoro">
                <AccordionTrigger className="text-base font-semibold py-2">
                    <div className="flex items-center gap-2">
                        <Timer className="h-5 w-5" />
                        <span>Pomodoro & Stats</span>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-4">
                    <Pomodoro />
                    <Separator />
                    <StreakCounter />
                    <DailyTracker />
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="tasks">
                <AccordionTrigger className="text-base font-semibold py-2">
                    <div className="flex items-center gap-2">
                        <ListTodo className="h-5 w-5" />
                        <span>To-Do & Tasks</span>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-4">
                    <TodoList />
                    <Separator />
                    <TodoCalendar />
                </AccordionContent>
            </AccordionItem>
        </Accordion>
        <Separator />
        <Button variant="outline" className="w-full" onClick={() => { setStudyToolsOpen(false); setQuizGeneratorOpen(true); }}>
            <BrainCircuit className="h-4 w-4 mr-2" />
            AI Quiz Generator
        </Button>
    </div>
  );

  if (isMobile) {
    return (
        <>
            <Sheet open={isStudyToolsOpen} onOpenChange={setStudyToolsOpen}>
                <SheetContent className="w-full max-w-sm p-0 flex flex-col">
                    <SheetHeader className="p-4 border-b">
                        <SheetTitle className="flex items-center gap-2">
                        <Timer className="h-5 w-5" />
                        <span>Study Tools</span>
                        </SheetTitle>
                    </SheetHeader>
                    <ScrollArea className="flex-grow">
                        {panelContent}
                    </ScrollArea>
                </SheetContent>
            </Sheet>
            
            <Sheet open={isQuizGeneratorOpen} onOpenChange={setQuizGeneratorOpen}>
                <SheetContent className="w-full max-w-2xl p-0 flex flex-col">
                    <SheetHeader className="p-6 pb-2 border-b">
                        <SheetTitle className="flex items-center gap-3 text-xl">
                            <BrainCircuit className="h-6 w-6 text-primary" />
                            AI Quiz Generator
                        </SheetTitle>
                    </SheetHeader>
                    <AiQuizGenerator />
                </SheetContent>
            </Sheet>
        </>
    );
  }

  return (
    <>
      <Sheet open={isStudyToolsOpen} onOpenChange={setStudyToolsOpen}>
        <SheetTrigger asChild>
          <TimerProgressButton onClick={() => setStudyToolsOpen(true)} />
        </SheetTrigger>
        <SheetContent className="w-[380px] sm:max-w-none p-0 flex flex-col">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              <span>Study Tools</span>
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-grow">
              {panelContent}
          </ScrollArea>
        </SheetContent>
      </Sheet>
      
      <Sheet open={isQuizGeneratorOpen} onOpenChange={setQuizGeneratorOpen}>
          <SheetContent className="w-full max-w-2xl p-0 flex flex-col">
              <SheetHeader className="p-6 pb-2 border-b">
                <SheetTitle className="flex items-center gap-3 text-xl">
                    <BrainCircuit className="h-6 w-6 text-primary" />
                    AI Quiz Generator
                </SheetTitle>
              </SheetHeader>
              <AiQuizGenerator />
          </SheetContent>
      </Sheet>
    </>
  );
}
