
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { DayView } from '@/components/dayflow/DayView';
import { CategoryManager } from '@/components/dayflow/CategoryManager';
import { AggregatedStats } from '@/components/dayflow/AggregatedStats';
import { SummaryReport } from '@/components/dayflow/SummaryReport';
import type { ActivityLog, Category, Priority } from '@/types/dayflow';
import { format, startOfDay } from 'date-fns';
import { ThemeToggle } from '@/components/theme-toggle';

const LOCAL_STORAGE_KEY_CATEGORIES = 'dayflow_categories';
const ACTIVITY_LOG_PREFIX = 'dayflow_activities_';

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'work', name: 'Work', icon: 'Briefcase' },
  { id: 'sleep', name: 'Sleep', icon: 'BedDouble' },
  { id: 'leisure', name: 'Leisure', icon: 'Gamepad2' },
  { id: 'exercise', name: 'Exercise', icon: 'Dumbbell' },
  { id: 'chores', name: 'Chores', icon: 'Home' },
  { id: 'learning', name: 'Learning', icon: 'BookOpen' },
  { id: 'eating', name: 'Eating', icon: 'Utensils' },
  { id: 'other', name: 'Other', icon: 'CircleDot' },
];

const getActivitiesStorageKey = (date: Date): string => {
  return `${ACTIVITY_LOG_PREFIX}${format(date, 'yyyy-MM-dd')}`;
};

const getDefaultActivities = (): ActivityLog[] => {
  return Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    description: '',
    categoryId: null,
    priority: null,
    notes15Min: ['', '', '', ''], // Initialize 15-minute notes
  }));
};

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>(getDefaultActivities());
  const [currentDate, setCurrentDate] = useState<Date>(startOfDay(new Date()));
  const [isClient, setIsClient] = useState(false);
  const [liveTime, setLiveTime] = useState<string>(''); // For live time updates

  useEffect(() => {
    setIsClient(true);
    const storedCategories = localStorage.getItem(LOCAL_STORAGE_KEY_CATEGORIES);
    if (storedCategories) {
      setCategories(JSON.parse(storedCategories));
    } else {
      setCategories(DEFAULT_CATEGORIES);
      localStorage.setItem(LOCAL_STORAGE_KEY_CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
    }

    const timer = setInterval(() => {
      setLiveTime(format(new Date(), 'EEEE, h:mm a'));
    }, 60000); // Update every minute
    setLiveTime(format(new Date(), 'EEEE, h:mm a')); // Initial set

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isClient) {
      const dateKey = getActivitiesStorageKey(currentDate);
      const storedActivities = localStorage.getItem(dateKey);
      if (storedActivities) {
        const parsedActivities = JSON.parse(storedActivities) as ActivityLog[];
        setActivities(parsedActivities.map(act => ({
          ...act,
          priority: act.priority || null,
          notes15Min: act.notes15Min || ['', '', '', ''] // Ensure notes15Min is initialized
        })));
      } else {
        setActivities(getDefaultActivities());
      }
    }
  }, [currentDate, isClient]);

  useEffect(() => {
    if(isClient && categories) { // Ensure categories array exists before stringifying
      localStorage.setItem(LOCAL_STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
    }
  }, [categories, isClient]);

  useEffect(() => {
    if(isClient && activities && activities.length > 0) { // Ensure activities array exists and is not empty
      const dateKey = getActivitiesStorageKey(currentDate);
      localStorage.setItem(dateKey, JSON.stringify(activities));
    }
  }, [activities, currentDate, isClient]);

  const handleAddCategory = (category: Category) => {
    setCategories((prev) => [...prev, category]);
  };

  const handleDeleteCategory = (categoryId: string) => {
    setCategories((prev) => prev.filter(cat => cat.id !== categoryId));
    setActivities(prevActivities =>
      prevActivities.map(act =>
        act.categoryId === categoryId ? { ...act, categoryId: null } : act
      )
    );
  };

  const handleActivityChange = (
    hour: number,
    field: 'description' | 'categoryId' | 'priority',
    value: string | Priority | null
  ) => {
    setActivities((prev) =>
      prev.map((act) =>
        act.hour === hour ? { ...act, [field]: value === '' && (field === 'categoryId' || field === 'priority') ? null : value } : act
      )
    );
  };

  const handle15MinNoteChange = (
    hour: number,
    intervalIndex: number, // 0-3
    value: string
  ) => {
    setActivities((prev) =>
      prev.map((act) => {
        if (act.hour === hour) {
          const updatedNotes = [...(act.notes15Min || ['', '', '', ''])];
          updatedNotes[intervalIndex] = value;
          return { ...act, notes15Min: updatedNotes };
        }
        return act;
      })
    );
  };


  if (!isClient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Image
          src="/logo.png"
          alt="Loading DayFlow Tracker Logo"
          width={64}
          height={64}
          className="rounded animate-pulse mb-4"
          data-ai-hint="logo brand"
          priority
        />
        <p className="text-xl text-foreground font-medium">Loading DayFlow Tracker...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="py-4 px-4 md:px-8 shadow-none bg-transparent">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="App Logo"
              width={40}
              height={40}
              className="rounded"
              data-ai-hint="logo brand"
            />
            <h1 className="text-2xl sm:text-3xl font-headline font-semibold text-primary">
              DayFlow Tracker
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-semibold text-lg text-primary">{format(currentDate, 'MMMM d, yyyy')}</p>
              <p className="text-sm text-muted-foreground">{liveTime ? liveTime.split(',')[0] : format(new Date(), 'EEEE')}</p>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-grow p-4 md:p-6 lg:p-8 container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2">
            <DayView
              activities={activities}
              categories={categories}
              onActivityChange={handleActivityChange}
              on15MinNoteChange={handle15MinNoteChange}
              currentDay={currentDate}
            />
          </section>
          <aside className="space-y-6 lg:col-span-1">
            <CategoryManager
              categories={categories}
              onAddCategory={handleAddCategory}
              onDeleteCategory={handleDeleteCategory}
            />
            <AggregatedStats activities={activities} categories={categories} />
            <SummaryReport activities={activities} categories={categories} reportDate={currentDate} />
          </aside>
        </div>
      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground border-t border-border/50 mt-auto bg-transparent">
        © {new Date().getFullYear()} DayFlow Tracker. Your day, organized.
      </footer>
    </div>
  );
}
