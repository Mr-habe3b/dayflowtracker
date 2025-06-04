
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { ActivityLog, Category } from '@/types/dayflow';
import { GetIcon } from './icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface AggregatedStatsProps {
  activities: ActivityLog[];
  categories: Category[];
}

// Predefined distinct colors for chart bars
const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
  '#82CA9D', '#A4DE6C', '#D0ED57', '#FFC658', '#FF7300'
];

export function AggregatedStats({ activities, categories }: AggregatedStatsProps) {
  const categoryTime = categories.map((category, index) => {
    const count = activities.filter(act => act.categoryId === category.id).length;
    return {
      name: category.name,
      icon: category.icon,
      hours: count, // Each activity log represents one hour
      fill: COLORS[index % COLORS.length], // Assign a color
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
          <div className="space-y-4">
            <div className="h-[200px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryTime} margin={{ top: 5, right: 0, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} interval={0} />
                  <YAxis tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number, name: string, props: any) => [`${value} hour(s)`, props.payload.name]}
                  />
                  <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                    {categoryTime.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-1.5">
              {categoryTime.map((item) => (
                <li key={item.name} className="flex items-center justify-between py-1.5 px-1 text-sm">
                  <div className="flex items-center gap-2">
                    <GetIcon name={item.icon} className="h-4 w-4" style={{color: item.fill}}/>
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">{item.hours} hour{item.hours === 1 ? '' : 's'}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

