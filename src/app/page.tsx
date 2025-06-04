
'use client';

import { useEffect, useState } from 'react';
import { DayView } from '@/components/dayflow/DayView';
import { CategoryManager } from '@/components/dayflow/CategoryManager';
import { AggregatedStats } from '@/components/dayflow/AggregatedStats';
import { SummaryReport } from '@/components/dayflow/SummaryReport';
import type { ActivityLog, Category, Priority } from '@/types/dayflow';
import { BrainCircuit, Clock } from 'lucide-react';
import { format, parseISO, startOfDay } from 'date-fns'; // Added for date formatting

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
  }));
};

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>(getDefaultActivities());
  const [currentDate, setCurrentDate] = useState<Date>(startOfDay(new Date())); // Track the current day being viewed
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const storedCategories = localStorage.getItem(LOCAL_STORAGE_KEY_CATEGORIES);
    if (storedCategories) {
      setCategories(JSON.parse(storedCategories));
    } else {
      setCategories(DEFAULT_CATEGORIES);
      localStorage.setItem(LOCAL_STORAGE_KEY_CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
    }
  }, []);

  // Load activities for the current date when component mounts or date changes
  useEffect(() => {
    if (isClient) {
      const dateKey = getActivitiesStorageKey(currentDate);
      const storedActivities = localStorage.getItem(dateKey);
      if (storedActivities) {
        const parsedActivities = JSON.parse(storedActivities) as ActivityLog[];
        setActivities(parsedActivities.map(act => ({ ...act, priority: act.priority || null })));
      } else {
        setActivities(getDefaultActivities());
      }
    }
  }, [currentDate, isClient]);

  // Save categories to localStorage
  useEffect(() => {
    if(isClient && categories.length > 0) { // Ensure default categories are set before saving
      localStorage.setItem(LOCAL_STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
    }
  }, [categories, isClient]);

  // Save activities for the current date to localStorage
  useEffect(() => {
    if(isClient) {
      const dateKey = getActivitiesStorageKey(currentDate);
      // Only save if activities are not the initial empty set, or if they have been modified
      const hasMeaningfulData = activities.some(act => act.description || act.categoryId || act.priority);
      if (activities.length === 24 && hasMeaningfulData) { // ensure it's a full day's log
         localStorage.setItem(dateKey, JSON.stringify(activities));
      } else if (activities.length === 24 && !hasMeaningfulData) {
        // If it's a blank day, we might want to remove it or not save it to avoid clutter
        // For now, let's save it to reflect that the day was "empty" if user interacted.
        // Or, only save if there's actual data:
        // if (hasMeaningfulData) localStorage.setItem(dateKey, JSON.stringify(activities));
        // else localStorage.removeItem(dateKey); // Optional: clean up empty days
         localStorage.setItem(dateKey, JSON.stringify(activities)); // For simplicity, save even if empty
      }
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

  // TODO: Add UI to change currentDate (e.g., a date picker)

  if (!isClient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <BrainCircuit className="h-16 w-16 text-primary animate-pulse mb-4" />
        <p className="text-xl text-foreground font-medium">Loading DayFlow Tracker...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="p-4 shadow-md bg-card border-b border-border">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-headline font-semibold text-primary">
              DayFlow Tracker
            </h1>
          </div>
          <div className="text-right">
            <p className="font-semibold text-lg text-primary">{format(currentDate, 'MMMM d, yyyy')}</p>
            <p className="text-sm text-muted-foreground">{format(currentDate, 'EEEE')}</p>
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
              currentDay={currentDate} // Pass current date to DayView
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
      <footer className="text-center p-4 text-sm text-muted-foreground border-t border-border mt-auto bg-card">
        © {new Date().getFullYear()} DayFlow Tracker. Your day, organized.
      </footer>
    </div>
  );
}
