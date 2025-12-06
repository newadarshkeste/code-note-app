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
    const { dailyStats, overallStats, pomodoro } = studyStats;

    // This is the fix: combine saved daily minutes with live session minutes.
    // We only add session minutes during an active 'focus' session.
    const liveMinutesToday = Math.floor(
        dailyStats.minutesToday + (pomodoro.isActive && pomodoro.mode === 'focus' ? pomodoro.sessionMinutes : 0)
    );
    
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <BarChart2 className="h-5 w-5" />
                    <span>Daily Progress</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <StatItem icon={Clock} label="Focus Time" value={`${liveMinutesToday} min`} />
                <CardTitle className="text-base font-semibold flex items-center gap-2 pt-2">
                    <BarChart2 className="h-5 w-5" />
                    <span>Lifetime Stats</span>
                </CardTitle>
                <StatItem icon={BookOpen} label="Notes Edited" value={overallStats.totalNotesEdited} />
                <StatItem icon={Code} label="Chars Typed" value={overallStats.totalLinesTyped} />
            </CardContent>
        </Card>
    );
}
