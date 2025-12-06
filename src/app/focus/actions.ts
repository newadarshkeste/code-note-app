
'use server';

import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, App } from 'firebase-admin/app';

// This is a server action, so we use the Admin SDK for trusted updates.
// It ensures we don't have to worry about complex security rules for this.
let adminApp: App;
if (!getApps().length) {
    adminApp = initializeApp();
} else {
    adminApp = getApps()[0];
}

const db = getFirestore(adminApp);

export async function toggleTimer(sessionId: string, newIsActive: boolean) {
  if (!sessionId) return { success: false, error: 'Session ID is required.' };
  
  const sessionRef = doc(db, 'focusSessions', sessionId);
  
  try {
    await updateDoc(sessionRef, { isActive: newIsActive });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function resetTimer(sessionId: string) {
    if (!sessionId) return { success: false, error: 'Session ID is required.' };

    const sessionRef = doc(db, 'focusSessions', sessionId);
    
    try {
        const sessionSnap = await getDoc(sessionRef);
        if (!sessionSnap.exists()) {
            return { success: false, error: 'Session not found.' };
        }
        
        const sessionData = sessionSnap.data();
        let newTimeLeft = sessionData.focusDuration * 60; // Default to focus duration
        
        // Reset to the beginning of the *current* mode
        switch (sessionData.mode) {
            case 'focus':
                newTimeLeft = sessionData.focusDuration * 60;
                break;
            case 'break':
                newTimeLeft = sessionData.breakDuration * 60;
                break;
            case 'longBreak':
                newTimeLeft = sessionData.longBreakDuration * 60;
                break;
        }

        await updateDoc(sessionRef, { 
            timeLeft: newTimeLeft,
            isActive: false, // Always pause on reset
        });

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}


interface Settings {
    focus: number;
    break: number;
    longBreak: number;
    cycle: number;
}
export async function updateSettings(sessionId: string, settings: Settings) {
    if (!sessionId) return { success: false, error: 'Session ID is required.' };
    
    const sessionRef = doc(db, 'focusSessions', sessionId);
    
    try {
        await updateDoc(sessionRef, {
            focusDuration: settings.focus,
            breakDuration: settings.break,
            longBreakDuration: settings.longBreak,
            pomodorosPerCycle: settings.cycle,
        });
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
