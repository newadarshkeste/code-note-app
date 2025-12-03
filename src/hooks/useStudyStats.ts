'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { useNotes } from '@/context/NotesContext';
import { isToday, isYesterday, startOfToday } from 'date-fns';

export type TimerMode = 'focus' | 'break';

const FOCUS_DURATION = 25 * 60;
const BREAK_DURATION = 5 * 60;

export const useStudyStats = () => {
    // Pomodoro State
    const [mode, setMode] = useLocalStorage<TimerMode>('study:mode', 'focus');
    const [isActive, setIsActive] = useLocalStorage('study:isActive', false);
    const [timeLeft, setTimeLeft] = useLocalStorage('study:timeLeft', FOCUS_DURATION);
    const [pomodorosToday, setPomodorosToday] = useLocalStorage('study:pomodorosToday', 0);
    const [lastResetDate, setLastResetDate] = useLocalStorage('study:lastResetDate', new Date().toISOString());

    // Streak State
    const [streak, setStreak] = useLocalStorage('study:streak', 0);
    const [bestStreak, setBestStreak] = useLocalStorage('study:bestStreak', 0);
    const [lastStudyDate, setLastStudyDate] = useLocalStorage<string | null>('study:lastStudyDate', null);
    
    // Daily Stats
    const [notesEditedToday, setNotesEditedToday] = useLocalStorage('study:notesEditedToday', 0);
    const [linesTypedToday, setLinesTypedToday] = useLocalStorage('study:linesTypedToday', 0);
    const [codingTimeToday, setCodingTimeToday] = useLocalStorage('study:codingTimeToday', 0); // in seconds
    
    const { isSaving } = useNotes();
    const beepRef = useRef<HTMLAudioElement | null>(null);

    // --- Daily Reset Logic ---
    useEffect(() => {
        const lastDate = new Date(lastResetDate);
        if (!isToday(lastDate)) {
            // Reset all daily stats
            setPomodorosToday(0);
            setNotesEditedToday(0);
            setLinesTypedToday(0);
            setCodingTimeToday(0);
            setLastResetDate(new Date().toISOString());
        }

        if (!beepRef.current && typeof Audio !== 'undefined') {
            beepRef.current = new Audio('/beep.mp3'); 
        }

    }, []);

    // --- Streak Logic ---
    const incrementStreak = useCallback(() => {
        const today = new Date();
        if (!lastStudyDate) {
            setStreak(1);
        } else {
            const lastDate = new Date(lastStudyDate);
            if (isYesterday(lastDate)) {
                setStreak(s => s + 1);
            } else if (!isToday(lastDate)) {
                setStreak(1); // Streak broken
            }
        }
        setLastStudyDate(today.toISOString());
    }, [lastStudyDate, setStreak, setLastStudyDate]);

    useEffect(() => {
        if (streak > bestStreak) {
            setBestStreak(streak);
        }
    }, [streak, bestStreak, setBestStreak]);

    // --- Pomodoro Timer Logic ---
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(time => time - 1);
            }, 1000);
        } else if (isActive && timeLeft === 0) {
            if (beepRef.current) beepRef.current.play();
            if (mode === 'focus') {
                incrementStreak();
                setPomodorosToday(p => p + 1);
                setMode('break');
                setTimeLeft(BREAK_DURATION);
            } else {
                setMode('focus');
                setTimeLeft(FOCUS_DURATION);
            }
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, timeLeft, mode, setTimeLeft, setMode, setPomodorosToday, incrementStreak]);

    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        setMode('focus');
        setTimeLeft(FOCUS_DURATION);
    };

    // --- Stats Tracking Logic ---
    const focusMinutesToday = Math.floor((pomodorosToday * FOCUS_DURATION) / 60);

    // Track notes edited
    useEffect(() => {
        if (isSaving) { // A note is being saved
            incrementStreak();
            setNotesEditedToday(n => n + 1);
        }
    }, [isSaving, setNotesEditedToday, incrementStreak]);

    // Track lines typed (exposed function)
    const incrementLinesTyped = useCallback(() => {
        setLinesTypedToday(l => l + 1);
    }, [setLinesTypedToday]);

    // Track coding time (exposed functions)
    const codingTimerRef = useRef<NodeJS.Timeout | null>(null);
    const startCodingTimer = useCallback(() => {
        if (codingTimerRef.current) return;
        codingTimerRef.current = setInterval(() => {
            setCodingTimeToday(t => t + 1);
        }, 1000);
    }, [setCodingTimeToday]);

    const stopCodingTimer = useCallback(() => {
        if (codingTimerRef.current) {
            clearInterval(codingTimerRef.current);
            codingTimerRef.current = null;
        }
    }, []);

    const codingMinutesToday = Math.floor(codingTimeToday / 60);

    return {
        pomodoro: {
            mode,
            timeLeft,
            isActive,
            toggleTimer,
            resetTimer,
            duration: mode === 'focus' ? FOCUS_DURATION : BREAK_DURATION,
        },
        dailyStats: {
            pomodorosToday,
            focusMinutesToday,
            notesEditedToday,
            linesTypedToday,
            codingMinutesToday,
        },
        streak: {
            current: streak,
            best: bestStreak,
        },
        trackers: {
            incrementLinesTyped,
            startCodingTimer,
            stopCodingTimer,
        }
    };
};
