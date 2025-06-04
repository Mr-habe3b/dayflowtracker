
'use server';
/**
 * @fileOverview Suggests activity descriptions based on user input.
 *
 * - suggestActivity - A function that provides activity suggestions.
 * - SuggestActivityInput - The input type for the suggestActivity function.
 * - SuggestActivityOutput - The return type for the suggestActivity function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestActivityInputSchema = z.object({
  currentInput: z.string().describe('The current text typed by the user for the activity description.'),
  hour: z.number().optional().describe('The hour of the day for which the activity is being logged (0-23).'),
});
export type SuggestActivityInput = z.infer<typeof SuggestActivityInputSchema>;

const SuggestActivityOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('An array of 3-5 relevant activity suggestions.'),
});
export type SuggestActivityOutput = z.infer<typeof SuggestActivityOutputSchema>;

export async function suggestActivity(input: SuggestActivityInput): Promise<SuggestActivityOutput> {
  return suggestActivityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestActivityPrompt',
  input: {schema: SuggestActivityInputSchema},
  output: {schema: SuggestActivityOutputSchema},
  prompt: `You are an assistant helping a user log their daily activities.
  Based on what the user is currently typing for an activity description, provide 3-5 concise and relevant suggestions.
  If the hour of the day is provided, use it as context. For example, activities at 8 AM might be different from 8 PM.

  Current user input: "{{currentInput}}"
  {{#if hour}}Hour of the day: {{hour}}{{/if}}

  Provide a list of suggestions.
  Example output for "Meeting with":
  {
    "suggestions": ["Meeting with John", "Meeting with marketing team", "Meeting to discuss project X"]
  }
   Example output for "Work on":
  {
    "suggestions": ["Work on report", "Work on presentation slides", "Work on bug fixes"]
  }
  `,
});

const suggestActivityFlow = ai.defineFlow(
  {
    name: 'suggestActivityFlow',
    inputSchema: SuggestActivityInputSchema,
    outputSchema: SuggestActivityOutputSchema,
  },
  async (input) => {
    if (!input.currentInput.trim()) {
      return { suggestions: [] };
    }
    const {output} = await prompt(input);
    return output || { suggestions: [] };
  }
);
