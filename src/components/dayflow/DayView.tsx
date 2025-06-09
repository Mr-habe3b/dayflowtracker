
'use client';

import type React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ActivityLog, Category, Priority } from '@/types/dayflow';
import { GetIcon } from './icons';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, Minus, CalendarDays, Loader2, ListChecks, BellRing } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { suggestActivity } from '@/ai/flows/suggest-activity-flow';
import { useToast } from '@/hooks/use-toast';


interface DayViewProps {
  activities: ActivityLog[];
  categories: Category[];
  onActivityChange: (hour: number, field: 'description' | 'categoryId' | 'priority', value: string | Priority | null) => void;
  on15MinNoteChange: (hour: number, intervalIndex: number, value: string) => void; // New prop
  currentDay: Date; 
}

const HOURS_IN_DAY = 24;
const NO_CATEGORY_VALUE = "__NO_CATEGORY_VALUE__";
const NO_PRIORITY_VALUE = "__NO_PRIORITY_VALUE__";

const priorityOptions: { value: Priority | typeof NO_PRIORITY_VALUE; label: string; icon?: React.ElementType, iconClass?: string }[] = [
  { value: NO_PRIORITY_VALUE, label: 'None' },
  { value: 'high', label: 'High', icon: ArrowUp, iconClass: 'text-destructive-foreground' },
  { value: 'medium', label: 'Medium', icon: Minus, iconClass: 'text-yellow-500' },
  { value: 'low', label: 'Low', icon: ArrowDown, iconClass: 'text-green-500' },
];

const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<F>): Promise<ReturnType<F>> =>
    new Promise(resolve => {
      clearTimeout(timeout);
      timeout = setTimeout(() => resolve(func(...args)), waitFor);
    });
};

