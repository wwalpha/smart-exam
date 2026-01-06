import { randomBytes } from 'crypto';

export const normalizeUuid = (value: string): string => {
  return String(value).trim().toLowerCase().replace(/-/g, '');
};

export const createUuid = (): string => {
  // 16桁 (16文字) のIDに統一する
  return randomBytes(8).toString('hex');
};
