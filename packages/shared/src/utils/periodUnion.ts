export interface DateInterval {
  startYearMonth: string; // "YYYY-MM"
  endYearMonth?: string | null; // "YYYY-MM" or null/empty
  isCurrent?: boolean;
}

export interface NormalizedInterval {
  startMonth: number;
  endMonth: number;
}

/**
 * "YYYY-MM" 文字列を絶対月数 (year * 12 + month) に変換します。
 */
export function yearMonthToTotalMonths(yearMonth: string): number {
  const parts = yearMonth.split('-');
  if (parts.length !== 2) {
    throw new Error(`Invalid year-month format: "${yearMonth}". Expected "YYYY-MM".`);
  }
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    throw new Error(`Invalid year-month values: "${yearMonth}".`);
  }
  return year * 12 + month;
}

/**
 * 絶対月数から "YYYY-MM" 文字列へ変換します。
 */
export function totalMonthsToYearMonth(totalMonths: number): string {
  const year = Math.floor((totalMonths - 1) / 12);
  const month = ((totalMonths - 1) % 12) + 1;
  const monthStr = month < 10 ? `0${month}` : `${month}`;
  return `${year}-${monthStr}`;
}

/**
 * 現在の年月を "YYYY-MM" で取得します。
 */
export function getCurrentYearMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const monthStr = month < 10 ? `0${month}` : `${month}`;
  return `${year}-${monthStr}`;
}

/**
 * 複数の期間（重複あり）を受け取り、区間マージ（Union）を行って合計実稼働月数を算出します。
 */
export function calculateMergedMonths(
  intervals: DateInterval[],
  currentYearMonth: string = getCurrentYearMonth()
): { totalMonths: number; mergedIntervals: NormalizedInterval[] } {
  if (!intervals || intervals.length === 0) {
    return { totalMonths: 0, mergedIntervals: [] };
  }

  const currentTotalMonth = yearMonthToTotalMonths(currentYearMonth);

  // 1. 各区間を正規化
  const normalized: NormalizedInterval[] = [];
  for (const item of intervals) {
    if (!item.startYearMonth) continue;
    const start = yearMonthToTotalMonths(item.startYearMonth);
    let end: number;
    if (item.isCurrent || !item.endYearMonth) {
      end = currentTotalMonth;
    } else {
      end = yearMonthToTotalMonths(item.endYearMonth);
    }

    if (start <= end) {
      normalized.push({ startMonth: start, endMonth: end });
    }
  }

  if (normalized.length === 0) {
    return { totalMonths: 0, mergedIntervals: [] };
  }

  // 2. 開始月で昇順ソート
  normalized.sort((a, b) => a.startMonth - b.startMonth);

  // 3. 区間マージ (Union)
  const merged: NormalizedInterval[] = [normalized[0]];
  for (let i = 1; i < normalized.length; i++) {
    const current = normalized[i];
    const last = merged[merged.length - 1];

    if (current.startMonth <= last.endMonth + 1) {
      // 重複または連続しているため結合
      last.endMonth = Math.max(last.endMonth, current.endMonth);
    } else {
      merged.push(current);
    }
  }

  // 4. 合計月数を集計（各区間は end - start + 1 ヶ月）
  const totalMonths = merged.reduce((sum, item) => sum + (item.endMonth - item.startMonth + 1), 0);

  return { totalMonths, mergedIntervals: merged };
}

/**
 * 月数から年数表記（例: "2年3ヶ月", "0年8ヶ月"）を生成します。
 */
export function formatExperience(
  totalMonths: number,
  locale: 'ja' | 'en' = 'ja'
): { years: number; months: number; formatted: string; decimalYears: number } {
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const decimalYears = Math.round((totalMonths / 12) * 10) / 10;

  let formatted = '';
  if (locale === 'ja') {
    if (years > 0 && months > 0) {
      formatted = `${years}年${months}ヶ月`;
    } else if (years > 0) {
      formatted = `${years}年`;
    } else {
      formatted = `${months}ヶ月`;
    }
  } else {
    if (years > 0 && months > 0) {
      formatted = `${years} yr${years > 1 ? 's' : ''} ${months} mo${months > 1 ? 's' : ''}`;
    } else if (years > 0) {
      formatted = `${years} yr${years > 1 ? 's' : ''}`;
    } else {
      formatted = `${months} mo${months > 1 ? 's' : ''}`;
    }
  }

  return { years, months, formatted, decimalYears };
}
