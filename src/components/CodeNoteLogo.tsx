import { BookMarked } from 'lucide-react';

export function CodeNoteLogo() {
  return (
    <div className="flex items-center gap-2">
      <BookMarked className="h-6 w-6 text-primary" />
      <h1 className="font-headline text-xl font-semibold text-foreground">
        CodeNote
      </h1>
    </div>
  );
}
