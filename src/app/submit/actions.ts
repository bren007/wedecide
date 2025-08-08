'use server';

import { z } from 'zod';
import { addDecision } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const DecisionSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long.'),
  background: z.string().min(20, 'Background must be at least 20 characters long.'),
  decisionType: z.enum(['Approve', 'Endorse', 'Note'], {
    errorMap: () => ({ message: 'Please select a decision type.' }),
  }),
  objectiveId: z.string().min(1, 'Please select an objective.'),
});

export type FormState = {
  errors?: {
    title?: string[];
    background?: string[];
    decisionType?: string[];
    objectiveId?: string[];
  };
  message?: string;
};

export async function createDecision(prevState: FormState, formData: FormData) {
  const validatedFields = DecisionSchema.safeParse({
    title: formData.get('title'),
    background: formData.get('background'),
    decisionType: formData.get('decisionType'),
    objectiveId: formData.get('objectiveId'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Failed to create decision. Please check the fields.',
    };
  }
  
  try {
    await addDecision(validatedFields.data);
  } catch (error) {
    return {
      message: 'Database Error: Failed to Create Decision.',
    };
  }

  revalidatePath('/');
  redirect('/');
}