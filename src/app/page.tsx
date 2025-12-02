'use client';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { NotesProvider } from '@/context/NotesContext';
import { AppLayout } from '@/components/AppLayout';
import { LoginPage } from '@/components/LoginPage';
import { Loader2 } from 'lucide-react';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-dvh w-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <NotesProvider>
      <AppLayout />
    </NotesProvider>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
