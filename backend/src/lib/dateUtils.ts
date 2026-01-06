import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

// Set default timezone to Asia/Tokyo
dayjs.tz.setDefault('Asia/Tokyo');

const JST_TZ = 'Asia/Tokyo';
const ISO_WITH_OFFSET = 'YYYY-MM-DDTHH:mm:ss.SSSZ';

export const DateUtils = {
  /**
   * 現在日時(ISO8601形式)を取得する
   * @returns {string} ISO8601 formatted date string
   */
  now: (): string => {
    return dayjs().tz(JST_TZ).format(ISO_WITH_OFFSET);
  },

  /**
   * 指定した日時(ISO8601形式)を取得する
   * @param {string | Date | number} date
   * @returns {string} ISO8601 formatted date string
   */
  format: (date: string | Date | number): string => {
    return dayjs(date).tz(JST_TZ).format(ISO_WITH_OFFSET);
  },

  /**
   * 現在のUnixタイムスタンプ(秒)を取得する
   * @returns {number} Unix timestamp in seconds
   */
  unix: (): number => {
    return dayjs().tz(JST_TZ).unix();
  },

  /**
   * `YYYY/MM/DD` を厳密に解釈して ISO8601(UTC) に変換する
   */
  parseYmdSlashToIso: (ymd: string): string | null => {
    const parsed = dayjs.tz(ymd.trim(), 'YYYY/MM/DD', JST_TZ);
    if (!parsed.isValid()) return null;
    return parsed.startOf('day').format(ISO_WITH_OFFSET);
  },

  /** 今日の日付 (YYYY-MM-DD) を返す */
  todayYmd: (): string => {
    return dayjs().tz(JST_TZ).format('YYYY-MM-DD');
  },

  /** ISO8601 などの日時から日付 (YYYY-MM-DD) を返す */
  toYmd: (date: string | Date | number): string => {
    return dayjs(date).tz(JST_TZ).format('YYYY-MM-DD');
  },

  /** YYYY-MM-DD に日数を加算して YYYY-MM-DD を返す */
  addDaysYmd: (ymd: string, days: number): string => {
    const parsed = dayjs(ymd.trim(), 'YYYY-MM-DD', true);
    if (!parsed.isValid()) {
      throw new Error(`Invalid YYYY-MM-DD: ${ymd}`);
    }
    return parsed.add(days, 'day').format('YYYY-MM-DD');
  },

  /** YYYY-MM-DD を厳密に検証する */
  isValidYmd: (ymd: string): boolean => {
    if (typeof ymd !== 'string') return false;
    const parsed = dayjs(ymd.trim(), 'YYYY-MM-DD', true);
    return parsed.isValid();
  },
};
