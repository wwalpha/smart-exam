export const normalizeUuid = (value: string): string => {
  return String(value).trim().toLowerCase().replace(/-/g, '');
};

export const createUuid = (): string => {
  const cryptoObj = (globalThis as any).crypto as Crypto | undefined;

  if (cryptoObj && typeof (cryptoObj as any).randomUUID === 'function') {
    return normalizeUuid((cryptoObj as any).randomUUID());
  }

  const bytes = new Uint8Array(16);

  if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
    cryptoObj.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  // RFC4122 v4
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};
