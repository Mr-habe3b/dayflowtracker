'use client';

import { useEffect, useState } from 'react';
import { DayView } from '@/components/dayflow/DayView';
import { CategoryManager } from '@/components/dayflow/CategoryManager';
import { AggregatedStats } from '@/components/dayflow/AggregatedStats';
import { SummaryReport } from '@/components/dayflow/SummaryReport';
import type { ActivityLog, Category } from '@/types/dayflow';
import { BrainCircuit } from 'lucide-react';

const LOCAL_STORAGE_KEY_CATEGORIES = 'dayflow_categories';
const LOCAL_STORAGE_KEY_ACTIVITIES = 'dayflow_activities';

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

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Load categories from localStorage or use defaults
    const storedCategories = localStorage.getItem(LOCAL_STORAGE_KEY_CATEGORIES);
    if (storedCategories) {
      setCategories(JSON.parse(storedCategories));
    } else {
      setCategories(DEFAULT_CATEGORIES);
    }

    // Load activities from localStorage
    const storedActivities = localStorage.getItem(LOCAL_STORAGE_KEY_ACTIVITIES);
    if (storedActivities) {
      setActivities(JSON.parse(storedActivities));
    } else {
      // Initialize empty activities for 24 hours
      setActivities(
        Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          description: '',
          categoryId: null,
        }))
      );
    }
  }, []);

  useEffect(() => {
    if(isClient) {
      localStorage.setItem(LOCAL_STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
    }
  }, [categories, isClient]);

  useEffect(() => {
    if(isClient) {
      localStorage.setItem(LOCAL_STORAGE_KEY_ACTIVITIES, JSON.stringify(activities));
    }
  }, [activities, isClient]);

  const handleAddCategory = (category: Category) => {
    setCategories((prev) => [...prev, category]);
  };

  const handleDeleteCategory = (categoryId: string) => {
    setCategories((prev) => prev.filter(cat => cat.id !== categoryId));
    // Also remove this categoryId from activities
    setActivities(prevActivities => 
      prevActivities.map(act => 
        act.categoryId === categoryId ? { ...act, categoryId: null } : act
      )
    );
  };

  const handleActivityChange = (hour: number, field: 'description' | 'categoryId', value: string) => {
    setActivities((prev) =>
      prev.map((act) =>
        act.hour === hour ? { ...act, [field]: value || (field === 'categoryId' ? null : '') } : act
      )
    );
  };
  
  if (!isClient) {
    // Render a loading state or null during SSR to avoid hydration mismatch
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
        <div className="container mx-auto flex items-center gap-2">
           <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-8 w-8 text-primary"
          >
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="M12 6v6l4 2" />
          </svg>
          <h1 className="text-3xl font-headline font-semibold text-primary">
            DayFlow Tracker
          </h1>
        </div>
      </header>
      <main className="flex-grow p-4 md:p-6 lg:p-8 container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2">
            <DayView
              activities={activities}
              categories={categories}
              onActivityChange={handleActivityChange}
            />
          </section>
          <aside className="space-y-6 lg:col-span-1">
            <CategoryManager 
              categories={categories} 
              onAddCategory={handleAddCategory}
              onDeleteCategory={handleDeleteCategory}
            />
            <AggregatedStats activities={activities} categories={categories} />
            <SummaryReport activities={activities} categories={categories} />
          </aside>
        </div>
      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground border-t border-border mt-auto bg-card">
        © {new Date().getFullYear()} DayFlow Tracker. Your day, organized.
      </footer>
    </div>
  );
}
