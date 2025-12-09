

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { isToday, isYesterday, format, differenceInDays } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { doc, writeBatch, increment, setDoc, deleteDoc, serverTimestamp, getDoc, collection, onSnapshot, updateDoc } from 'firebase/firestore';

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
    practiceSessions: Record<string, { count: number, averageScore: number }>; // key = noteId
    totalPracticeSessions: number;
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
    practiceSessions: {},
    totalPracticeSessions: 0,
};

export const useStudyStats = () => {
    const { user } = useAuth();
    const firestore = useFirestore();
    const [studyData, setStudyData] = useState<StudyStats | null>(null);

    const statsRef = useMemoFirebase(() => 
        user ? doc(firestore, 'users', user.uid, 'studyStats', user.uid) : null
    , [user, firestore]);
    
    useEffect(() => {
        if (!statsRef) {
            setStudyData(null);
            return;
        };

        const unsubscribe = onSnapshot(statsRef, (doc) => {
            if (doc.exists()) {
                setStudyData(doc.data() as StudyStats);
            } else {
                setStudyData(defaultStats);
            }
        }, (error) => {
            console.error("Error fetching study stats:", error);
            // We can assume the global error handler will catch permission errors
            // but log others.
        });
        return () => unsubscribe();
    }, [statsRef]);

    const stats = studyData || defaultStats;

    // Pomodoro State
    const [mode, setMode] = useLocalStorage<TimerMode>('study:mode', 'focus');
    const [isActive, setIsActive] = useLocalStorage('study:isActive', false);
    const [focusDuration, setFocusDuration] = useLocalStorage('study:focusDuration', 25);
    const [breakDuration, setBreakDuration] = useLocalStorage('study:breakDuration', 5);
    const [longBreakDuration, setLongBreakDuration] = useLocalStorage('study:longBreakDuration', 15);
    const [pomodorosPerCycle, setPomodorosPerCycle] = useLocalStorage('study:pomodorosPerCycle', 4);
    const [timeLeft, setTimeLeft] = useLocalStorage('study:timeLeft', focusDuration * 60);
    const [pomodoroCycleCount, setPomodoroCycleCount] = useLocalStorage('study:pomodoroCycleCount', 0);
    const [sessionMinutes, setSessionMinutes] = useState(0);
    const [focusSessionId, setFocusSessionId] = useLocalStorage<string | null>('study:focusSessionId', null);

    const onPomodoroComplete = useCallback(async () => {
        if (!user || !statsRef) return;

        const minutes = focusDuration;
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        
        // Use a transaction or a batched write to ensure atomicity
        const batch = writeBatch(firestore);

        // Fetch the latest stats directly inside the function to avoid stale state
        const currentStatsSnap = await getDoc(statsRef);
        const currentStats = currentStatsSnap.exists() ? currentStatsSnap.data() as StudyStats : defaultStats;
        
        const updateData: any = {
            totalMinutesStudied: increment(minutes),
            [`dailyMinutes.${todayStr}`]: increment(minutes),
        };

        const lastDate = currentStats.lastStudyDate ? new Date(currentStats.lastStudyDate) : null;
        const today = new Date();
        let newStreak = currentStats.streak || 0;

        if (!lastDate || differenceInDays(today, lastDate) > 1) {
            newStreak = 1; // Reset streak
        } else if (lastDate && isYesterday(lastDate)) {
            newStreak += 1; // Increment streak
        }

        updateData.streak = newStreak;
        updateData.lastStudyDate = todayStr;
        if (newStreak > (currentStats.bestStreak || 0)) {
            updateData.bestStreak = newStreak;
        }

        batch.set(statsRef, updateData, { merge: true });
        
        try {
            await batch.commit();
        } catch (error) {
            console.error("Failed to update stats on pomodoro completion:", error);
        }

    }, [user, firestore, statsRef, focusDuration]);

    const toggleTimer = () => setIsActive(!isActive);
    
    const getTimerDuration = () => {
        switch(mode) {
            case 'focus': return focusDuration * 60;
            case 'break': return breakDuration * 60;
            case 'longBreak': return longBreakDuration * 60;
            default: return focusDuration * 60;
        }
    };
    
    // Sync timer state to Firestore for Focus Lock
    useEffect(() => {
        if (focusSessionId) {
            const sessionRef = doc(firestore, 'focusSessions', focusSessionId);
            updateDoc(sessionRef, {
                timeLeft: timeLeft,
                mode: mode,
                duration: getTimerDuration(),
                isActive: isActive, // Keep this in sync
            }).catch(err => {
                // This can happen if the doc is deleted, which is fine on reset.
                if (err.code !== 'not-found') {
                     console.error("Could not sync timer state:", err);
                }
            });
        }
    }, [isActive, focusSessionId, timeLeft, mode, firestore]);

    useEffect(() => {
        if (isActive && mode === 'focus' && !focusSessionId) {
            if (user) {
                const newSessionId = doc(collection(firestore, 'focusSessions')).id;
                const sessionRef = doc(firestore, 'focusSessions', newSessionId);
                setDoc(sessionRef, {
                    userId: user.uid,
                    createdAt: serverTimestamp(),
                    isActive: true,
                    lastWarningAt: null,
                    timeLeft: timeLeft,
                    mode: mode,
                    duration: getTimerdurations(),
                });
                setFocusSessionId(newSessionId);
            }
        }
    }, [isActive, mode, user, firestore, focusSessionId, setFocusSessionId, setDoc, timeLeft]);

    const resetTimer = () => {
        setIsActive(false);
        if (focusSessionId) {
             const sessionRef = doc(firestore, 'focusSessions', focusSessionId);
             // Instead of deleting, we update it to inactive, then delete.
             // This gives the client a chance to see the session has ended.
             updateDoc(sessionRef, { isActive: false }).then(() => {
                deleteDoc(sessionRef);
             });
             setFocusSessionId(null);
        }
        // Reset local state after handling firestore
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

        const currentStatsSnap = await getDoc(statsRef);
        const currentStats = currentStatsSnap.exists() ? currentStatsSnap.data() as StudyStats : defaultStats;

        const lastDate = currentStats.lastStudyDate ? new Date(currentStats.lastStudyDate) : null;
        const today = new Date();
        let newStreak = currentStats.streak || 0;

        if (!lastDate || differenceInDays(today, lastDate) > 1) {
            newStreak = 1;
        } else if (lastDate && isYesterday(lastDate)) {
            newStreak += 1;
        }

        if (newStreak !== currentStats.streak) {
            updateData.streak = newStreak;
            if (newStreak > (currentStats.bestStreak || 0)) {
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

    }, [user, firestore, statsRef]);

    const recordPracticeSession = useCallback(async (noteId: string, score: number) => {
        if (!user || !statsRef) return;
        
        const currentStatsSnap = await getDoc(statsRef);
        const currentStats = currentStatsSnap.exists() ? currentStatsSnap.data() as StudyStats : defaultStats;

        const existingSession = currentStats.practiceSessions?.[noteId] || { count: 0, averageScore: 0 };
        const newCount = existingSession.count + 1;
        const newAverage = ((existingSession.averageScore * existingSession.count) + score) / newCount;

        const updateData = {
            totalPracticeSessions: increment(1),
            [`practiceSessions.${noteId}`]: {
                count: newCount,
                averageScore: newAverage
            }
        };
        
        try {
            await setDoc(statsRef, updateData, { merge: true });
        } catch(error) {
             console.error("Failed to record practice session:", error);
        }
    }, [user, statsRef]);


    return useMemo(() => {
        const todayStr = format(new Date(), 'yyyy-MM-dd');

        return {
            pomodoro: {
                mode,
                setMode,
                timeLeft,
                setTimeLeft,
                isActive,
                setIsActive,
                toggleTimer,
                resetTimer,
                duration: getTimerDuration(),
                focusDuration,
                breakDuration,
                longBreakDuration,
                pomodorosPerCycle,
                pomodoroCycleCount,
                setPomodoroCycleCount,
                updateDurations,
                sessionMinutes,
                setSessionMinutes,
                onPomodoroComplete,
                focusSessionId,
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
            practiceSession: {
                recordPracticeSession,
            },
            updateStudyStatsOnNoteSave,
        };
    }, [
        stats,
        mode, setMode, timeLeft, setTimeLeft, isActive, setIsActive, toggleTimer, resetTimer, 
        focusDuration, breakDuration, longBreakDuration, pomodorosPerCycle, 
        pomodoroCycleCount, setPomodoroCycleCount, updateDurations, sessionMinutes, setSessionMinutes, 
        onPomodoroComplete, updateStudyStatsOnNoteSave, recordPracticeSession, focusSessionId
    ]);
};
