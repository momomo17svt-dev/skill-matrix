# 実務経歴 期間Union算出アルゴリズム設計書

## 1. 課題と目的
社員が複数のプロジェクトに同時並行でアサインされ、同一期間に同一技術（例: C#, React等）を使用した場合、各プロジェクトの期間を単純加算すると実働期間が過大（水増し）計上されます。
（例: 2023-01〜2023-12の案件Aと、2023-06〜2024-05の案件Bで共にTypeScriptを使用した場合、単純加算では 12 + 12 = 24ヶ月 となりますが、実際の実務従事期間は 2023-01〜2024-05 の 17ヶ月 です）。

## 2. アルゴリズム（区間マージ / Interval Union）
1. **期間の標準化**:
   - `startYearMonth` (例: `2023-04`) -> 開始月インデックス (例: `2023 * 12 + 4 = 24280`)
   - `endYearMonth` (例: `2023-09`) -> 終了月インデックス (例: `2023 * 12 + 9 = 24285`)。`isCurrent=true` の場合は現在年月を採用。
2. **区間ソート**:
   - 対象技術または全経歴の期間リスト `[{start, end}]` を `start` 昇順でソート。
3. **区間マージ (Union)**:
   ```typescript
   export function calculateMergedMonths(intervals: { startMonth: number; endMonth: number }[]): number {
     if (intervals.length === 0) return 0;
     const sorted = [...intervals].sort((a, b) => a.startMonth - b.startMonth);
     const merged: { startMonth: number; endMonth: number }[] = [sorted[0]];

     for (let i = 1; i < sorted.length; i++) {
       const current = sorted[i];
       const last = merged[merged.length - 1];

       if (current.startMonth <= last.endMonth + 1) {
         // 重複または連続しているため統合
         last.endMonth = Math.max(last.endMonth, current.endMonth);
       } else {
         merged.push(current);
       }
     }

     return merged.reduce((total, interval) => total + (interval.endMonth - interval.startMonth + 1), 0);
   }
   ```
4. **年数・月数換算**:
   - 総実働月数を `年 + ヶ月`（例: 17ヶ月 -> `1年5ヶ月`、年数換算: `1.4年`）へフォーマットしてUI表示および検索条件マッチングに利用。
