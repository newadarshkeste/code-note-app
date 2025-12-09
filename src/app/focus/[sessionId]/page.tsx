'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, updateDoc, serverTimestamp, onSnapshot, deleteDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Smartphone, CheckCircle, AlertTriangle } from 'lucide-react';

export default function FocusSessionPage() {
  const { sessionId } = useParams();
  const firestore = useFirestore();

  useEffect(() => {
    if (!sessionId || typeof sessionId !== 'string' || !firestore) return;

    const sessionRef = doc(firestore, 'focusSessions', sessionId);
    
    let blurTimeout: NodeJS.Timeout;

    const triggerWarning = () => {
      // Debounce the warning to avoid spamming Firestore on rapid focus/blur events
      clearTimeout(blurTimeout);
      blurTimeout = setTimeout(() => {
        updateDoc(sessionRef, { lastWarningAt: serverTimestamp() });
      }, 500);
    };

    const onBlur = () => {
        console.log('Window blurred');
        triggerWarning();
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        console.log('Document hidden');
        triggerWarning();
      }
    };
    
    // Check if parent timer is still active
    const unsubscribe = onSnapshot(sessionRef, (doc) => {
        if (!doc.exists()) {
            // If the session is deleted (e.g., timer paused/reset), clean up listeners
            window.removeEventListener('blur', onBlur);
            document.removeEventListener('visibilitychange', onVisibilityChange);
            // Optionally, redirect or show a "session ended" message
        }
    });

    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibilityChange);

    // Clean up when the component unmounts or the session ends
    return () => {
      clearTimeout(blurTimeout);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      unsubscribe();
    };
  }, [sessionId, firestore]);

  return (
    <div className="flex flex-col items-center justify-center h-dvh w-screen bg-background text-foreground text-center p-4">
        <div className="flex flex-col items-center gap-4 max-w-sm">
            <Smartphone className="h-16 w-16 text-primary" />
            <h1 className="text-3xl font-bold font-headline">Focus Lock is Active</h1>
            <p className="text-muted-foreground">
                Your study session is being monitored. Please keep this screen active and avoid switching apps or locking your phone.
            </p>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 text-green-700 border border-green-500/20">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Focus is Locked</span>
            </div>
             <p className="text-xs text-muted-foreground/50 mt-4">
                You can now return to your main study window. This page will automatically detect if you get distracted.
            </p>
        </div>
    </div>
  );
}
