
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Folder, Search, Trash2, Plus, Pencil, Share2, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';
import { Skeleton } from './ui/skeleton';
import { usePathname } from 'next/navigation';
import { Separator } from './ui/separator';
import type { Topic } from '@/lib/types';


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

  const handleDeleteClick = (e: React.MouseEvent, topic: Topic) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete the topic "${topic.name}" and all its notes?`)) {
      deleteTopic(topic.id);
    }
  };
  
  const handleRenameClick = (e: React.MouseEvent, topic: Topic) => {
    e.stopPropagation();
    setRenameTopic(topic);
    setRenamingName(topic.name);
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
                                "flex-grow justify-start gap-2 h-10 text-sm min-w-0", // Added min-w-0 for truncation
                                activeTopicId === topic.id ? 'bg-primary/10 text-primary font-semibold' : ''
                            )}
                        >
                            <Folder className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate flex-grow text-left">{topic.name}</span>
                        </Button>
                         <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pr-1">
                           <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => handleRenameClick(e, topic)} title="Rename topic">
                             <Pencil className="h-4 w-4" />
                           </Button>
                           <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => handleDeleteClick(e, topic)} title="Delete topic">
                             <Trash2 className="h-4 w-4" />
                           </Button>
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
