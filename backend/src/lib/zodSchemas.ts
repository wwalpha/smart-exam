import { z } from 'zod';

export const SUBJECT_ID_VALUES = ['1', '2', '3', '4'] as const;

export const SubjectIdSchema = z.enum(SUBJECT_ID_VALUES);
