'use client';

import React from 'react';
import { Button } from './ui/button';
import { Menu, LogOut } from 'lucide-react';
import { CodeNoteLogo } from './CodeNoteLogo';
import { ThemeCustomizer } from './ThemeCustomizer';
import { ThemeToggle } from './ThemeToggle';
import { 
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { useAuth } from '@/context/AuthContext';

interface HeaderProps {
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
}

export function Header({ isSidebarOpen, toggleSidebar }: HeaderProps) {
    const { user, logout } = useAuth();
    
    return (
        <header className="flex-shrink-0 flex items-center justify-between p-2 border-b h-[65px] bg-background gap-2">
            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    title={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
                    className="h-8 w-8"
                >
                    <Menu className="h-5 w-5" />
                </Button>
                <CodeNoteLogo />
            </div>

            <div className="flex items-center gap-2">
                <ThemeCustomizer />
                <ThemeToggle />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'User'} />
                                <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{user?.displayName}</p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {user?.email}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={logout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
