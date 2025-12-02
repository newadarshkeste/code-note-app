'use client';

import React, { useState } from 'react';
import { useNotes } from '@/context/NotesContext';
import { CodeNoteLogo } from '@/components/CodeNoteLogo';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ThemeToggle } from './ThemeToggle';
import { Folder, Search, Trash2, Plus, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';

export function TopicSidebar() {
  const {
    topics,
    activeTopicId,
    setActiveTopicId,
    addTopic,
    searchTerm,
    setSearchTerm,
    deleteTopic,
    updateTopic,
  } = useNotes();
  const [isTopicDialogOpen, setIsTopicDialogOpen] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [renameTopic, setRenameTopic] = useState<typeof topics[number] | null>(null);
  const [renamingName, setRenamingName] = useState('');

  const handleAddTopic = () => {
    if (newTopicName.trim()) {
      addTopic(newTopicName.trim());
      setNewTopicName('');
      setIsTopicDialogOpen(false);
    }
  };

  const handleRenameTopic = () => {
    if (renameTopic && renamingName.trim()) {
        updateTopic(renameTopic.id, renamingName.trim());
        setRenameTopic(null);
        setRenamingName('');
    }
  };

  const filteredTopics = topics.filter(topic => 
    topic.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <>
      <div className="h-full flex flex-col bg-card/80 border-r">
        <header className="flex-shrink-0 p-4 flex items-center justify-between border-b h-[65px]">
            <CodeNoteLogo />
            <ThemeToggle />
        </header>

        <div className="p-4 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search topics..."
              className="pl-9 h-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <ScrollArea className="flex-grow min-h-0">
            <nav className="p-4 pt-0">
                <ul>
                {filteredTopics.map((topic) => (
                    <li key={topic.id} className="group flex items-center gap-1">
                        <Button
                            variant="ghost"
                            onClick={() => setActiveTopicId(topic.id)}
                            className={cn(
                                "w-full justify-start gap-2 h-10 text-sm",
                                activeTopicId === topic.id ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-accent'
                            )}
                        >
                            <Folder className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate flex-grow text-left">{topic.name}</span>
                        </Button>
                        <div className="flex-shrink-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setRenameTopic(topic); setRenamingName(topic.name); }}>
                                <Pencil className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                    This will permanently delete the topic "{topic.name}" and all its notes. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteTopic(topic.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </li>
                ))}
                </ul>
            </nav>
        </ScrollArea>

        <footer className="p-4 border-t flex-shrink-0">
          <Button
            className="w-full justify-center gap-2"
            onClick={() => setIsTopicDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            <span>New Topic</span>
          </Button>
        </footer>
      </div>

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
            <Button onClick={handleAddTopic} className="bg-primary hover:bg-primary/90 text-primary-foreground">Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Topic Dialog */}
      <Dialog open={!!renameTopic} onOpenChange={(isOpen) => !isOpen && setRenameTopic(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Topic</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rename-topic-name" className="text-right">
                New Name
              </Label>
              <Input
                id="rename-topic-name"
                value={renamingName}
                onChange={(e) => setRenamingName(e.target.value)}
                className="col-span-3 font-body"
                onKeyDown={(e) => e.key === 'Enter' && handleRenameTopic()}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="secondary" onClick={() => setRenameTopic(null)}>Cancel</Button>
            </DialogClose>
            <Button onClick={handleRenameTopic} className="bg-primary hover:bg-primary/90 text-primary-foreground">Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
