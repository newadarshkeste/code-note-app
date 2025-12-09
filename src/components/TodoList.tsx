'use client';

import React, { useState, useMemo } from 'react';
import { useNotes } from '@/context/NotesContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar as CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';
import { Calendar } from './ui/calendar';
import { cn } from '@/lib/utils';
import type { Todo } from '@/lib/types';
import { ScrollArea } from './ui/scroll-area';
import { Skeleton } from './ui/skeleton';

export function TodoList() {
    const { todos, todosLoading, addTodo, updateTodo, deleteTodo } = useNotes();
    const [newTodoContent, setNewTodoContent] = useState('');
    const [newTodoDate, setNewTodoDate] = useState<Date | undefined>();

    const sortedTodos = useMemo(() => {
        return [...todos].sort((a, b) => {
            if (a.isCompleted !== b.isCompleted) {
                return a.isCompleted ? 1 : -1;
            }
            if (a.dueDate && b.dueDate) {
                return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            }
            if (a.dueDate) return -1;
            if (b.dueDate) return 1;
            return (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0);
        });
    }, [todos]);

    const handleAddTodo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newTodoContent.trim()) {
            await addTodo({
                content: newTodoContent.trim(),
                dueDate: newTodoDate ? format(newTodoDate, 'yyyy-MM-dd') : undefined,
            });
            setNewTodoContent('');
            setNewTodoDate(undefined);
        }
    };

    const handleToggleComplete = (todo: Todo) => {
        updateTodo(todo.id, { isCompleted: !todo.isCompleted });
    };

    return (
        <div className="flex flex-col h-full max-h-[400px]">
            <form onSubmit={handleAddTodo} className="flex gap-2 p-1">
                <Input
                    placeholder="Add a new task..."
                    value={newTodoContent}
                    onChange={(e) => setNewTodoContent(e.target.value)}
                    className="h-9 text-sm"
                />
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            className={cn(
                                'h-9 w-9 flex-shrink-0',
                                !newTodoDate && 'text-muted-foreground'
                            )}
                        >
                            <CalendarIcon className="h-4 w-4" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={newTodoDate}
                            onSelect={setNewTodoDate}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
                <Button type="submit" size="icon" className="h-9 w-9 flex-shrink-0" disabled={!newTodoContent.trim()}>
                    <Plus className="h-4 w-4" />
                </Button>
            </form>
            <ScrollArea className="flex-grow min-h-0 mt-2">
                <div className="space-y-2 pr-2">
                    {todosLoading ? (
                        <>
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </>
                    ) : (
                        sortedTodos.map((todo) => (
                            <div
                                key={todo.id}
                                className="flex items-center gap-3 group p-2 rounded-md hover:bg-muted/50"
                            >
                                <Checkbox
                                    id={`todo-${todo.id}`}
                                    checked={todo.isCompleted}
                                    onCheckedChange={() => handleToggleComplete(todo)}
                                />
                                <label
                                    htmlFor={`todo-${todo.id}`}
                                    className={cn(
                                        'flex-grow text-sm cursor-pointer',
                                        todo.isCompleted && 'text-muted-foreground line-through'
                                    )}
                                >
                                    {todo.content}
                                </label>
                                {todo.dueDate && (
                                    <span className="text-xs text-muted-foreground">
                                        {format(new Date(todo.dueDate), 'MMM d')}
                                    </span>
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 opacity-0 group-hover:opacity-100"
                                    onClick={() => deleteTodo(todo.id)}
                                >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        ))
                    )}
                     {todos.length === 0 && !todosLoading && (
                        <p className="text-sm text-center text-muted-foreground pt-4">No tasks yet. Add one above!</p>
                     )}
                </div>
            </ScrollArea>
        </div>
    );
}
