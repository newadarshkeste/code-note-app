'use client';

import React from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { RecursionCardsProvider } from '@/context/RecursionCardsContext';
import { BoardsSidebar } from '@/components/recursion-cards/BoardsSidebar';
import { RecursionCanvas } from '@/components/recursion-cards/RecursionCanvas';
import { InspectorSidebar } from '@/components/recursion-cards/InspectorSidebar';
import { ReactFlowProvider } from 'reactflow';

export default function RecursionCardsPage() {
    return (
        <RecursionCardsProvider>
            <ReactFlowProvider>
                <div className="h-dvh w-screen flex text-foreground bg-background font-body overflow-hidden">
                    <ResizablePanelGroup direction="horizontal">
                        <ResizablePanel defaultSize={20} minSize={15} maxSize={25}>
                            <BoardsSidebar />
                        </ResizablePanel>
                        <ResizableHandle withHandle />
                        <ResizablePanel defaultSize={60} minSize={30}>
                            <RecursionCanvas />
                        </ResizablePanel>
                        <ResizableHandle withHandle />
                        <ResizablePanel defaultSize={20} minSize={15} maxSize={25}>
                            <InspectorSidebar />
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </div>
            </ReactFlowProvider>
        </RecursionCardsProvider>
    );
}
