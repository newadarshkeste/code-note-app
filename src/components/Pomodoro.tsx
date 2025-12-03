
'use client';

import React, { useState } from 'react';
import { Play, Pause, RefreshCw, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useStudyStats } from '@/hooks/useStudyStats';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';

function TimerSettingsDialog({
    isOpen,
    setIsOpen,
    currentFocus,
    currentBreak,
    onSave,
}: {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    currentFocus: number;
    currentBreak: number;
    onSave: (newFocus: number, newBreak: number) => void;
}) {
    const [focus, setFocus] = useState(currentFocus);
    const [breakTime, setBreakTime] = useState(currentBreak);

    const handleSave = () => {
        onSave(focus, breakTime);
        setIsOpen(false);
    };
    
    const handleFocusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10);
        setFocus(Math.max(1, isNaN(value) ? 1 : value));
    }

    const handleBreakChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10);
        setBreakTime(Math.max(1, isNaN(value) ? 1 : value));
    }


    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Timer Settings</DialogTitle>
                    <DialogDescription>
                        Set your desired durations for focus and break sessions.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="focus-duration" className="text-right">
                            Focus (min)
                        </Label>
                        <Input
                            id="focus-duration"
                            type="number"
                            value={focus}
                            onChange={handleFocusChange}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="break-duration" className="text-right">
                            Break (min)
                        </Label>
                        <Input
                            id="break-duration"
                            type="number"
                            value={breakTime}
                            onChange={handleBreakChange}
                            className="col-span-3"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleSave}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


export function Pomodoro() {
    const { pomodoro } = useStudyStats();
    const {
        mode,
        timeLeft,
        isActive,
        toggleTimer,
        resetTimer,
        duration,
        focusDuration,
        breakDuration,
        updateDurations,
    } = pomodoro;
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);


    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const progress = duration > 0 ? ((duration - timeLeft) / duration) * 100 : 0;
    
    return (
        <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold">
                    Pomodoro Timer
                </CardTitle>
                 <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsSettingsOpen(true)}>
                    <Settings className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center space-y-4 pt-2">
                <div className="relative h-32 w-32">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <p className="text-3xl font-bold font-mono tracking-tighter">
                                {formatTime(timeLeft)}
                            </p>
                            <p className="text-xs uppercase text-muted-foreground tracking-widest">
                                {mode}
                            </p>
                        </div>
                    </div>
                </div>
                
                <div className="w-full">
                    <Progress value={progress} className="h-2" />
                </div>

                <div className="flex w-full items-center justify-center space-x-2">
                    <Button onClick={toggleTimer} size="lg" className="flex-grow">
                        {isActive ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                        <span className="ml-2">{isActive ? 'Pause' : 'Start'}</span>
                    </Button>
                    <Button onClick={resetTimer} variant="outline" size="lg">
                        <RefreshCw className="h-5 w-5" />
                    </Button>
                </div>
            </CardContent>

             <TimerSettingsDialog 
                isOpen={isSettingsOpen}
                setIsOpen={setIsSettingsOpen}
                currentFocus={focusDuration}
                currentBreak={breakDuration}
                onSave={updateDurations}
             />
        </Card>
    );
}
