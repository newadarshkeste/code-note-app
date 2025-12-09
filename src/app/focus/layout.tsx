
'use client';

import { ClientProviders } from '@/components/ClientProviders';

export default function FocusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClientProviders>{children}</ClientProviders>;
}
