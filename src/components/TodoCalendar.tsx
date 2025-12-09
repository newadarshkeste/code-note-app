'use client';

import React, { useState, useMemo } from 'react';
import { useNotes } from '@/context/NotesContext';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { format, isSameDay } from 'date-fns';
import { DayProps } from 'react-day-picker';

export function TodoCalendar() {
  const { todos } = useNotes();
  const [month, setMonth] = useState(new Date());

  const todosByDate = useMemo(() => {
    const map = new Map<string, number>();
    todos.forEach(todo => {
      if (todo.dueDate && !todo.isCompleted) {
        const dateStr = todo.dueDate;
        map.set(dateStr, (map.get(dateStr) || 0) + 1);
      }
    });
    return map;
  }, [todos]);

  const DayWithTodos = (props: DayProps) => {
    const { date, displayMonth } = props;
    if (!date || !displayMonth || date.getMonth() !== displayMonth.getMonth()) {
        return <div className="h-9 w-9 p-0 font-normal"></div>;
    }
      
    const dateStr = format(date, 'yyyy-MM-dd');
    const todoCount = todosByDate.get(dateStr);
    
    return (
      <div className="relative h-9 w-9 p-0 font-normal flex items-center justify-center">
        <span>{format(date, 'd')}</span>
        {todoCount && todoCount > 0 && (
          <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 justify-center rounded-full p-0 text-[10px]">
            {todoCount}
          </Badge>
        )}
      </div>
    );
  };
  
  return (
      <Calendar
        mode="single"
        month={month}
        onMonthChange={setMonth}
        className="p-0"
        components={{
            Day: DayWithTodos,
        }}
      />
  );
}
