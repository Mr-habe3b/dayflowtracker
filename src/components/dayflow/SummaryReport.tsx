
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import type { ActivityLog, Category } from '@/types/dayflow';
import { generateSummaryReport } from '@/ai/flows/generate-summary-report';
import { generateProfessionalGrowthReport } from '@/ai/flows/generate-professional-growth-report';
import { useToast } from '@/hooks/use-toast';
import { FileText, Zap, Download } from 'lucide-react';

interface SummaryReportProps {
  activities: ActivityLog[];
  categories: Category[];
}

export function SummaryReport({ activities, categories }: SummaryReportProps) {
  const [report, setReport] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const getTrackingDataForAI = () => {
    return activities
      .filter(act => act.description || act.categoryId || act.priority)
      .map(act => {
        const category = categories.find(cat => cat.id === act.categoryId);
        return {
          hour: act.hour,
          activity: act.description,
          category: category ? category.name : 'Uncategorized',
          priority: act.priority || 'Not set',
        };
      });
  };

  const handleGenerateReport = async () => {
    setIsLoading(true);
    setReport('');

    const trackingDataForAI = getTrackingDataForAI();

    if (trackingDataForAI.length === 0) {
      toast({
        title: 'No Data',
        description: 'Please log some activities before generating a summary report.',
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
      console.error('Error generating summary report:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate summary report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const escapeCsvField = (field: string | null | undefined): string => {
    if (field === null || field === undefined) return '';
    const stringField = String(field);
    // Escape double quotes by doubling them, and wrap in double quotes if it contains comma, newline or double quote
    if (stringField.includes(',') || stringField.includes('\n') || stringField.includes('"')) {
      return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
  };

  const handleDownloadReport = async () => {
    setIsDownloading(true);
    const trackingDataForAI = getTrackingDataForAI();

    if (trackingDataForAI.length === 0) {
      toast({
        title: 'No Data',
        description: 'Please log some activities before downloading a report.',
        variant: 'default',
      });
      setIsDownloading(false);
      return;
    }

    try {
      const growthReportResult = await generateProfessionalGrowthReport({ trackingData: JSON.stringify(trackingDataForAI) });
      
      let csvContent = "Hour,Activity,Category,Priority\n";
      activities.forEach(act => {
        const categoryName = categories.find(c => c.id === act.categoryId)?.name || 'Uncategorized';
        const row = [
          act.hour,
          act.description,
          categoryName,
          act.priority || 'Not set'
        ].map(escapeCsvField).join(',');
        csvContent += row + "\n";
      });

      csvContent += "\n\n";
      csvContent += "Professional Growth Report:\n";
      csvContent += `"${escapeCsvField(growthReportResult.professionalGrowthReport).replace(/\n/g, '\r\n')}"\n\n`; // Ensure newlines in report are handled
      
      csvContent += "Improvement Suggestions:\n";
      csvContent += `"${escapeCsvField(growthReportResult.improvementSuggestions).replace(/\n/g, '\r\n')}"\n`;

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `DayFlow_Report_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      toast({ title: 'Success', description: 'Report download started.' });

    } catch (error) {
      console.error('Error generating or downloading report:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate or download report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl">AI Summary & Reports</CardTitle>
        <CardDescription>Get AI insights and download your daily activity log.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <Button onClick={handleGenerateReport} disabled={isLoading || isDownloading} className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground">
            {isLoading ? (
              <>
                <Zap className="mr-2 h-4 w-4 animate-pulse" /> Generating Summary...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" /> Generate Summary
              </>
            )}
          </Button>
          <Button onClick={handleDownloadReport} disabled={isDownloading || isLoading} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
            {isDownloading ? (
              <>
                <Zap className="mr-2 h-4 w-4 animate-pulse" /> Preparing Download...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" /> Download Daily Report (CSV)
              </>
            )}
          </Button>
        </div>
        {report && (
          <Textarea
            value={report}
            readOnly
            rows={10}
            className="bg-white border-muted-foreground/30 focus:ring-accent text-sm"
            placeholder="Your summary report will appear here."
          />
        )}
        {!report && !isLoading && !isDownloading && (
            <div className="text-center text-muted-foreground p-4 border border-dashed rounded-md">
                Click "Generate Summary" to see your AI insights or "Download Report" for a CSV file.
            </div>
        )}
      </CardContent>
    </Card>
  );
}
