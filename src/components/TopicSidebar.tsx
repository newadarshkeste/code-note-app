'use client';

import React, { useState } from 'react';
import { useNotes } from '@/context/NotesContext';
import { CodeNoteLogo } from '@/components/CodeNoteLogo';
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarInput,
  SidebarTrigger,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  Folder,
  File,
  Plus,
  FolderPlus,
  Search,
  FilePlus2,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

export function TopicSidebar() {
  const {
    filteredTopics,
    getNotesByTopic,
    setActiveNoteId,
    activeNoteId,
    addTopic,
    addNote,
    searchTerm,
    setSearchTerm,
  } = useNotes();
  const [isTopicDialogOpen, setIsTopicDialogOpen] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [currentTopicId, setCurrentTopicId] = useState<string | null>(null);

  const handleAddTopic = () => {
    if (newTopicName.trim()) {
      addTopic(newTopicName.trim());
      setNewTopicName('');
      setIsTopicDialogOpen(false);
    }
  };

  const handleAddNote = () => {
    if (newNoteTitle.trim() && currentTopicId) {
      addNote(currentTopicId, newNoteTitle.trim());
      setNewNoteTitle('');
      setIsNoteDialogOpen(false);
      setCurrentTopicId(null);
    }
  };

  const openNewNoteDialog = (topicId: string) => {
    setCurrentTopicId(topicId);
    setIsNoteDialogOpen(true);
  };
  
  const lowercasedFilter = searchTerm.toLowerCase();

  return (
    <>
      <SidebarHeader className="flex items-center justify-between">
        <CodeNoteLogo />
        <SidebarTrigger />
      </SidebarHeader>
      <div className="p-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <SidebarInput
            placeholder="Search notes..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <SidebarContent>
        <SidebarMenu>
          {filteredTopics.map((topic) => {
            const notes = getNotesByTopic(topic.id);
            const filteredNotes = searchTerm ? notes.filter(note => note.title.toLowerCase().includes(lowercasedFilter) || note.content.toLowerCase().includes(lowercasedFilter)) : notes;
            
            const isTopicNameMatch = topic.name.toLowerCase().includes(lowercasedFilter);

            if (!isTopicNameMatch && filteredNotes.length === 0) {
              return null;
            }

            return (
              <SidebarMenuItem key={topic.id} className="w-full">
                <Collapsible defaultOpen={!!searchTerm}>
                  <div className="flex items-center group">
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="w-full justify-start">
                        <div className="flex items-center gap-2 flex-grow overflow-hidden">
                          <Folder className="text-accent" />
                          <span className="truncate">{topic.name}</span>
                        </div>
                        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => openNewNoteDialog(topic.id)}>
                      <FilePlus2 className="h-4 w-4"/>
                    </Button>
                  </div>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {filteredNotes.map((note) => (
                        <SidebarMenuItem key={note.id}>
                          <SidebarMenuSubButton
                            onClick={() => setActiveNoteId(note.id)}
                            isActive={activeNoteId === note.id}
                            className={cn(
                              'w-full justify-start',
                              activeNoteId === note.id &&
                                'bg-sidebar-accent text-sidebar-accent-foreground'
                            )}
                          >
                            <File className="h-4 w-4" />
                            <span className="truncate">{note.title}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2"
          onClick={() => setIsTopicDialogOpen(true)}
        >
          <FolderPlus className="h-5 w-5 text-accent" />
          <span className="font-headline">New Topic</span>
        </Button>
      </SidebarFooter>

      {/* New Topic Dialog */}
      <Dialog open={isTopicDialogOpen} onOpenChange={setIsTopicDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Topic</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="topic-name" className="text-right">
                Name
              </Label>
              <Input
                id="topic-name"
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                className="col-span-3 font-body"
                onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button onClick={handleAddTopic} className="bg-accent hover:bg-accent/90 text-accent-foreground">Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* New Note Dialog */}
      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Note</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="note-title" className="text-right">
                Title
              </Label>
              <Input
                id="note-title"
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                className="col-span-3 font-body"
                onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button onClick={handleAddNote} className="bg-accent hover:bg-accent/90 text-accent-foreground">Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
