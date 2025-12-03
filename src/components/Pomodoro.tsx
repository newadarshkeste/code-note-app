'use client';

import React, { useState } from 'react';
import { Play, Pause, RefreshCw, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useNotes } from '@/context/NotesContext';
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
    currentSettings,
    onSave,
}: {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    currentSettings: {
        focus: number;
        break: number;
        longBreak: number;
        cycle: number;
    };
    onSave: (newFocus: number, newBreak: number, newLongBreak: number, newCycle: number) => void;
}) {
    const [focus, setFocus] = useState(currentSettings.focus);
    const [breakTime, setBreakTime] = useState(currentSettings.break);
    const [longBreak, setLongBreak] = useState(currentSettings.longBreak);
    const [cycle, setCycle] = useState(currentSettings.cycle);


    const handleSave = () => {
        onSave(focus, breakTime, longBreak, cycle);
        setIsOpen(false);
    };
    
    const createInputHandler = (setter: React.Dispatch<React.SetStateAction<number>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10);
        setter(Math.max(1, isNaN(value) ? 1 : value));
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
                            onChange={createInputHandler(setFocus)}
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
                            onChange={createInputHandler(setBreakTime)}
                            className="col-span-3"
                        />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="long-break-duration" className="text-right">
                            Long Break (min)
                        </Label>
                        <Input
                            id="long-break-duration"
                            type="number"
                            value={longBreak}
                            onChange={createInputHandler(setLongBreak)}
                            className="col-span-3"
                        />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="cycle-count" className="text-right">
                            Sessions
                        </Label>
                        <Input
                            id="cycle-count"
                            type="number"
                            value={cycle}
                            onChange={createInputHandler(setCycle)}
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
    const { studyStats } = useNotes();
    const { pomodoro } = studyStats;
    const {
        mode,
        timeLeft,
        isActive,
        toggleTimer,
        resetTimer,
        duration,
        focusDuration,
        breakDuration,
        longBreakDuration,
        pomodorosPerCycle,
        pomodoroCycleCount,
        updateDurations,
    } = pomodoro;
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);


    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const progress = duration > 0 ? ((duration - timeLeft) / duration) * 100 : 0;
    
    const getModeLabel = () => {
        switch(mode) {
            case 'focus':
                return `Session ${ (pomodoroCycleCount % pomodorosPerCycle) + 1} of ${pomodorosPerCycle}`;
            case 'break':
                return 'Short Break';
            case 'longBreak':
                return 'Long Break';
            default:
                return 'Focus';
        }
    }

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
                                {getModeLabel()}
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
                currentSettings={{
                    focus: focusDuration,
                    break: breakDuration,
                    longBreak: longBreakDuration,
                    cycle: pomodorosPerCycle
                }}
                onSave={updateDurations}
             />
        </Card>
    );
}

    