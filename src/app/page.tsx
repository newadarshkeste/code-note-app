'use client';

import { useAuth } from '@/context/AuthContext';
import { AppLayout } from '@/components/AppLayout';
import { LoginPage } from '@/components/LoginPage';
import { Loader2 } from 'lucide-react';
import { ClientProviders } from '@/components/ClientProviders';

export const dynamic = 'force-dynamic';

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

  return <AppLayout />;
}

export default function Home() {
  return (
    <ClientProviders>
      <App />
    </ClientProviders>
  )
}
