
'use client';

import React, { useCallback, useState } from 'react';
import { useEditor, EditorContent, Editor, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import CodeBlock from '@tiptap/extension-code-block';
import TiptapImage from '@tiptap/extension-image';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ResizableImageNodeView } from './ResizableImage';
import TextStyle from '@tiptap/extension-text-style';
import { FontSize } from '@/lib/tiptap-font-size';
import { LineHeight } from '@/lib/tiptap-line-height';
import { ExcalidrawModal } from './ExcalidrawModal';
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';


import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code as CodeIcon,
  Link as LinkIcon,
  ImageIcon,
  ChevronDown,
  Baseline,
  Brush, // New icon for drawing
  Table as TableIcon,
} from 'lucide-react';
import { Toggle } from './ui/toggle';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';

// Extend the default Image extension to use our React component
const ResizableImageExtension = TiptapImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: element => element.getAttribute('width'),
        renderHTML: attributes => {
          if (!attributes.width) {
            return {};
          }
          return { width: attributes.width };
        },
      },
       style: {
        default: 'cursor: pointer;',
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageNodeView)
  },
});

const TablePopover = ({ onInsert }: { onInsert: (rows: number, cols: number) => void }) => {
    const [hovered, setHovered] = useState({ rows: 0, cols: 0 });

    return (
        <div className="flex flex-col p-2">
            <div className="grid grid-cols-10 gap-1">
                {Array.from({ length: 100 }).map((_, i) => {
                    const row = Math.floor(i / 10) + 1;
                    const col = (i % 10) + 1;
                    return (
                        <div
                            key={i}
                            onMouseEnter={() => setHovered({ rows: row, cols: col })}
                            onClick={() => onInsert(row, col)}
                            className={cn(
                                'h-4 w-4 border border-border cursor-pointer',
                                row <= hovered.rows && col <= hovered.cols ? 'bg-primary' : 'bg-background'
                            )}
                        />
                    );
                })}
            </div>
            <div className="text-center text-sm mt-2">
                {hovered.rows > 0 ? `${hovered.rows} x ${hovered.cols}` : 'Insert Table'}
            </div>
        </div>
    );
};


interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const EditorToolbar = ({ editor }: { editor: Editor | null }) => {
  const [isDrawModalOpen, setIsDrawModalOpen] = useState(false);

  if (!editor) {
    return null;
  }

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);
    if (url === null) return;
    if (url === '') {
        editor.chain().focus().extendMarkRange('link').unsetLink().run();
        return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (readerEvent) => {
                const url = readerEvent.target?.result;
                if (url) {
                    editor.chain().focus().setImage({ src: url as string }).run();
                }
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
  }, [editor]);
  
  const handleSaveDrawing = (dataUrl: string) => {
      if (editor) {
          editor.chain().focus().setImage({ src: dataUrl }).run();
      }
  };

  const fontSizes = ['12px', '14px', '16px', '18px', '24px', '30px', '36px'];
  const currentFontSize = editor.getAttributes('textStyle').fontSize || '16px';
  
  const lineHeights = [
    { label: 'Single', value: '1' },
    { label: '1.15', value: '1.15' },
    { label: '1.5', value: '1.5' },
    { label: 'Double', value: '2' },
  ];
  const currentLineHeight = editor.getAttributes('paragraph').lineHeight || '1';

  return (
    <>
      <div className="border-b p-2 flex flex-wrap items-center gap-1">
       <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-9 px-2.5">
            {parseInt(currentFontSize)}
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {fontSizes.map(size => (
            <DropdownMenuItem
              key={size}
              onClick={() => editor.chain().focus().setFontSize(size).run()}
              className={editor.isActive('textStyle', { fontSize: size }) ? 'is-active' : ''}
            >
              {parseInt(size)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
       <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
                <Baseline className="h-5 w-5" />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
            {lineHeights.map(({ label, value }) => (
                <DropdownMenuItem
                    key={value}
                    onClick={() => editor.chain().focus().setLineHeight(value).run()}
                    className={editor.isActive({ lineHeight: value }) ? 'is-active' : ''}
                >
                    {label}
                </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
       </DropdownMenu>
      <Toggle
        size="sm"
        pressed={editor.isActive('bold')}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('italic')}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('underline')}
        onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon className="h-4 w-4" />
      </Toggle>
       <Toggle
        size="sm"
        pressed={editor.isActive('strike')}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="h-4 w-4" />
      </Toggle>
       <Toggle
        size="sm"
        pressed={editor.isActive('heading', { level: 1 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 className="h-4 w-4" />
      </Toggle>
       <Toggle
        size="sm"
        pressed={editor.isActive('heading', { level: 2 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="h-4 w-4" />
      </Toggle>
       <Toggle
        size="sm"
        pressed={editor.isActive('heading', { level: 3 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('bulletList')}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('orderedList')}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('blockquote')}
        onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('codeBlock')}
        onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <CodeIcon className="h-4 w-4" />
      </Toggle>
       <Toggle
        size="sm"
        pressed={editor.isActive('link')}
        onPressedChange={setLink}
      >
        <LinkIcon className="h-4 w-4" />
      </Toggle>
       <Toggle
        size="sm"
        onPressedChange={addImage}
      >
        <ImageIcon className="h-4 w-4" />
      </Toggle>
       <Toggle
        size="sm"
        onPressedChange={() => setIsDrawModalOpen(true)}
      >
        <Brush className="h-4 w-4" />
      </Toggle>
      <Popover>
        <PopoverTrigger asChild>
            <Toggle size="sm" pressed={editor.isActive('table')}>
                <TableIcon className="h-4 w-4" />
            </Toggle>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
            <TablePopover onInsert={(rows, cols) => editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run()} />
        </PopoverContent>
      </Popover>
    </div>
    <ExcalidrawModal
        isOpen={isDrawModalOpen}
        onClose={() => setIsDrawModalOpen(false)}
        onSave={handleSaveDrawing}
    />
    </>
  );
};

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        image: false,
        textStyle: false, // We'll configure TextStyle separately now
        paragraph: {
            HTMLAttributes: {
                style: `line-height: 1`, // Set a default line height
            },
        },
        // This is the key fix: it tells Tiptap to keep the marks (like font size)
        // when creating a new line or splitting a block.
        history: {
          depth: 100,
        },
      }),
      TextStyle.configure({
        // This ensures TextStyle can be used by other extensions that need it.
        HTMLAttributes: {
          class: null,
        },
      }),
      FontSize.configure({
          types: ['textStyle'],
      }),
      LineHeight.configure({
          types: ['paragraph', 'heading'],
      }),
      CodeBlock.configure({
        HTMLAttributes: {
            class: 'font-code'
        }
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      ResizableImageExtension.configure({
        inline: true,
        allowBase64: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'ProseMirror',
      },
      handlePaste: (view, event, slice) => {
        const items = Array.from(event.clipboardData?.items || []);
        for (const item of items) {
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (file) {
              const reader = new FileReader();
              reader.onload = (readerEvent) => {
                const url = readerEvent.target?.result;
                if (url) {
                  view.dispatch(
                    view.state.tr.replaceSelectionWith(
                      view.state.schema.nodes.image.create({
                        src: url,
                      })
                    )
                  );
                }
              };
              reader.readAsDataURL(file);
            }
            return true; // We've handled the paste
          }
        }
        return false; // Let Tiptap handle other paste events
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });
  
  React.useEffect(() => {
    if (editor) {
      const isSame = editor.getHTML() === value;
      if (!isSame) {
        editor.commands.setContent(value, false);
      }
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="h-full w-full flex flex-col">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} className="flex-grow overflow-y-auto" />
      <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
        <div className="bg-background border rounded-md shadow-md p-1 flex gap-1">
           <Toggle
                size="sm"
                pressed={editor.isActive('bold')}
                onPressedChange={() => editor.chain().focus().toggleBold().run()}
            >
                <Bold className="h-4 w-4" />
            </Toggle>
            <Toggle
                size="sm"
                pressed={editor.isActive('italic')}
                onPressedChange={() => editor.chain().focus().toggleItalic().run()}
            >
                <Italic className="h-4 w-4" />
            </Toggle>
            <Toggle
                size="sm"
                pressed={editor.isActive('strike')}
                onPressedChange={() => editor.chain().focus().toggleStrike().run()}
            >
                <Strikethrough className="h-4 w-4" />
            </Toggle>
        </div>
      </BubbleMenu>
    </div>
  );
}

  
