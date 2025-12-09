'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, updateDoc, onSnapshot, DocumentData, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Smartphone, CheckCircle, AlertTriangle, Play, Pause, RefreshCw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { FocusSession } from '@/lib/types';

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const getModeLabel = (mode: FocusSession['mode']) => {
    switch (mode) {
        case 'focus': return 'Focus Session';
        case 'break': return 'Short Break';
        case 'longBreak': return 'Long Break';
        default: return 'Focus';
    }
};

export default function FocusSessionPage() {
  const { sessionId } = useParams();
  const firestore = useFirestore();
  const [sessionData, setSessionData] = useState<FocusSession | null>(null);
  const [wasDistracted, setWasDistracted] = useState(false);

  useEffect(() => {
    if (!sessionId || typeof sessionId !== 'string' || !firestore) return;

    const sessionRef = doc(firestore, 'focusSessions', sessionId as string);

    // Main listener for session data (timer, mode, etc.)
    const unsubscribe = onSnapshot(sessionRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data() as FocusSession;
            setSessionData(data);
            if (data.lastWarningAt) {
                setWasDistracted(true);
            }
        } else {
            // Session ended (document deleted)
            setSessionData(null);
        }
    });
    
    // Logic for this tab to report distractions
    let blurTimeout: NodeJS.Timeout;
    const triggerWarning = () => {
      clearTimeout(blurTimeout);
      blurTimeout = setTimeout(() => {
        updateDoc(sessionRef, { lastWarningAt: serverTimestamp() });
      }, 500);
    };

    const onBlur = () => triggerWarning();
    const onVisibilityChange = () => {
      if (document.hidden) triggerWarning();
    };
    
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibilityChange);

    // Clean up all listeners
    return () => {
      clearTimeout(blurTimeout);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      unsubscribe();
    };
  }, [sessionId, firestore]);
  
  if (!sessionData) {
      return (
           <div className="flex flex-col items-center justify-center h-dvh w-screen bg-background text-foreground text-center p-4">
                <div className="flex flex-col items-center gap-4 max-w-sm">
                    <CheckCircle className="h-16 w-16 text-green-500" />
                    <h1 className="text-3xl font-bold font-headline">Session Ended</h1>
                    <p className="text-muted-foreground">
                        The focus session has been completed or stopped. You can now close this window.
                    </p>
                </div>
            </div>
      )
  }

  const { timeLeft = 0, duration = 1, mode, isActive } = sessionData;
  const progress = duration > 0 ? ((duration - timeLeft) / duration) * 100 : 0;
  
  return (
    <div className="flex flex-col items-center justify-center h-dvh w-screen bg-background text-foreground text-center p-4">
        <div className="flex flex-col items-center gap-6 max-w-sm w-full">
            <div className={cn("flex items-center gap-2 p-2 rounded-md border text-sm", 
                wasDistracted 
                ? "bg-destructive/10 text-destructive border-destructive/20"
                : "bg-green-500/10 text-green-700 border-green-500/20"
            )}>
                 {wasDistracted ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                <span>{wasDistracted ? 'Focus Interrupted' : 'Focus Locked'}</span>
            </div>

            <h1 className="text-3xl font-bold font-headline">{getModeLabel(mode)}</h1>

             <div className="relative h-48 w-48">
                 <svg className="w-full h-full" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle
                        className="text-border"
                        stroke="currentColor"
                        strokeWidth="5"
                        cx="50" cy="50" r="45"
                        fill="transparent"
                    />
                    {/* Progress circle */}
                     <circle
                        className="text-primary"
                        stroke="currentColor"
                        strokeWidth="5"
                        cx="50" cy="50" r="45"
                        fill="transparent"
                        strokeDasharray={`${2 * Math.PI * 45}`}
                        strokeDashoffset={`${(2 * Math.PI * 45) * (1 - progress / 100)}`}
                        strokeLinecap="round"
                        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 1s linear' }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-5xl font-bold font-mono tracking-tighter">
                        {formatTime(timeLeft)}
                    </p>
                </div>
            </div>
             <div className="flex items-center gap-2">
                {isActive ? <Play className="h-5 w-5 text-primary animate-pulse" /> : <Pause className="h-5 w-5 text-muted-foreground" />}
                <span className={cn("text-lg font-semibold", isActive ? "text-primary" : "text-muted-foreground")}>
                    {isActive ? 'In Progress' : 'Paused'}
                </span>
             </div>
             <p className="text-xs text-muted-foreground/50 mt-4 max-w-xs">
                Your study session is being monitored. Please keep this screen active and avoid switching apps.
            </p>
        </div>
    </div>
  );
}
