import { randomUUID } from 'crypto';

export const normalizeUuid = (value: string): string => {
  return String(value).trim().toLowerCase().replace(/-/g, '');
};

export const createUuid = (): string => {
  return normalizeUuid(randomUUID());
};
