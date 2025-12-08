
'use client';

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { RecursionCard } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Lightbulb, RefreshCw, FileCode, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { useRecursionCards } from '@/context/RecursionCardsContext';

const typeStyles = {
    base: {
        icon: Lightbulb,
        badge: 'bg-green-500/20 text-green-700 border-green-500/30 hover:bg-green-500/30',
        body: 'border-green-500/50 bg-green-500/5',
        label: 'Base Case'
    },
    recursive: {
        icon: RefreshCw,
        badge: 'bg-blue-500/20 text-blue-700 border-blue-500/30 hover:bg-blue-500/30',
        body: 'border-blue-500/50 bg-blue-500/5',
        label: 'Recursive'
    },
    helper: {
        icon: FileCode,
        badge: 'bg-purple-500/20 text-purple-700 border-purple-500/30 hover:bg-purple-500/30',
        body: 'border-purple-500/50 bg-purple-500/5',
        label: 'Helper'
    }
}

export function RecursionCardNode({ data, selected }: NodeProps<RecursionCard>) {
    const { deleteCard } = useRecursionCards();
    const styles = typeStyles[data.type] || typeStyles.recursive;
    const Icon = styles.icon;

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        deleteCard(data.id);
    }

    return (
        <div 
            className={cn(
                "rounded-lg border-2 bg-card shadow-md transition-all duration-150 group",
                selected ? "ring-2 ring-primary ring-offset-2" : "",
                styles.body
            )}
            style={{ width: data.width ? `${data.width}px` : '256px' }}
        >
            <Handle type="target" position={Position.Top} className="!bg-primary" />
            <Handle type="source" position={Position.Top} className="!bg-primary" />
            <Handle type="target" position={Position.Right} className="!bg-primary" />
            <Handle type="source" position={Position.Right} className="!bg-primary" />
            <Handle type="target" position={Position.Bottom} className="!bg-primary" />
            <Handle type="source" position={Position.Bottom} className="!bg-primary" />
            <Handle type="target" position={Position.Left} className="!bg-primary" />
            <Handle type="source" position={Position.Left} className="!bg-primary" />
            
            <div className="p-3">
                <div className="flex justify-between items-start gap-2">
                    <h3 className="font-mono font-bold text-lg text-foreground flex-grow break-words">{data.title}</h3>
                    <div className="flex items-center flex-shrink-0">
                        <Badge className={cn("text-xs", styles.badge)}>
                            <Icon className="h-3 w-3 mr-1" />
                            {styles.label}
                        </Badge>
                         <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={handleDelete}
                        >
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                </div>
                {data.subtitle && <p className="text-xs text-muted-foreground mt-1 break-words">{data.subtitle}</p>}
            </div>
            {data.notes && (
                 <div className="border-t border-border/50 px-3 py-2">
                    <p className="text-xs text-muted-foreground italic break-words">{data.notes}</p>
                </div>
            )}
        </div>
    );
}
