'use client';

import { Flame } from 'lucide-react';
import { useStudyStats } from '@/hooks/useStudyStats';
import { Badge } from './ui/badge';

export function StreakCounter() {
    const { streak } = useStudyStats();

    if (streak.current === 0) {
        return null;
    }

    return (
        <div className="flex justify-center">
            <Badge variant="secondary" className="gap-2 py-1 px-3">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="font-semibold text-foreground">{streak.current} Day Streak</span>
                <span className="text-muted-foreground">(Best: {streak.best})</span>
            </Badge>
        </div>
    );
}
