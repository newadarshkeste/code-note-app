
'use client';

import React, { useRef, useCallback } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { cn } from '@/lib/utils';

export const ResizableImageNodeView = ({ node, updateAttributes, selected }: NodeViewProps) => {
  const imgRef = useRef<HTMLImageElement>(null);
  
  const handleMouseDown = useCallback((
    event: React.MouseEvent<HTMLDivElement>, 
    handle: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  ) => {
    event.preventDefault();
    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = imgRef.current?.offsetWidth || 0;
    const startHeight = imgRef.current?.offsetHeight || 0;
    
    const handleMouseMove = (e: MouseEvent) => {
      let newWidth = startWidth;
      let newHeight = startHeight;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (handle.includes('right')) {
        newWidth = startWidth + dx;
      }
      if (handle.includes('left')) {
        newWidth = startWidth - dx;
      }
      if (handle.includes('bottom')) {
        newHeight = startHeight + dy;
      }
      if (handle.includes('top')) {
        newHeight = startHeight - dy;
      }

      // Maintain aspect ratio
      if (newWidth !== startWidth) {
        const aspectRatio = startHeight / startWidth;
        newHeight = newWidth * aspectRatio;
      } else if (newHeight !== startHeight) {
        const aspectRatio = startWidth / startHeight;
        newWidth = newHeight * aspectRatio;
      }
      
      updateAttributes({ width: Math.max(50, newWidth) });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [updateAttributes]);
  
  return (
    <NodeViewWrapper className="resizable-image-wrapper" data-drag-handle>
      <div className={cn("image-container", { 'ProseMirror-selectednode': selected })} >
        <img
          ref={imgRef}
          src={node.attrs.src}
          alt={node.attrs.alt}
          title={node.attrs.title}
          width={node.attrs.width}
          className="w-full h-auto"
        />
        {selected && (
            <>
              <div className="resize-handle bottom-right" onMouseDown={e => handleMouseDown(e, 'bottom-right')}></div>
              <div className="resize-handle bottom-left" onMouseDown={e => handleMouseDown(e, 'bottom-left')}></div>
              <div className="resize-handle top-right" onMouseDown={e => handleMouseDown(e, 'top-right')}></div>
              <div className="resize-handle top-left" onMouseDown={e => handleMouseDown(e, 'top-left')}></div>
            </>
        )}
      </div>
    </NodeViewWrapper>
  );
};
