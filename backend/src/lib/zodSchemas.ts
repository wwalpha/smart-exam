import { z } from 'zod';

/** SUBJECT_ID_VALUES. */
export const SUBJECT_ID_VALUES = ['1', '2', '3', '4'] as const;

/** SubjectIdSchema validates input shape. */
export const SubjectIdSchema = z.enum(SUBJECT_ID_VALUES);

/** PositiveIntFromUnknownSchema validates positive integer from unknown input. */
export const PositiveIntFromUnknownSchema = z.preprocess((v) => {
	if (typeof v === 'string') {
		const trimmed = v.trim();
		if (trimmed.length === 0) return v;
		const n = Number(trimmed);
		return Number.isFinite(n) ? n : v;
	}
	return v;
}, z.number().int().positive());

/** BooleanFromUnknownSchema validates boolean from unknown input. */
export const BooleanFromUnknownSchema = z.preprocess((v) => {
	if (typeof v === 'string') {
		const trimmed = v.trim().toLowerCase();
		if (trimmed === 'true') return true;
		if (trimmed === 'false') return false;
	}
	return v;
}, z.boolean());
