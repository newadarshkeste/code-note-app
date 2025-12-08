
'use client';

import React from 'react';
import { useRecursionCards } from '@/context/RecursionCardsContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RecursionCard } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';

export function InspectorSidebar() {
    const { selectedCardId, nodes, updateCard } = useRecursionCards();

    const selectedCard = React.useMemo(() => {
        if (!selectedCardId) return null;
        const node = nodes.find(n => n.id === selectedCardId);
        return node ? node.data : null;
    }, [selectedCardId, nodes]);

    const handleUpdate = (field: keyof RecursionCard, value: any) => {
        if (selectedCardId) {
            updateCard(selectedCardId, { [field]: value });
        }
    };
    
    if (!selectedCard) {
        return (
            <div className="h-full w-full flex flex-col bg-card/80 border-l">
                <header className="flex-shrink-0 p-4 border-b h-[65px]">
                    <h2 className="text-lg font-headline font-semibold">Inspector</h2>
                </header>
                <div className="flex-grow flex items-center justify-center p-4 text-center">
                    <p className="text-sm text-muted-foreground">Select a card to see its details.</p>
                </div>
            </div>
        );
    }


    return (
        <div className="h-full w-full flex flex-col bg-card/80 border-l">
            <header className="flex-shrink-0 p-4 border-b h-[65px]">
                <h2 className="text-lg font-headline font-semibold">Inspector</h2>
            </header>
            
            <ScrollArea className="flex-grow min-h-0">
                <div className="p-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="card-title">Title</Label>
                        <Input
                            id="card-title"
                            value={selectedCard.title || ''}
                            onChange={(e) => handleUpdate('title', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="card-subtitle">Subtitle</Label>
                        <Input
                            id="card-subtitle"
                            value={selectedCard.subtitle || ''}
                            onChange={(e) => handleUpdate('subtitle', e.target.value)}
                        />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="card-type">Type</Label>
                        <Select value={selectedCard.type} onValueChange={(value) => handleUpdate('type', value)}>
                            <SelectTrigger id="card-type">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="recursive">Recursive Case</SelectItem>
                                <SelectItem value="base">Base Case</SelectItem>
                                <SelectItem value="helper">Helper</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="card-notes">Notes</Label>
                        <Textarea
                            id="card-notes"
                            placeholder="Add explanations or details..."
                            value={selectedCard.notes || ''}
                            onChange={(e) => handleUpdate('notes', e.target.value)}
                            rows={6}
                        />
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}
