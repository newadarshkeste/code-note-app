'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { isToday, isYesterday, format, differenceInDays } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, writeBatch, increment, setDoc } from 'firebase/firestore';

export type TimerMode = 'focus' | 'break' | 'longBreak';

export interface StudyStats {
    id: string;
    totalMinutesStudied: number;
    dailyMinutes: Record<string, number>;
    streak: number;
    bestStreak: number;
    lastStudyDate: string;
    totalNotesEdited: number;
    totalLinesTyped: number;
    topicMinutes: Record<string, number>;
}

export interface StudySessionData {
    sessionMinutes: number;
    linesTyped: number;
    topicId: string;
}

const defaultStats: StudyStats = {
    id: '',
    totalMinutesStudied: 0,
    dailyMinutes: {},
    streak: 0,
    bestStreak: 0,
    lastStudyDate: '',
    totalNotesEdited: 0,
    totalLinesTyped: 0,
    topicMinutes: {},
};

export const useStudyStats = () => {
    const { user } = useAuth();
    const firestore = useFirestore();

    const statsRef = useMemoFirebase(() => 
        user ? doc(firestore, 'users', user.uid, 'studyStats', user.uid) : null
    , [user, firestore]);
    
    const { data: studyData } = useDoc<StudyStats>(statsRef);
    const stats = studyData || defaultStats;

    // Pomodoro State (persisted in localStorage for ephemeral UI state)
    const [mode, setMode] = useLocalStorage<TimerMode>('study:mode', 'focus');
    const [isActive, setIsActive] = useLocalStorage('study:isActive', false);
    const [focusDuration, setFocusDuration] = useLocalStorage('study:focusDuration', 25);
    const [breakDuration, setBreakDuration] = useLocalStorage('study:breakDuration', 5);
    const [longBreakDuration, setLongBreakDuration] = useLocalStorage('study:longBreakDuration', 15);
    const [pomodorosPerCycle, setPomodorosPerCycle] = useLocalStorage('study:pomodorosPerCycle', 4);
    const [timeLeft, setTimeLeft] = useLocalStorage('study:timeLeft', focusDuration * 60);
    const [pomodoroCycleCount, setPomodoroCycleCount] = useLocalStorage('study:pomodoroCycleCount', 0);
    const [sessionMinutes, setSessionMinutes] = useState(0);

    // Update study stats when a Pomodoro is completed
    const onPomodoroComplete = useCallback(async () => {
        if (!user || !statsRef) return;

        const minutes = focusDuration;
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        
        const batch = writeBatch(firestore);

        const updateData: any = {
            totalMinutesStudied: increment(minutes),
            [`dailyMinutes.${todayStr}`]: increment(minutes),
        };

        // --- Streak Logic ---
        const lastDate = stats.lastStudyDate ? new Date(stats.lastStudyDate) : null;
        const today = new Date();
        let newStreak = stats.streak || 0;

        if (!lastDate || differenceInDays(today, lastDate) > 1) {
            newStreak = 1; // Reset streak
        } else if (lastDate && isYesterday(lastDate)) {
            newStreak += 1; // Increment streak
        }
        // If it's the same day, do nothing.

        updateData.streak = newStreak;
        updateData.lastStudyDate = todayStr;
        if (newStreak > (stats.bestStreak || 0)) {
            updateData.bestStreak = newStreak;
        }

        batch.set(statsRef, updateData, { merge: true });
        
        try {
            await batch.commit();
        } catch (error) {
            console.error("Failed to update stats on pomodoro completion:", error);
        }

    }, [user, firestore, statsRef, stats, focusDuration]);


    // Pomodoro Timer Effect
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(time => time - 1);
                if(mode === 'focus') {
                    setSessionMinutes(s => s + (1/60));
                }
            }, 1000);
        } else if (isActive && timeLeft === 0) {
            if (mode === 'focus') {
                onPomodoroComplete(); // Update backend stats
                const newCycleCount = pomodoroCycleCount + 1;
                setPomodoroCycleCount(newCycleCount);

                if (newCycleCount % pomodorosPerCycle === 0) {
                    setMode('longBreak');
                    setTimeLeft(longBreakDuration * 60);
                } else {
                    setMode('break');
                    setTimeLeft(breakDuration * 60);
                }
            } else { // break or longBreak
                setMode('focus');
                setTimeLeft(focusDuration * 60);
                setSessionMinutes(0); // Reset session timer
            }
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, timeLeft, mode, pomodoroCycleCount, focusDuration, breakDuration, longBreakDuration, pomodorosPerCycle, setMode, setTimeLeft, setPomodoroCycleCount, onPomodoroComplete]);

    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        setMode('focus');
        setTimeLeft(focusDuration * 60);
        setPomodoroCycleCount(0);
        setSessionMinutes(0);
    };

    const updateDurations = (newFocus: number, newBreak: number, newLongBreak: number, newCycle: number) => {
        setFocusDuration(newFocus);
        setBreakDuration(newBreak);
        setLongBreakDuration(newLongBreak);
        setPomodorosPerCycle(newCycle);
        if (!isActive) {
            setTimeLeft(newFocus * 60);
            setMode('focus');
        }
    };
    
    const getTimerDuration = () => {
        switch(mode) {
            case 'focus': return focusDuration * 60;
            case 'break': return breakDuration * 60;
            case 'longBreak': return longBreakDuration * 60;
            default: return focusDuration * 60;
        }
    };

    const updateStudyStatsOnNoteSave = useCallback(async (data: StudySessionData) => {
        if (!user || !statsRef) return;
        
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const batch = writeBatch(firestore);

        const { sessionMinutes, linesTyped, topicId } = data;
        const roundedMinutes = Math.floor(sessionMinutes);

        const updateData: any = {
            totalNotesEdited: increment(1),
            totalLinesTyped: increment(linesTyped),
        };

        if (roundedMinutes > 0) {
            updateData.totalMinutesStudied = increment(roundedMinutes);
            updateData[`dailyMinutes.${todayStr}`] = increment(roundedMinutes);
            if (topicId) {
                updateData[`topicMinutes.${topicId}`] = increment(roundedMinutes);
            }
        }

        // --- Streak Logic ---
        const lastDate = stats.lastStudyDate ? new Date(stats.lastStudyDate) : null;
        const today = new Date();
        let newStreak = stats.streak || 0;

        if (!lastDate || differenceInDays(today, lastDate) > 1) {
            newStreak = 1;
        } else if (lastDate && isYesterday(lastDate)) {
            newStreak += 1;
        }

        if (newStreak !== stats.streak) {
            updateData.streak = newStreak;
            if (newStreak > (stats.bestStreak || 0)) {
                updateData.bestStreak = newStreak;
            }
        }
        updateData.lastStudyDate = todayStr;

        batch.set(statsRef, updateData, { merge: true });

        try {
            await batch.commit();
            setSessionMinutes(0); // Reset after saving
        } catch (error) {
            console.error("Failed to update study stats on note save:", error);
        }

    }, [user, firestore, statsRef, stats]);


    return useMemo(() => {
        const todayStr = format(new Date(), 'yyyy-MM-dd');

        return {
            pomodoro: {
                mode,
                timeLeft,
                isActive,
                toggleTimer,
                resetTimer,
                duration: getTimerDuration(),
                focusDuration,
                breakDuration,
                longBreakDuration,
                pomodorosPerCycle,
                pomodoroCycleCount,
                updateDurations,
                sessionMinutes
            },
            dailyStats: {
                minutesToday: stats?.dailyMinutes?.[todayStr] || 0,
            },
            streak: {
                current: stats?.streak || 0,
                best: stats?.bestStreak || 0,
            },
            overallStats: {
                totalNotesEdited: stats?.totalNotesEdited || 0,
                totalLinesTyped: stats?.totalLinesTyped || 0
            },
            updateStudyStatsOnNoteSave,
        };
    }, [
        stats,
        mode, timeLeft, isActive, toggleTimer, resetTimer, 
        focusDuration, breakDuration, longBreakDuration, pomodorosPerCycle, 
        pomodoroCycleCount, updateDurations, sessionMinutes, updateStudyStatsOnNoteSave
    ]);
};
    