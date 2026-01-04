import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

// Set default timezone to Asia/Tokyo
dayjs.tz.setDefault('Asia/Tokyo');

export const DateUtils = {
  /**
   * 現在日時(ISO8601形式)を取得する
   * @returns {string} ISO8601 formatted date string
   */
  now: (): string => {
    return dayjs().toISOString();
  },

  /**
   * 指定した日時(ISO8601形式)を取得する
   * @param {string | Date | number} date
   * @returns {string} ISO8601 formatted date string
   */
  format: (date: string | Date | number): string => {
    return dayjs(date).toISOString();
  },

  /**
   * 現在のUnixタイムスタンプ(秒)を取得する
   * @returns {number} Unix timestamp in seconds
   */
  unix: (): number => {
    return dayjs().unix();
  },
};
