
'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ActivityLog, Category, Priority } from '@/types/dayflow';
import { GetIcon } from './icons';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ArrowUp, ArrowDown, Minus, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';

interface DayViewProps {
  activities: ActivityLog[];
  categories: Category[];
  onActivityChange: (hour: number, field: 'description' | 'categoryId' | 'priority', value: string | Priority | null) => void;
}

const HOURS_IN_DAY = 24;
const NO_CATEGORY_VALUE = "__NO_CATEGORY_VALUE__";
const NO_PRIORITY_VALUE = "__NO_PRIORITY_VALUE__";

const priorityOptions: { value: Priority | typeof NO_PRIORITY_VALUE; label: string; icon?: React.ElementType, iconColor?: string }[] = [
  { value: NO_PRIORITY_VALUE, label: 'None' },
  { value: 'high', label: 'High', icon: ArrowUp, iconColor: 'text-red-500' },
  { value: 'medium', label: 'Medium', icon: Minus, iconColor: 'text-yellow-500' },
  { value: 'low', label: 'Low', icon: ArrowDown, iconColor: 'text-green-500' },
];

export function DayView({ activities, categories, onActivityChange }: DayViewProps) {
  const [currentDateTime, setCurrentDateTime] = useState('');

  useEffect(() => {
    const updateDateTime = () => {
      setCurrentDateTime(format(new Date(), "MMMM d, yyyy - EEEE, h:mm a"));
    };
    updateDateTime(); // Initial call
    const intervalId = setInterval(updateDateTime, 60000); // Update every minute
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);


  const formatHour = (hour: number): string => {
    const h = hour % 24;
    return `${h.toString().padStart(2, '0')}:00`;
  };

  const getPriorityDisplay = (priority: Priority | null) => {
    if (!priority) return null;
    const option = priorityOptions.find(p => p.value === priority);
    if (!option || !option.icon) return <Badge variant="outline" className="capitalize">{priority}</Badge>;
    const IconComponent = option.icon;
    return (
      <Badge variant={priority === 'high' ? 'destructive' : priority === 'medium' ? 'secondary' : 'outline'} className="capitalize flex items-center gap-1">
        <IconComponent className={`h-3 w-3 ${option.iconColor || ''}`} />
        {priority}
      </Badge>
    );
  };


  return (
    <Card className="shadow-lg h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="font-headline text-xl">Daily Activity Log</CardTitle>
            <CardDescription>Log your activities, category, and priority for each hour of the day.</CardDescription>
          </div>
          {currentDateTime && (
            <div className="text-sm text-muted-foreground bg-secondary px-3 py-1.5 rounded-md shadow-sm flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              <span>{currentDateTime}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        <ScrollArea className="h-[calc(100vh-280px)] md:h-[calc(100vh-250px)] pr-4">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead className="w-[10%] font-semibold">Hour</TableHead>
                <TableHead className="w-[35%] font-semibold">Activity Description</TableHead>
                <TableHead className="w-[25%] font-semibold">Category</TableHead>
                <TableHead className="w-[30%] font-semibold">Priority</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: HOURS_IN_DAY }).map((_, i) => {
                const hour = i;
                const activity = activities.find(act => act.hour === hour);
                const currentCategory = categories.find(c => c.id === activity?.categoryId);
                const currentPriority = activity?.priority;

                return (
                  <TableRow key={hour} className="hover:bg-muted/20 transition-colors duration-150">
                    <TableCell className="font-medium py-3">{formatHour(hour)}</TableCell>
                    <TableCell className="py-3">
                      <Input
                        type="text"
                        value={activity?.description || ''}
                        onChange={(e) => onActivityChange(hour, 'description', e.target.value)}
                        placeholder="What were you doing?"
                        className="bg-white focus:ring-accent text-sm"
                      />
                    </TableCell>
                    <TableCell className="py-3">
                      <Select
                        value={activity?.categoryId === null || activity?.categoryId === undefined ? NO_CATEGORY_VALUE : activity.categoryId}
                        onValueChange={(selectedValue) => {
                          const actualValue = selectedValue === NO_CATEGORY_VALUE ? null : selectedValue;
                          onActivityChange(hour, 'categoryId', actualValue);
                        }}
                      >
                        <SelectTrigger className="bg-white focus:ring-accent text-sm">
                          <SelectValue placeholder="Select category">
                            {currentCategory ? (
                              <div className="flex items-center gap-2">
                                <GetIcon name={currentCategory.icon} className="h-4 w-4" />
                                {currentCategory.name}
                              </div>
                            ) : "Select category"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NO_CATEGORY_VALUE}><em>No Category</em></SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              <div className="flex items-center gap-2">
                                <GetIcon name={category.icon} className="h-4 w-4" />
                                {category.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="py-3">
                      <Select
                        value={currentPriority === null || currentPriority === undefined ? NO_PRIORITY_VALUE : currentPriority}
                        onValueChange={(selectedValue) => {
                          const actualValue = selectedValue === NO_PRIORITY_VALUE ? null : selectedValue as Priority;
                          onActivityChange(hour, 'priority', actualValue);
                        }}
                      >
                        <SelectTrigger className="bg-white focus:ring-accent text-sm">
                          <SelectValue placeholder="Set priority">
                            {currentPriority ? getPriorityDisplay(currentPriority) : "Set priority"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {priorityOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                {option.icon && <option.icon className={`h-4 w-4 ${option.iconColor || ''}`} />}
                                {option.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
