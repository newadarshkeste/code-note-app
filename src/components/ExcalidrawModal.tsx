
'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { ExcalidrawElement, ExcalidrawImperativeAPIRef } from '@excalidraw/excalidraw/types/types';
import dynamic from 'next/dynamic';

const Excalidraw = dynamic(
  async () => (await import('@excalidraw/excalidraw')).Excalidraw,
  { ssr: false }
);

interface ExcalidrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
}

export function ExcalidrawModal({ isOpen, onClose, onSave }: ExcalidrawModalProps) {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const [elements, setElements] = useState<readonly ExcalidrawElement[]>([]);

  useEffect(() => {
    if (isOpen) {
      setElements([]); // Reset canvas on open
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!excalidrawAPI) return;

    // The exportToCanvas function is the recommended way to get the canvas for export
    const canvas = await excalidrawAPI.exportToCanvas({
      elements: excalidrawAPI.getSceneElements(),
      appState: excalidrawAPI.getAppState(),
      getDimensions: () => ({ width: 750, height: 750 }), // Specify dimensions
    });

    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Draw a Diagram</DialogTitle>
        </DialogHeader>
        <div className="flex-grow min-h-0">
            {isOpen && ( // Only render Excalidraw when the modal is open
                 <Excalidraw
                    excalidrawAPI={(api: any) => setExcalidrawAPI(api)}
                    initialData={{ elements }}
                    onChange={(els) => setElements(els)}
                />
            )}
        </div>
        <DialogFooter className="p-4 border-t">
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave}>Save and Insert</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
