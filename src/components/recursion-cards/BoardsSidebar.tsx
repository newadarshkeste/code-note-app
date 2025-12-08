
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRecursionCards } from '@/context/RecursionCardsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Trash2, Edit, Copy, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export function BoardsSidebar() {
    const { boards, boardsLoading, activeBoard, setActiveBoardId, addBoard, deleteBoard, updateBoard } = useRecursionCards();
    const [isNewBoardDialogOpen, setIsNewBoardDialogOpen] = useState(false);
    const [newBoardName, setNewBoardName] = useState('');
    const [editingBoard, setEditingBoard] = useState<any | null>(null);
    const [editingName, setEditingName] = useState('');

    const handleAddBoard = async () => {
        if (newBoardName.trim()) {
            await addBoard(newBoardName.trim());
            setNewBoardName('');
            setIsNewBoardDialogOpen(false);
        }
    };

    const handleUpdateBoard = async () => {
        if (editingBoard && editingName.trim()) {
            await updateBoard(editingBoard.id, editingName.trim());
            setEditingBoard(null);
            setEditingName('');
        }
    };


    return (
        <div className="h-full w-full flex flex-col bg-card/80 border-r">
            <header className="flex-shrink-0 p-2 flex items-center justify-between border-b h-[65px]">
                <Link href="/" passHref>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    <h2 className="text-lg font-headline font-semibold">Boards</h2>
                  </Button>
                </Link>
            </header>

            <ScrollArea className="flex-grow min-h-0">
                <div className="p-4 space-y-2">
                    {boardsLoading ? (
                        <>
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </>
                    ) : (
                        boards.map(board => (
                            <div key={board.id} className="group flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    onClick={() => setActiveBoardId(board.id)}
                                    className={cn(
                                        "w-full justify-start text-sm",
                                        activeBoard?.id === board.id ? 'bg-primary/10 text-primary font-semibold' : ''
                                    )}
                                >
                                    <span className="truncate">{board.name}</span>
                                </Button>
                                <div className="flex-shrink-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingBoard(board); setEditingName(board.name); }}><Edit className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7"><Copy className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteBoard(board.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>

            <footer className="p-4 border-t flex-shrink-0">
                <Button className="w-full" onClick={() => setIsNewBoardDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Board
                </Button>
            </footer>
            
            {/* New Board Dialog */}
            <Dialog open={isNewBoardDialogOpen} onOpenChange={setIsNewBoardDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Board</DialogTitle>
                        <DialogDescription>Give your new recursion board a name.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Label htmlFor="board-name">Board Name</Label>
                        <Input id="board-name" value={newBoardName} onChange={(e) => setNewBoardName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddBoard()} />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                        <Button onClick={handleAddBoard}>Create</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Rename Board Dialog */}
            <Dialog open={!!editingBoard} onOpenChange={(isOpen) => !isOpen && setEditingBoard(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename Board</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Label htmlFor="edit-board-name">New Name</Label>
                        <Input id="edit-board-name" value={editingName} onChange={(e) => setEditingName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleUpdateBoard()} />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                        <Button onClick={handleUpdateBoard}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
