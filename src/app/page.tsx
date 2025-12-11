import { ClientProviders } from '@/components/ClientProviders';
import AppEntry from '@/app/app-entry';

// This ensures the page is not statically prerendered at build time,
// which prevents server-side execution of client-side (Genkit) code.
export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <ClientProviders>
      <AppEntry />
    </ClientProviders>
  );
}
