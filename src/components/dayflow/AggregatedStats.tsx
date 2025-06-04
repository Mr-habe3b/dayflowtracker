
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { ActivityLog, Category } from '@/types/dayflow';
import { GetIcon } from './icons';

interface AggregatedStatsProps {
  activities: ActivityLog[];
  categories: Category[];
}

// Predefined distinct colors for chart bars (can be used for text/icon colors)
const COLORS = [
  'hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))',
  'hsl(var(--chart-4))', 'hsl(var(--chart-5))', '#0088FE', '#00C49F',
  '#FFBB28', '#FF8042', '#8884D8'
];

export function AggregatedStats({ activities, categories }: AggregatedStatsProps) {
  const categoryTime = categories.map((category, index) => {
    const count = activities.filter(act => act.categoryId === category.id).length;
    return {
      id: category.id,
      name: category.name,
      icon: category.icon,
      hours: count, // Each activity log represents one hour
      color: COLORS[index % COLORS.length], // Assign a color
    };
  }).filter(ct => ct.hours > 0); // Only show categories with logged time

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl">Time Allocation</CardTitle>
        <CardDescription>Summary of time spent on each category today.</CardDescription>
      </CardHeader>
      <CardContent>
        {categoryTime.length === 0 ? (
          <p className="text-muted-foreground">No activities logged yet or no time allocated to categories.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categoryTime.map((item) => (
              <Card key={item.id} className="shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {item.name}
                  </CardTitle>
                  <GetIcon name={item.icon} className="h-5 w-5" style={{ color: item.color }} />
                </CardHeader>
                <CardContent className="pt-1">
                  <div className="text-3xl font-bold" style={{ color: item.color }}>
                    {item.hours} 
                    <span className="text-2xl font-semibold ml-1">
                      hour{item.hours === 1 ? '' : 's'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground pt-1">
                    Logged for today
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
