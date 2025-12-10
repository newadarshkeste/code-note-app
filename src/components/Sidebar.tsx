'use client';

import { TopicSidebar } from '@/components/TopicSidebar';
import { NoteList } from '@/components/NoteList';
import { useNotes } from '@/context/NotesContext';

export function Sidebar() {
    const { activeTopicId } = useNotes();

    return (
        <div className="w-[520px] shrink-0 flex border-r">
            <aside className="w-[260px] shrink-0">
                <TopicSidebar />
            </aside>
            <aside className="w-[260px] shrink-0">
                <NoteList />
            </aside>
        </div>
    );
}
