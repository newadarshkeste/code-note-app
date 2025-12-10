
'use client';

import React, { useCallback, useMemo, useEffect, useState } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    BackgroundVariant,
    useReactFlow,
    Node,
    Edge,
    ReactFlowInstance,
    Viewport,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useRecursionCards } from '@/context/RecursionCardsContext';
import { RecursionCardNode } from './RecursionCardNode';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export function RecursionCanvas() {
    const {
        nodes,
        nodesLoading,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        onEdgesDelete, // Get the new handler
        addCard,
        deleteCard,
        setSelectedCardId,
        activeBoard,
    } = useRecursionCards();

    const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
    const { fitView } = useReactFlow();

    const nodeTypes = useMemo(() => ({ recursionCard: RecursionCardNode }), []);
    
    useEffect(() => {
        if (rfInstance && nodes.length > 0) {
            setTimeout(() => fitView({ duration: 200, padding: 0.1 }), 100);
        }
    }, [activeBoard?.id, fitView, rfInstance]); 

    const handleAddCard = () => {
        if (!rfInstance) return;

        const { x, y, zoom } = rfInstance.getViewport();
        
        const centerX = -x / zoom + (rfInstance.width || 0) / (2 * zoom);
        const centerY = -y / zoom + (rfInstance.height || 0) / (2 * zoom);

        addCard({
            title: 'New Card',
            x: centerX,
            y: centerY,
        });
    };

    const handleNodesDelete = useCallback((deleted: Node[]) => {
        for (const node of deleted) {
            deleteCard(node.id);
        }
    }, [deleteCard]);
    
    const validNodes = useMemo(() => {
        return nodes.filter(node => 
            node.position && 
            typeof node.position.x === 'number' && 
            typeof node.position.y === 'number' &&
            !isNaN(node.position.x) &&
            !isNaN(node.position.y)
        );
    }, [nodes]);
    
    useEffect(() => {
        const invalidNodes = nodes.filter(n => !n.position || isNaN(n.position.x) || isNaN(n.position.y));
        if (invalidNodes.length > 0) {
            console.warn('Invalid nodes detected in state:', invalidNodes);
        }
    }, [nodes]);

    return (
        <div className="h-full w-full flex flex-col bg-background relative">
             <header className="flex-shrink-0 p-2 flex items-center justify-between border-b h-[65px] bg-card/80">
                <div className="flex items-center gap-2">
                   <Link href="/" passHref>
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                   </Link>
                    <h2 className="text-lg font-headline font-semibold truncate" title={activeBoard?.name}>
                        {activeBoard?.name || 'Canvas'}
                    </h2>
                </div>
                <Button onClick={handleAddCard} disabled={!rfInstance}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Card
                </Button>
            </header>
            <div className="flex-grow h-full w-full">
                {nodesLoading && (
                    <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}
                <ReactFlow
                    nodes={validNodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodesDelete={handleNodesDelete}
                    onEdgesDelete={onEdgesDelete} // Add this prop
                    nodeTypes={nodeTypes}
                    onNodeClick={(_, node) => setSelectedCardId(node.id)}
                    onPaneClick={() => setSelectedCardId(null)}
                    onInit={setRfInstance}
                    className="bg-background"
                >
                    <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
                    <Controls />
                    <MiniMap />
                </ReactFlow>
            </div>
        </div>
    );
}
