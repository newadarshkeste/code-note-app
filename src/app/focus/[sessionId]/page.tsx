
'use client';

import React, 'useEffect', 'useState' from 'react';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2, Skull, Eye } from 'lucide-react';
import { TimerSettingsDialog } from '@/components/Pomodoro';


interface FocusSession {
    mode: 'focus' | 'break' | 'longBreak';
    timeLeft: number;
    isActive: boolean;
    focusDuration: number;
    breakDuration: number;
    longBreakDuration: number;
    pomodorosPerCycle: number;
}

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const getModeStyles = (mode: FocusSession['mode']) => {
    switch (mode) {
        case 'focus':
            return {
                bg: 'bg-red-900/80',
                text: 'text-red-100',
                message: "Time to Focus",
            };
        case 'break':
            return {
                bg: 'bg-green-900/80',
                text: 'text-green-100',
                message: "Relax. It's a short break.",
            };
        case 'longBreak':
            return {
                bg: 'bg-blue-900/80',
                text: 'text-blue-100',
                message: "Nice work. Take a long break.",
            };
        default:
            return {
                bg: 'bg-gray-900',
                text: 'text-gray-100',
                message: 'Stay Focused',
            };
    }
};


export default function FocusSessionPage({ params: { sessionId } }: { params: { sessionId: string } }) {
    const { firestore } = useFirebase();
    
    const [syncKey, setSyncKey] = useState(0);

    const sessionRef = useMemoFirebase(() => sessionId ? doc(firestore, 'focusSessions', sessionId) : null, [firestore, sessionId, syncKey]);
    const { data: session, isLoading } = useDoc<FocusSession>(sessionRef);
    const [isTabFocused, setIsTabFocused] = useState(true);

    useEffect(() => {
        const handleVisibilityChange = () => {
            const isVisible = document.visibilityState === 'visible';
            setIsTabFocused(isVisible);
            
            if (isVisible) {
                setSyncKey(prevKey => prevKey + 1);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        handleVisibilityChange();

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);


    if (isLoading && !session) {
        return (
            <div className="flex h-dvh w-screen items-center justify-center bg-gray-900 text-white">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    if (!session) {
        return (
            <div className="flex h-dvh w-screen items-center justify-center bg-gray-900 text-white p-4">
                <div className="text-center">
                    <h1 className="text-3xl font-bold">Session Not Found</h1>
                    <p className="mt-2 text-lg text-muted-foreground">This focus session may have expired or is invalid.</p>
                </div>
            </div>
        );
    }
    
    const styles = getModeStyles(session.mode);

    return (
        <>
            <main className={`h-dvh w-screen flex flex-col items-center justify-center transition-colors duration-500 ${styles.bg} ${styles.text}`}>
                {!isTabFocused && (
                    <div className="absolute inset-0 bg-black/80 z-10 flex flex-col items-center justify-center text-center p-8 backdrop-blur-sm">
                        <Skull className="h-24 w-24 text-red-500 animate-pulse" />
                        <h1 className="mt-6 text-4xl font-extrabold text-red-400">FOCUS LOST</h1>
                        <p className="mt-2 text-xl text-red-200">Return to this tab immediately to continue your session.</p>
                    </div>
                )}
                <div className="text-center">
                    <p className="text-2xl font-semibold tracking-wider uppercase opacity-80">{styles.message}</p>
                    <h1 className="text-8xl md:text-9xl font-bold font-mono tracking-tighter my-4">
                        {formatTime(session.timeLeft)}
                    </h1>
                    <div className="flex items-center justify-center gap-3 text-lg opacity-70">
                        <Eye className="h-6 w-6"/>
                        <span>{session.isActive ? "SESSION IN PROGRESS" : "SESSION PAUSED"}</span>
                    </div>
                </div>

            </main>
        </>
    );
}