export function DayView({ activities, categories, onActivityChange, on15MinNoteChange, currentDay }: DayViewProps) {
  const [liveDateTime, setLiveDateTime] = useState(''); 
  const { toast } = useToast();

  const [activitySuggestions, setActivitySuggestions] = useState<string[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [activeSuggestionInputHour, setActiveSuggestionInputHour] = useState<number | null>(null);
  const [currentFocusedValue, setCurrentFocusedValue] = useState('');

  const activeSuggestionInputHourRef = useRef(activeSuggestionInputHour);
  const currentFocusedValueRef = useRef(currentFocusedValue);

  const [alarmEnabled, setAlarmEnabled] = useState(false);
  const alarmIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    activeSuggestionInputHourRef.current = activeSuggestionInputHour;
  }, [activeSuggestionInputHour]);

  useEffect(() => {
    currentFocusedValueRef.current = currentFocusedValue;
  }, [currentFocusedValue]);


  useEffect(() => {
    const updateDateTime = () => {
      setLiveDateTime(format(new Date(), "EEEE, h:mm a")); 
    };
    updateDateTime();
    const intervalId = setInterval(updateDateTime, 60000);
    return () => clearInterval(intervalId);
  }, []);

  // 15-Minute Alarm Logic
  useEffect(() => {
    const scheduleNextNotification = () => {
      if (alarmIntervalRef.current) {
        clearTimeout(alarmIntervalRef.current);
      }

      const now = new Date();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();

      let minutesToNextInterval = 0;
      if (minutes < 15) minutesToNextInterval = 15 - minutes;
      else if (minutes < 30) minutesToNextInterval = 30 - minutes;
      else if (minutes < 45) minutesToNextInterval = 45 - minutes;
      else minutesToNextInterval = 60 - minutes; // to next hour's 00

      // Calculate milliseconds to wait. Add a small buffer (e.g., 500ms) to ensure it triggers after the minute starts.
      let millisecondsToWait = (minutesToNextInterval * 60 - seconds) * 1000 + 500;
      
      if (millisecondsToWait <= 500) { // If we are already past the interval or very close
        millisecondsToWait = (15 * 60 * 1000) + 500; // Schedule for the next 15-min block
      }
      
      alarmIntervalRef.current = setTimeout(() => {
        toast({
          title: "15-Minute Reminder",
          description: `Time to log or review notes! Current time: ${format(new Date(), "HH:mm")}`,
          duration: 7000, 
        });
        // playBeepSound(); // Optional: Implement sound
        if (alarmEnabled) { // Check again in case it was disabled during timeout
            scheduleNextNotification(); // Reschedule for the next interval
        }
      }, millisecondsToWait);
    };

    if (alarmEnabled) {
      scheduleNextNotification();
    } else {
      if (alarmIntervalRef.current) {
        clearTimeout(alarmIntervalRef.current);
        alarmIntervalRef.current = null;
      }
    }

    return () => { // Cleanup on unmount or when alarmEnabled changes
      if (alarmIntervalRef.current) {
        clearTimeout(alarmIntervalRef.current);
      }
    };
  }, [alarmEnabled, toast]);


  const fetchSuggestionsCallback = useCallback(async (inputValue: string, forHour: number) => {
    const currentActiveHour = activeSuggestionInputHourRef.current;
    const currentVal = currentFocusedValueRef.current;

    if (!inputValue.trim() || currentActiveHour !== forHour || currentVal !== inputValue) {
      if (currentActiveHour === forHour) {
         setActivitySuggestions([]);
      }
      setSuggestionsLoading(false);
      return;
    }

    setSuggestionsLoading(true);
    try {
      const result = await suggestActivity({ currentInput: inputValue, hour: forHour });
      if (activeSuggestionInputHourRef.current === forHour && currentFocusedValueRef.current === inputValue) {
        setActivitySuggestions(result.suggestions || []);
      }
    } catch (error) {
      console.error('Error fetching activity suggestions:', error);
      toast({ title: 'Suggestion Error', description: 'Could not fetch suggestions.', variant: 'destructive'});
      if (activeSuggestionInputHourRef.current === forHour && currentFocusedValueRef.current === inputValue) {
        setActivitySuggestions([]);
      }
    } finally {
      if (activeSuggestionInputHourRef.current === forHour && currentFocusedValueRef.current === inputValue) {
         setSuggestionsLoading(false);
      } else if (!inputValue.trim() && activeSuggestionInputHourRef.current === forHour) {
         setSuggestionsLoading(false);
         setActivitySuggestions([]);
      }
    }
  }, [toast]);

  const debouncedFetchSuggestions = useCallback(debounce(fetchSuggestionsCallback, 500), [fetchSuggestionsCallback]);


  const formatHour = (hour: number): string => {
    const h = hour % 24;
    return `${h.toString().padStart(2, '0')}:00`;
  };

  const getPriorityDisplay = (priority: Priority | null) => {
    if (!priority) return "Set priority"; 
    const option = priorityOptions.find(p => p.value === priority);
    if (!option || option.value === NO_PRIORITY_VALUE) return "Set priority";
    
    let badgeVariant: "default" | "destructive" | "secondary" | "outline" = "outline";
    if (priority === 'high') badgeVariant = 'destructive';
    else if (priority === 'medium') badgeVariant = 'secondary';

    const IconComponent = option.icon;

    return (
      <Badge variant={badgeVariant} className="capitalize flex items-center gap-1">
        {IconComponent && <IconComponent className={`h-3 w-3 ${option.iconClass || ''}`} />}
        {option.label}
      </Badge>
    );
  };


  return (
    <Card className="shadow-lg h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start flex-wrap gap-2">
          <div>
            <CardTitle className="font-headline text-xl">Daily Activity Log</CardTitle>
            <CardDescription>
              Log activities for <span className="font-semibold text-primary">{format(currentDay, "MMMM d, yyyy")}</span>.
              AI suggestions appear as you type.
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            {liveDateTime && (
              <div className="text-sm text-muted-foreground bg-secondary px-3 py-1.5 rounded-md shadow-sm flex items-center gap-2 shrink-0">
                <CalendarDays className="h-4 w-4" />
                <span>{liveDateTime}</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
                <BellRing className={`h-4 w-4 ${alarmEnabled ? 'text-accent' : 'text-muted-foreground'}`} />
                <Switch
                    id="alarm-mode"
                    checked={alarmEnabled}
                    onCheckedChange={setAlarmEnabled}
                />
                <Label htmlFor="alarm-mode" className="text-sm font-medium text-muted-foreground">
                    15-Min Reminders
                </Label>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        <ScrollArea className="h-[calc(100vh-320px)] md:h-[calc(100vh-300px)] pr-4"> {/* Adjusted height for new switch */}
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead className="w-[10%] font-semibold">Hour</TableHead>
                <TableHead className="w-[35%] font-semibold">Activity & 15-Min Notes</TableHead>
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
                const notes15Min = activity?.notes15Min || ['', '', '', ''];

                return (
                  <TableRow key={hour} className="hover:bg-muted/20 transition-colors duration-150">
                    <TableCell className="font-medium py-3 align-top">{formatHour(hour)}</TableCell>
                    <TableCell className="py-3 relative align-top">
                      <div className="flex items-start gap-1">
                        <Popover
                            open={activeSuggestionInputHour === hour && currentFocusedValueRef.current.length > 0 && (activitySuggestions.length > 0 || suggestionsLoading)}
                            onOpenChange={(isOpen) => {
                            if (!isOpen) {
                                // setActiveSuggestionInputHour(null); // Keep suggestions if popover closes due to blur
                            }
                            }}
                        >
                            <PopoverTrigger asChild>
                            <Input
                                type="text"
                                value={activity?.description || ''}
                                onFocus={(e) => {
                                setActiveSuggestionInputHour(hour);
                                setCurrentFocusedValue(e.target.value);
                                if (e.target.value.trim()) {
                                    // debouncedFetchSuggestions(e.target.value, hour);
                                } else {
                                    setActivitySuggestions([]);
                                }
                                }}
                                onChange={(e) => {
                                const newValue = e.target.value;
                                onActivityChange(hour, 'description', newValue);
                                setCurrentFocusedValue(newValue);
                                if (newValue.trim()) {
                                    setActiveSuggestionInputHour(hour);
                                    debouncedFetchSuggestions(newValue, hour);
                                } else {
                                    setActivitySuggestions([]);
                                    setActiveSuggestionInputHour(null);
                                }
                                }}
                                placeholder="What were you doing?"
                                className="bg-white focus:ring-accent text-sm flex-grow"
                            />
                            </PopoverTrigger>
                            <PopoverContent
                                className="w-[var(--radix-popover-trigger-width)] p-1"
                                side="bottom"
                                align="start"
                                onOpenAutoFocus={(e) => e.preventDefault()}
                            >
                            {suggestionsLoading && activeSuggestionInputHour === hour ? (
                                <div className="p-2 text-sm text-muted-foreground text-center flex items-center justify-center">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Loading suggestions...
                                </div>
                            ) : (
                                activitySuggestions.map((suggestion, idx) => (
                                <Button
                                    key={idx}
                                    variant="ghost"
                                    className="w-full justify-start p-2 text-sm h-auto text-left whitespace-normal"
                                    onClick={() => {
                                    onActivityChange(hour, 'description', suggestion);
                                    setCurrentFocusedValue(suggestion);
                                    setActivitySuggestions([]);
                                    setActiveSuggestionInputHour(null);
                                    }}
                                >
                                    {suggestion}
                                </Button>
                                ))
                            )}
                            {!suggestionsLoading && activitySuggestions.length === 0 && currentFocusedValueRef.current.length > 0 && activeSuggestionInputHour === hour && (
                                <div className="p-2 text-sm text-muted-foreground text-center">No suggestions found.</div>
                            )}
                            </PopoverContent>
                        </Popover>
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button variant="outline" size="icon" className="h-10 w-10 shrink-0"> {/* Adjusted size to match input */}
                                <ListChecks className="h-4 w-4" />
                                <span className="sr-only">15-min Notes</span>
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                <h4 className="font-medium leading-none">15-Min Notes for {formatHour(hour)}</h4>
                                <p className="text-sm text-muted-foreground">
                                    Notes for :00, :15, :30, :45 intervals.
                                </p>
                                </div>
                                <div className="grid gap-2">
                                {notes15Min.map((note, intervalIdx) => (
                                    <div key={intervalIdx} className="grid grid-cols-5 items-center gap-2">
                                    <Label htmlFor={`note-${hour}-${intervalIdx}`} className="text-right col-span-1 text-xs">
                                        {`:${(intervalIdx * 15).toString().padStart(2, '0')}`}
                                    </Label>
                                    <Input
                                        id={`note-${hour}-${intervalIdx}`}
                                        value={note}
                                        onChange={(e) => on15MinNoteChange(hour, intervalIdx, e.target.value)}
                                        className="col-span-4 h-8 text-xs"
                                        placeholder={`Note...`}
                                    />
                                    </div>
                                ))}
                                </div>
                            </div>
                            </PopoverContent>
                        </Popover>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 align-top">
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
                    <TableCell className="py-3 align-top">
                      <Select
                        value={currentPriority === null || currentPriority === undefined ? NO_PRIORITY_VALUE : currentPriority}
                        onValueChange={(selectedValue) => {
                          const actualValue = selectedValue === NO_PRIORITY_VALUE ? null : selectedValue as Priority;
                          onActivityChange(hour, 'priority', actualValue);
                        }}
                      >
                        <SelectTrigger className="bg-white focus:ring-accent text-sm">
                           <SelectValue>
                            {getPriorityDisplay(currentPriority)}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {priorityOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                {option.icon && <option.icon className={`h-4 w-4 ${option.iconClass || ''}`} />}
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
