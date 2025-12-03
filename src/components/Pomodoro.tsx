'use client';

import { Play, Pause, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useStudyStats } from '@/hooks/useStudyStats';

export function Pomodoro() {
    const { pomodoro } = useStudyStats();
    const { mode, timeLeft, isActive, toggleTimer, resetTimer, duration } = pomodoro;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const progress = ((duration - timeLeft) / duration) * 100;
    
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">
                    Pomodoro Timer
                </CardTitle>
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
        </Card>
    );
}
