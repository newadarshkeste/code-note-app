
'use client';

import React from 'react';
import { quotes } from '@/lib/quotes';

export function DailyQuote() {
  const getDayOfYear = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = (now.getTime() - start.getTime()) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  };

  const dayOfYear = getDayOfYear();
  const quoteIndex = dayOfYear % quotes.length;
  const { quote, author } = quotes[quoteIndex];

  return (
    <blockquote className="text-center">
      <p className="text-sm italic">"{quote}"</p>
      <cite className="text-xs text-muted-foreground mt-1 block not-italic">— {author}</cite>
    </blockquote>
  );
}
