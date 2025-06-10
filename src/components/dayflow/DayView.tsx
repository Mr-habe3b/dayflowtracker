
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
import { ArrowUp, ArrowDown, Minus, CalendarDays, Loader2, ListChecks, BellRing, Info } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { suggestActivity } from '@/ai/flows/suggest-activity-flow';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';


interface DayViewProps {
  activities: ActivityLog[];
  categories: Category[];
  onActivityChange: (hour: number, field: 'description' | 'categoryId' | 'priority', value: string | Priority | null) => void;
  on15MinNoteChange: (hour: number, intervalIndex: number, value: string) => void;
  currentDay: Date; 
}

const HOURS_IN_DAY = 24;
const NO_CATEGORY_VALUE = "__NO_CATEGORY_VALUE__";
const NO_PRIORITY_VALUE = "__NO_PRIORITY_VALUE__";

const priorityOptions: {
  value: Priority | typeof NO_PRIORITY_VALUE;
  label: string;
  icon?: React.ElementType;
  iconClass?: string;
  badgeVariant?: "default" | "destructive" | "secondary" | "outline";
  badgeCustomClass?: string;
}[] = [
  { value: NO_PRIORITY_VALUE, label: 'None', badgeVariant: 'outline', badgeCustomClass: 'text-muted-foreground' },
  {
    value: 'high',
    label: 'High',
    icon: ArrowUp,
    iconClass: 'text-destructive-foreground',
    badgeVariant: 'destructive',
    badgeCustomClass: ''
  },
  {
    value: 'medium',
    label: 'Medium',
    icon: Minus,
    iconClass: 'text-yellow-700 dark:text-yellow-400',
    badgeVariant: 'outline',
    badgeCustomClass: 'border-yellow-400/80 bg-yellow-400/10 text-yellow-700 dark:border-yellow-600/80 dark:bg-yellow-600/20 dark:text-yellow-400 hover:bg-yellow-400/20 dark:hover:bg-yellow-600/30'
  },
  {
    value: 'low',
    label: 'Low',
    icon: ArrowDown,
    iconClass: 'text-green-700 dark:text-green-400',
    badgeVariant: 'outline',
    badgeCustomClass: 'border-green-500/80 bg-green-500/10 text-green-700 dark:border-green-600/80 dark:bg-green-600/20 dark:text-green-400 hover:bg-green-500/20 dark:hover:bg-green-600/30'
  },
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

  const scheduleNextNotification = useCallback((isInitialCall: boolean) => {
    if (alarmIntervalRef.current) {
      clearTimeout(alarmIntervalRef.current);
    }

    const now = new Date();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    let minutesToNextAbsInterval = 0;
    if (minutes < 15) minutesToNextAbsInterval = 15 - minutes;
    else if (minutes < 30) minutesToNextAbsInterval = 30 - minutes;
    else if (minutes < 45) minutesToNextAbsInterval = 45 - minutes;
    else minutesToNextAbsInterval = 60 - minutes;

    let msToNextAbsInterval = (minutesToNextAbsInterval * 60 - seconds) * 1000 + 500;

    if (msToNextAbsInterval <= 500) { 
      msToNextAbsInterval += (15 * 60 * 1000);
    } else if (isInitialCall && msToNextAbsInterval < (2 * 60 * 1000)) { 
        msToNextAbsInterval += (15 * 60 * 1000);
    }
    
    const finalMillisecondsToWait = Math.max(1000, msToNextAbsInterval);

    alarmIntervalRef.current = setTimeout(() => {
      toast({
        title: "15-Minute Reminder",
        description: `Time to log or review notes! Current time: ${format(new Date(), "HH:mm")}`,
        duration: 7000, 
      });
      if (alarmEnabled) { 
        scheduleNextNotification(false); 
      }
    }, finalMillisecondsToWait);
  }, [alarmEnabled, toast]);


  useEffect(() => {
    if (alarmEnabled) {
      scheduleNextNotification(true); 
    } else {
      if (alarmIntervalRef.current) {
        clearTimeout(alarmIntervalRef.current);
        alarmIntervalRef.current = null;
      }
    }

    return () => { 
      if (alarmIntervalRef.current) {
        clearTimeout(alarmIntervalRef.current);
      }
    };
  }, [alarmEnabled, scheduleNextNotification]);


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
    const option = priorityOptions.find(p => p.value === (priority || NO_PRIORITY_VALUE));
    
    if (!option || !priority) {
      return <span className={cn("text-muted-foreground", option?.badgeCustomClass)}>Set priority</span>;
    }
    
    const badgeVariantToUse = option.badgeVariant || 'outline';
    const IconComponent = option.icon;

    return (
      <Badge variant={badgeVariantToUse} className={cn("capitalize flex items-center gap-1 w-full justify-start", option.badgeCustomClass)}>
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
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-accent">
                      <Info className="h-4 w-4" />
                      <span className="sr-only">How to use 15-minute features</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-lg font-semibold">15-Minute Features Guide</DialogTitle>
                      <DialogDescription className="mt-1">
                        Quick guide to notes and reminders.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 space-y-3 text-sm text-foreground">
                      <div>
                        <h4 className="font-semibold mb-1">15-Minute Notes:</h4>
                        <p className="text-muted-foreground text-xs">
                          Click <ListChecks className="inline h-3 w-3 relative -top-px" /> to log notes for :00, :15, :30, :45 intervals per hour.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">15-Minute Alarm:</h4>
                         <p className="text-muted-foreground text-xs">
                          Toggle for reminders. First reminder skips if next mark is &lt;2 mins away.
                        </p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        <ScrollArea className="h-[calc(100vh-320px)] md:h-[calc(100vh-300px)] pr-4">
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
                                     setActiveSuggestionInputHour(null);
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
                                    // debouncedFetchSuggestions(e.target.value, hour); // Optionally fetch on focus if needed
                                } else {
                                    setActivitySuggestions([]);
                                }
                                }}
                                onChange={(e) => {
                                const newValue = e.target.value;
                                onActivityChange(hour, 'description', newValue);
                                setCurrentFocusedValue(newValue);
                                if (newValue.trim()) {
                                    setActiveSuggestionInputHour(hour); // Ensure it's active for this input
                                    debouncedFetchSuggestions(newValue, hour);
                                } else {
                                    setActivitySuggestions([]);
                                    setActiveSuggestionInputHour(null); // Clear active hour if input is empty
                                }
                                }}
                                onBlur={() => {
                                  // Delay hiding suggestions to allow click on suggestion
                                  // If not clicking on a suggestion, Popover's onOpenChange(false) will handle it
                                }}
                                placeholder="What were you doing?"
                                className="focus:ring-accent text-sm flex-grow"
                            />
                            </PopoverTrigger>
                            <PopoverContent
                                className="w-[var(--radix-popover-trigger-width)] p-1"
                                side="bottom"
                                align="start"
                                onOpenAutoFocus={(e) => e.preventDefault()} // Prevent focus stealing
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
                                    setActiveSuggestionInputHour(null); // Close popover after selection
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
                            <Button variant="outline" size="icon" className="h-10 w-10 shrink-0">
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
                        <SelectTrigger className="focus:ring-accent text-sm">
                          <SelectValue placeholder="Select category">
                            {currentCategory ? (
                              <div className="flex items-center gap-2">
                                <GetIcon name={currentCategory.icon} className="h-4 w-4" />
                                {currentCategory.name}
                              </div>
                            ) : <span className="text-muted-foreground">Select category</span>}
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
                        <SelectTrigger className="focus:ring-accent text-sm w-full">
                           <SelectValue>
                            {getPriorityDisplay(currentPriority)}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {priorityOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className={cn("flex items-center gap-2", option.badgeCustomClass || (option.value === NO_PRIORITY_VALUE ? 'text-muted-foreground' : ''))}>
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

