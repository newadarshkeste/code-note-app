
'use client';

import React, { useCallback } from 'react';
import { useEditor, EditorContent, Editor, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import CodeBlock from '@tiptap/extension-code-block';
import TiptapImage from '@tiptap/extension-image';
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
  Image as ImageIcon,
} from 'lucide-react';
import { Toggle } from './ui/toggle';
import { Button } from './ui/button';
import { Input } from './ui/input';

// Extend the default Image extension to add resizing attributes
const ResizableImage = TiptapImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
      },
      height: {
        default: null,
      },
       style: {
        default: 'cursor: pointer;',
      },
    };
  },
});


interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const EditorToolbar = ({ editor }: { editor: Editor | null }) => {
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

  return (
    <div className="border-b p-2 flex flex-wrap items-center gap-1">
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
    </div>
  );
};

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
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
      ResizableImage.configure({
        inline: true,
        allowBase64: true,
      }),
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
    </div>
  );
}

    
