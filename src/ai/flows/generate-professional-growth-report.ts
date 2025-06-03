
'use server';

/**
 * @fileOverview Generates a professional growth report and improvement suggestions based on daily activities.
 *
 * - generateProfessionalGrowthReport - A function that generates the report and suggestions.
 * - GenerateProfessionalGrowthReportInput - The input type for the function.
 * - GenerateProfessionalGrowthReportOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateProfessionalGrowthReportInputSchema = z.object({
  trackingData: z.string().describe('Historical tracking data in JSON format. Each entry includes hour, activity, category, and priority.'),
});
export type GenerateProfessionalGrowthReportInput = z.infer<typeof GenerateProfessionalGrowthReportInputSchema>;

const GenerateProfessionalGrowthReportOutputSchema = z.object({
  professionalGrowthReport: z.string().describe('A report focusing on professional growth aspects observed from the activities, highlighting productive patterns or areas for skill development.'),
  improvementSuggestions: z.string().describe('Actionable suggestions on how to improve productivity, time management, or skill balance based on the logged activities.'),
});
export type GenerateProfessionalGrowthReportOutput = z.infer<typeof GenerateProfessionalGrowthReportOutputSchema>;

export async function generateProfessionalGrowthReport(input: GenerateProfessionalGrowthReportInput): Promise<GenerateProfessionalGrowthReportOutput> {
  return generateProfessionalGrowthReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateProfessionalGrowthReportPrompt',
  input: {schema: GenerateProfessionalGrowthReportInputSchema},
  output: {schema: GenerateProfessionalGrowthReportOutputSchema},
  prompt: `You are an AI career coach and productivity expert.
  Based on the user's daily activity log (provided in JSON format), generate:
  1. A "Professional Growth Report": Analyze activities related to work, learning, or skill development. Identify patterns, strengths, or areas where focus could enhance professional growth.
  2. "Improvement Suggestions": Provide 3-5 actionable tips to improve productivity, time management, work-life balance, or skill development based on the data. Focus on constructive advice.

  Historical Tracking Data:
  {{{trackingData}}}

  Structure your output clearly into the two requested fields.
  For "Improvement Suggestions", use bullet points or a numbered list.
  `,
});

const generateProfessionalGrowthReportFlow = ai.defineFlow(
  {
    name: 'generateProfessionalGrowthReportFlow',
    inputSchema: GenerateProfessionalGrowthReportInputSchema,
    outputSchema: GenerateProfessionalGrowthReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
