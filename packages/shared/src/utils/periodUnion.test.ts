import { describe, it, expect } from 'vitest';
import { calculateMergedMonths, formatExperience, yearMonthToTotalMonths, totalMonthsToYearMonth } from './periodUnion.js';

describe('Period Union Utility', () => {
  it('should correctly convert YYYY-MM to total months and back', () => {
    const ym = '2024-05';
    const total = yearMonthToTotalMonths(ym);
    expect(total).toBe(2024 * 12 + 5);
    expect(totalMonthsToYearMonth(total)).toBe(ym);
  });

  it('should calculate merged months without overlapping intervals', () => {
    // 2023-01 to 2023-03 (3 months) + 2023-05 to 2023-06 (2 months) = 5 months
    const intervals = [
      { startYearMonth: '2023-01', endYearMonth: '2023-03' },
      { startYearMonth: '2023-05', endYearMonth: '2023-06' }
    ];
    const result = calculateMergedMonths(intervals);
    expect(result.totalMonths).toBe(5);
    expect(result.mergedIntervals.length).toBe(2);
  });

  it('should merge overlapping intervals correctly (avoiding inflating years)', () => {
    // Project A: 2023-01 to 2023-12 (12 months)
    // Project B: 2023-06 to 2024-05 (12 months)
    // Merged: 2023-01 to 2024-05 = 17 months (NOT 24 months)
    const intervals = [
      { startYearMonth: '2023-01', endYearMonth: '2023-12' },
      { startYearMonth: '2023-06', endYearMonth: '2024-05' }
    ];
    const result = calculateMergedMonths(intervals);
    expect(result.totalMonths).toBe(17);
    expect(result.mergedIntervals.length).toBe(1);

    const formatted = formatExperience(result.totalMonths, 'ja');
    expect(formatted.years).toBe(1);
    expect(formatted.months).toBe(5);
    expect(formatted.formatted).toBe('1年5ヶ月');
    expect(formatted.decimalYears).toBe(1.4);
  });

  it('should merge consecutive intervals (adjacent months)', () => {
    // 2023-01 to 2023-06 and 2023-07 to 2023-12 -> 12 months continuous
    const intervals = [
      { startYearMonth: '2023-01', endYearMonth: '2023-06' },
      { startYearMonth: '2023-07', endYearMonth: '2023-12' }
    ];
    const result = calculateMergedMonths(intervals);
    expect(result.totalMonths).toBe(12);
    expect(result.mergedIntervals.length).toBe(1);
  });

  it('should handle isCurrent flag correctly', () => {
    const intervals = [
      { startYearMonth: '2024-01', isCurrent: true }
    ];
    const result = calculateMergedMonths(intervals, '2024-06');
    expect(result.totalMonths).toBe(6);
  });
});
