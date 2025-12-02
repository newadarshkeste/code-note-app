'use client';

import { NotesProvider } from '@/context/NotesContext';
import { AppLayout } from '@/components/AppLayout';

export default function Home() {
  return (
    <NotesProvider>
      <AppLayout />
    </NotesProvider>
  );
}
