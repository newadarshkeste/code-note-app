'use client';

import React, { useCallback, useMemo } from 'react';
import ReactFlow, { Background, Controls, MiniMap, BackgroundVariant, useReactFlow } from 'reactflow';
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

    const reactFlowInstance = useReactFlow();
    const nodeTypes = useMemo(() => ({ recursionCard: RecursionCardNode }), []);
    
    const onNodeDragStop = useCallback((event: React.MouseEvent, node: any) => {
        updateCard(node.id, { position: node.position });
    }, [updateCard]);
    
    const onPaneDoubleClick = useCallback((event: React.MouseEvent) => {
        const position = reactFlowInstance.screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
        });
        addCard({
            title: "f(n)",
            position: position
        });
    }, [reactFlowInstance, addCard]);

    return (
        <div className="h-full w-full bg-background" onDoubleClick={onPaneDoubleClick}>
            <ReactFlow
                nodes={nodes}
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
    );
}
