
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { ActivityLog, Category } from '@/types/dayflow';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, Label } from 'recharts';

interface AggregatedStatsProps {
  activities: ActivityLog[];
  categories: Category[];
}

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
      icon: category.icon, // Kept for potential future use, not directly used in this chart version
      hours: count,
      color: COLORS[index % COLORS.length],
    };
  }).filter(ct => ct.hours > 0);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl">Time Allocation</CardTitle>
        <CardDescription>Summary of time spent on each category today.</CardDescription>
      </CardHeader>
      <CardContent>
        {categoryTime.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No time allocated to categories yet.</p>
        ) : (
          <div style={{ width: '100%', height: 250 }}> {/* Ensure div has dimensions for ResponsiveContainer */}
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryTime}
                margin={{
                  top: 5,
                  right: 20, // Adjusted for better spacing
                  left: -10, // Adjusted for Y-axis label to fit
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                  interval={0} // Show all labels if possible
                  angle={-15} // Angle labels if they overlap
                  textAnchor="end" // Adjust text anchor for angled labels
                  height={40} // Increase height for XAxis to accommodate angled labels
                />
                <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}>
                  <Label 
                    value="Hours" 
                    angle={-90} 
                    position="insideLeft" 
                    style={{ textAnchor: 'middle', fill: 'hsl(var(--foreground))', fontSize: 12 }}
                    offset={10} // Adjust offset to position label correctly
                  />
                </YAxis>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                    color: 'hsl(var(--popover-foreground))',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                  }}
                  labelStyle={{ marginBottom: '4px', fontWeight: '500' }}
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                />
                <Legend
                  payload={
                    categoryTime.map(item => ({
                      value: item.name,
                      type: 'square',
                      color: item.color,
                      id: item.id,
                    }))
                  }
                  wrapperStyle={{ fontSize: 12, paddingTop: '15px' }}
                  iconSize={10}
                />
                <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                  {categoryTime.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
