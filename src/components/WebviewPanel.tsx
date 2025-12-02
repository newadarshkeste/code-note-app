'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Globe } from 'lucide-react';

const isValidUrl = (urlString: string) => {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
};

export function WebviewPanel() {
  const [inputValue, setInputValue] = useState('https://chat.lmsys.org/');
  const [activeUrl, setActiveUrl] = useState('https://chat.lmsys.org/');

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidUrl(inputValue)) {
      setActiveUrl(inputValue);
    } else if (isValidUrl(`https://${inputValue}`)) {
      setActiveUrl(`https://${inputValue}`);
      setInputValue(`https://${inputValue}`);
    } else {
      alert('Please enter a valid URL (e.g., https://example.com)');
    }
  };

  return (
    <div className="hidden lg:flex flex-col w-[450px] min-w-[300px] max-w-[600px] border-l bg-background p-2 resize-x overflow-auto">
      <Card className="flex-1 flex flex-col h-full">
        <div className="p-2 border-b">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              value={inputValue}
              onChange={handleUrlChange}
              placeholder="Enter a website URL"
              className="h-8"
            />
            <Button type="submit" size="sm">
              Go
            </Button>
          </form>
        </div>
        <div className="flex-1 w-full h-full bg-background relative">
          <iframe
            key={activeUrl}
            src={activeUrl}
            className="w-full h-full border-0"
            title="Webview"
            sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-presentation"
          />
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-background/5 via-transparent to-transparent" />
        </div>
      </Card>
    </div>
  );
}
