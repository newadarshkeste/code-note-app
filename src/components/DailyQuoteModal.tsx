
'use client';

import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { getDailyQuote } from '@/app/actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Loader2, Quote } from 'lucide-react';
import { format } from 'date-fns';

export function DailyQuoteModal() {
  const [lastShownDate, setLastShownDate] = useLocalStorage('dailyQuoteLastShown', '');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [quoteData, setQuoteData] = useState<{ quote: string; author: string } | null>(null);

  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');

    const shouldShow = () => {
      // This function now runs only on the client, so window is available.
      if (typeof window !== 'undefined') {
        const storedDate = localStorage.getItem('dailyQuoteLastShown');
        // The stored value includes quotes, so we need to parse it.
        const parsedDate = storedDate ? JSON.parse(storedDate) : '';
        if (parsedDate !== today) {
          return true;
        }
      }
      return false;
    };

    if (shouldShow()) {
      setIsLoading(true);
      setIsOpen(true);
      getDailyQuote('motivation for programmers')
        .then(response => {
          if (response.success && response.quote) {
            setQuoteData(response.quote);
            setLastShownDate(today);
          } else {
            console.error('Failed to get daily quote:', response.error);
            // Don't show the modal if the API fails
            setIsOpen(false);
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Quote className="h-5 w-5 text-primary" />
            Your Daily Dose of Motivation
          </DialogTitle>
          <DialogDescription>
            A thought for your day of coding and learning.
          </DialogDescription>
        </DialogHeader>
        <div className="py-6 text-center">
          {isLoading ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            quoteData && (
              <blockquote className="space-y-4">
                <p className="text-lg italic">"{quoteData.quote}"</p>
                <cite className="block text-sm text-muted-foreground not-italic">— {quoteData.author}</cite>
              </blockquote>
            )
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button">
              Start Coding
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
