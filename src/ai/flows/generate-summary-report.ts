
'use server';

/**
 * @fileOverview Generates a summary report of the user's daily activities based on historical tracking data, including task priorities.
 *
 * - generateSummaryReport - A function that generates the summary report.
 * - GenerateSummaryReportInput - The input type for the generateSummaryReport function.
 * - GenerateSummaryReportOutput - The return type for the generateSummaryReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSummaryReportInputSchema = z.object({
  trackingData: z.string().describe('Historical tracking data in JSON format. Each entry includes hour, activity, category, and priority (\'high\', \'medium\', \'low\', or \'Not set\').'),
});
export type GenerateSummaryReportInput = z.infer<typeof GenerateSummaryReportInputSchema>;

const GenerateSummaryReportOutputSchema = z.object({
  summaryReport: z.string().describe('A summary report of the user\'s daily activities, including a list of top 5 important tasks.'),
});
export type GenerateSummaryReportOutput = z.infer<typeof GenerateSummaryReportOutputSchema>;

export async function generateSummaryReport(input: GenerateSummaryReportInput): Promise<GenerateSummaryReportOutput> {
  return generateSummaryReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSummaryReportPrompt',
  input: {schema: GenerateSummaryReportInputSchema},
  output: {schema: GenerateSummaryReportOutputSchema},
  prompt: `You are an AI assistant specialized in generating summary reports of daily activities.

  Based on the user's historical tracking data provided in JSON format, generate a concise and insightful summary report.
  The report should:
  1. Highlight key activities and overall time allocation.
  2. Identify and list up to 5 of the most important tasks from the day. Consider tasks with 'high' priority first, then 'medium'. If there are multiple tasks with the same priority, choose based on common sense or what seems most impactful.
  3. Briefly mention potential areas for improvement or reflection if apparent from the data.

  Historical Tracking Data (includes 'hour', 'activity' description, 'category', and 'priority' which can be 'high', 'medium', 'low', or 'Not set'):
  {{{trackingData}}}

  Structure your output as a single block of text for the summaryReport field.
  For the top 5 important tasks, list them clearly, for example:
  "Key Important Tasks:
  - Task 1 (Priority: High)
  - Task 2 (Priority: Medium)
  ..."
  `,
});

const generateSummaryReportFlow = ai.defineFlow(
  {
    name: 'generateSummaryReportFlow',
    inputSchema: GenerateSummaryReportInputSchema,
    outputSchema: GenerateSummaryReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
