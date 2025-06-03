'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import type { ActivityLog, Category } from '@/types/dayflow';
import { generateSummaryReport } from '@/ai/flows/generate-summary-report';
import { useToast } from '@/hooks/use-toast';
import { FileText, Zap } from 'lucide-react';

interface SummaryReportProps {
  activities: ActivityLog[];
  categories: Category[];
}

export function SummaryReport({ activities, categories }: SummaryReportProps) {
  const [report, setReport] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateReport = async () => {
    setIsLoading(true);
    setReport('');

    const trackingDataForAI = activities
      .filter(act => act.description || act.categoryId) // Only include hours with some data
      .map(act => {
        const category = categories.find(cat => cat.id === act.categoryId);
        return {
          hour: act.hour,
          activity: act.description,
          category: category ? category.name : 'Uncategorized',
        };
      });

    if (trackingDataForAI.length === 0) {
      toast({
        title: 'No Data',
        description: 'Please log some activities before generating a report.',
        variant: 'default',
      });
      setIsLoading(false);
      return;
    }

    try {
      const result = await generateSummaryReport({ trackingData: JSON.stringify(trackingDataForAI) });
      setReport(result.summaryReport);
      toast({ title: 'Success', description: 'Summary report generated.' });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate summary report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl">AI Summary Report</CardTitle>
        <CardDescription>Get an AI-generated summary of your day's activities.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleGenerateReport} disabled={isLoading} className="w-full mb-4 bg-accent hover:bg-accent/90 text-accent-foreground">
          {isLoading ? (
            <>
              <Zap className="mr-2 h-4 w-4 animate-pulse" /> Generating...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" /> Generate Report
            </>
          )}
        </Button>
        {report && (
          <Textarea
            value={report}
            readOnly
            rows={10}
            className="bg-white border-muted-foreground/30 focus:ring-accent text-sm"
            placeholder="Your summary report will appear here."
          />
        )}
        {!report && !isLoading && (
            <div className="text-center text-muted-foreground p-4 border border-dashed rounded-md">
                Click "Generate Report" to see your AI summary.
            </div>
        )}
      </CardContent>
    </Card>
  );
}
