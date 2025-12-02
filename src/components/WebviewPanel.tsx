'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MessageSquare, Bot } from 'lucide-react';

const websites = [
  { name: 'LMarena', url: 'https://chat.lmsys.org/', icon: <Bot /> },
  { name: 'ChatGPT', url: 'https://chatgpt.com/', icon: <MessageSquare /> },
];

export function WebviewPanel() {
  const [activeSite, setActiveSite] = useState(websites[0]);

  return (
    <div className="hidden lg:flex flex-col w-[450px] min-w-[300px] max-w-[600px] border-l bg-background p-2 resize-x overflow-auto">
      <Card className="flex-1 flex flex-col h-full">
        <div className="flex items-center gap-2 p-2 border-b">
          {websites.map((site) => (
            <Button
              key={site.name}
              variant={activeSite.name === site.name ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveSite(site)}
              className="flex-1"
            >
              {site.icon}
              <span className="ml-2">{site.name}</span>
            </Button>
          ))}
        </div>
        <div className="flex-1 w-full h-full bg-background relative">
            <iframe
                key={activeSite.url}
                src={activeSite.url}
                className="w-full h-full border-0"
                title={activeSite.name}
                sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-presentation"
            />
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-background/5 via-transparent to-transparent" />
        </div>
      </Card>
    </div>
  );
}
