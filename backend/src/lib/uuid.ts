import { randomBytes } from 'crypto';

export const normalizeUuid = (value: string): string => {
  return String(value).trim().toLowerCase().replace(/-/g, '');
};

export const createUuid = (): string => {
  // UUID相当の 32桁 (ハイフン無し) に統一する
  return randomBytes(16).toString('hex');
};
