'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useNotes } from '@/context/NotesContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
} from "@/components/ui/alert-dialog";
import { Folder, Search, Trash2, Plus, Pencil, Share2, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';
import { Skeleton } from './ui/skeleton';
import { usePathname } from 'next/navigation';
import { Separator } from './ui/separator';
import type { Topic } from '@/lib/types';


function TopicActionsMenu({ topic, onRename, onDelete }: { topic: Topic, onRename: (topic: Topic) => void, onDelete: (topicId: string) => void }) {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    return (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Topic options</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem onClick={() => onRename(topic)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        <span>Rename</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className="text-destructive focus:text-destructive focus:bg-destructive/10"
                        onClick={() => setIsDeleteDialogOpen(true)}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete the topic "{topic.name}" and all its notes. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(topic.id)} className="bg-destructive hover:bg-destructive/90">
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export function TopicSidebar() {
  const {
    topics,
    topicsLoading,
    activeTopicId,
    setActiveTopicId,
    addTopic,
    searchTerm,
    setSearchTerm,
    deleteTopic,
    updateTopic,
  } = useNotes();
  const pathname = usePathname();
  const [isTopicDialogOpen, setIsTopicDialogOpen] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [renameTopic, setRenameTopic] = useState<typeof topics[number] | null>(null);
  const [renamingName, setRenamingName] = useState('');

  const handleAddTopic = async () => {
    if (newTopicName.trim()) {
      await addTopic(newTopicName.trim());
      setNewTopicName('');
      setIsTopicDialogOpen(false);
    }
  };

  const handleRenameTopic = async () => {
    if (renameTopic && renamingName.trim()) {
        await updateTopic(renameTopic.id, renamingName.trim());
        setRenameTopic(null);
        setRenamingName('');
    }
  };
  
  const handleSelectTopic = (topicId: string) => {
    setActiveTopicId(topicId);
  };


  const filteredTopics = topics.filter(topic => 
    topic.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="h-full w-full flex flex-col bg-card/80">
        <div className="p-4 flex-shrink-0 space-y-4 border-b">
            <h2 className="text-lg font-headline font-semibold">Topics</h2>
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
            <nav className="p-4 pt-2">
                <Link href="/recursion-cards" passHref>
                   <Button
                        variant="ghost"
                        className={cn(
                            "w-full justify-start gap-2 h-10 text-sm",
                            pathname === '/recursion-cards' ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-accent'
                        )}
                    >
                        <Share2 className="h-4 w-4 flex-shrink-0" />
                        Recursion Cards
                    </Button>
                </Link>

                <Separator className="my-2" />
                 
                 {topicsLoading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ) : (
                <ul>
                {filteredTopics.map((topic) => (
                    <li key={topic.id} className="group flex items-center rounded-md hover:bg-accent/80">
                        <Button
                            variant="ghost"
                            onClick={() => handleSelectTopic(topic.id)}
                            className={cn(
                                "flex-grow justify-start gap-2 h-10 text-sm",
                                activeTopicId === topic.id ? 'bg-primary/10 text-primary font-semibold' : ''
                            )}
                        >
                            <Folder className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate flex-grow text-left">{topic.name}</span>
                        </Button>
                         <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                           <TopicActionsMenu 
                                topic={topic}
                                onRename={(t) => { setRenameTopic(t); setRenamingName(t.name); }}
                                onDelete={deleteTopic}
                           />
                        </div>
                    </li>
                ))}
                </ul>
                )}
                 {topics.length === 0 && !topicsLoading && (
                    <p className="text-sm text-center text-muted-foreground pt-4">No topics created yet.</p>
                 )}
            </nav>
        </ScrollArea>

        <footer className="p-4 border-t flex-shrink-0">
          <Button
            className="w-full justify-center gap-2 new-topic-button"
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
            <DialogDescription>A topic is a great way to organize your notes.</DialogDescription>
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
             <DialogDescription>Enter a new name for the topic "{renameTopic?.name}".</DialogDescription>
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
