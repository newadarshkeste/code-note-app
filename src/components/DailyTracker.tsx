'use client';

import { BarChart2, BookOpen, Clock, Code } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useNotes } from '@/context/NotesContext';

const StatItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | number }) => (
    <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
            <Icon className="h-4 w-4" />
            <span>{label}</span>
        </div>
        <span className="font-medium text-foreground">{value}</span>
    </div>
);


export function DailyTracker() {
    const { studyStats } = useNotes();
    const { dailyStats } = studyStats;
    
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <BarChart2 className="h-5 w-5" />
                    <span>Daily Progress</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <StatItem icon={Clock} label="Pomodoros" value={dailyStats.pomodorosToday} />
                <StatItem icon={Clock} label="Focus Time" value={`${dailyStats.focusMinutesToday} min`} />
                <StatItem icon={Clock} label="Coding Time" value={`${dailyStats.codingMinutesToday} min`} />
                <StatItem icon={BookOpen} label="Notes Edited" value={dailyStats.notesEditedToday} />
                <StatItem icon={Code} label="Lines Typed" value={daily_stats.linesTypedToday} />
            </CardContent>
        </Card>
    );
}
