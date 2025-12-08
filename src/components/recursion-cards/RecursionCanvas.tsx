
'use client';

import React, { useCallback, useMemo, useEffect } from 'react';
import ReactFlow, { Background, Controls, MiniMap, BackgroundVariant, useReactFlow } from 'reactflow';
import 'reactflow/dist/style.css';
import { useRecursionCards } from '@/context/RecursionCardsContext';
import { RecursionCardNode } from './RecursionCardNode';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export function RecursionCanvas() {
    const {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        addCard,
        updateCard,
        setSelectedCardId,
        activeBoard,
    } = useRecursionCards();

    const reactFlowInstance = useReactFlow();
    const nodeTypes = useMemo(() => ({ recursionCard: RecursionCardNode }), []);
    
    useEffect(() => {
        // When the number of nodes changes (i.e., a card is added or removed),
        // adjust the view to fit all nodes.
        if (nodes.length > 0) {
            reactFlowInstance.fitView({ duration: 200, padding: 0.1 });
        }
    }, [nodes.length]);

    const onNodeDragStop = useCallback((event: React.MouseEvent, node: any) => {
        updateCard(node.id, { x: node.position.x, y: node.position.y });
    }, [updateCard]);
    
    const onPaneDoubleClick = useCallback((event: React.MouseEvent) => {
        const position = reactFlowInstance.screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
        });
        addCard({
            title: "f(n)",
            x: position.x,
            y: position.y,
        });
    }, [reactFlowInstance, addCard]);

    const handleAddCard = () => {
        const { x, y, zoom } = reactFlowInstance.getViewport();
        const centerX = -x / zoom + (reactFlowInstance.width / 2) / zoom;
        const centerY = -y / zoom + (reactFlowInstance.height / 2) / zoom;
        
        addCard({
            title: 'New Card',
            x: centerX,
            y: centerY,
        });
    };

    const validNodes = useMemo(() => {
        return nodes.filter(node => 
            node.position && 
            typeof node.position.x === 'number' && 
            typeof node.position.y === 'number' &&
            !isNaN(node.position.x) &&
            !isNaN(node.position.y)
        );
    }, [nodes]);

    return (
        <div className="h-full w-full flex flex-col bg-background">
            <header className="flex-shrink-0 p-2 flex items-center justify-between border-b h-[65px] bg-card/80">
                <h2 className="text-lg font-headline font-semibold truncate" title={activeBoard?.name}>
                    {activeBoard?.name || 'Canvas'}
                </h2>
                <Button onClick={handleAddCard}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Card
                </Button>
            </header>
            <div className="flex-grow h-full w-full" onDoubleClick={onPaneDoubleClick}>
                <ReactFlow
                    nodes={validNodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeDragStop={onNodeDragStop}
                    nodeTypes={nodeTypes}
                    onNodeClick={(_, node) => setSelectedCardId(node.id)}
                    onPaneClick={() => setSelectedCardId(null)}
                    fitView
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
