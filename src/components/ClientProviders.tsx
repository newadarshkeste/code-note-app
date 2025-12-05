
'use client';

import { AuthProvider } from "@/context/AuthContext";
import { NotesProvider } from "@/context/NotesContext";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <NotesProvider>
        {children}
      </NotesProvider>
    </AuthProvider>
  );
}
