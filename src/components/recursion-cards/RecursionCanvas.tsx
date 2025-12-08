
'use client';

import React, { useCallback, useMemo } from 'react';
import ReactFlow, { Background, Controls, MiniMap, BackgroundVariant } from 'reactflow';
import 'reactflow/dist/style.css';
import { useRecursionCards } from '@/context/RecursionCardsContext';
import { RecursionCardNode } from './RecursionCardNode';

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
    } = useRecursionCards();

    const nodeTypes = useMemo(() => ({ recursionCard: RecursionCardNode }), []);
    
    const onNodeDragStop = useCallback((event: React.MouseEvent, node: any) => {
        updateCard(node.id, { position: node.position });
    }, [updateCard]);
    
    const onPaneDoubleClick = useCallback((event: React.MouseEvent) => {
        const { x, y } = event;
        // This is a rough approximation. React Flow has functions to convert screen to flow position.
        // For now, this is good enough to get started.
        addCard({
            title: "f(n)",
            position: { x: event.clientX - 300, y: event.clientY - 100 }
        });
    }, [addCard]);

    return (
        <div className="h-full w-full bg-background">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeDragStop={onNodeDragStop}
                onPaneDoubleClick={onPaneDoubleClick}
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
    );
}
