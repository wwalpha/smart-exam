// Module: zodSchemas responsibilities.

import { z } from 'zod';


/** SUBJECT_ID_VALUES. */
export const SUBJECT_ID_VALUES = ['1', '2', '3', '4'] as const;

/** SubjectIdSchema validates input shape. */
export const SubjectIdSchema = z.enum(SUBJECT_ID_VALUES);
