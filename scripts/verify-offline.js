import fs from 'fs';
import path from 'path';

/**
 * ビルド成果物（dist/）内のHTML/JS/CSSファイルを走査し、
 * 外部CDN、外部Webフォント、外部テレメトリ等の外部URL参照が存在しないか検証します。
 */

const FORBIDDEN_PATTERNS = [
  /https?:\/\/fonts\.(googleapis|gstatic)\.com/i,
  /https?:\/\/cdnjs\.cloudflare\.com/i,
  /https?:\/\/cdn\.jsdelivr\.net/i,
  /https?:\/\/unpkg\.com/i,
  /https?:\/\/use\.fontawesome\.com/i,
  /https?:\/\/cdn\.tailwindcss\.com/i,
  /https?:\/\/www\.google-analytics\.com/i,
  /https?:\/\/browser\.sentry-cdn\.com/i
];

function scanDirectory(dir, issues = []) {
  if (!fs.existsSync(dir)) return issues;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDirectory(fullPath, issues);
    } else if (/\.(html|js|css|json)$/i.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const pattern of FORBIDDEN_PATTERNS) {
        if (pattern.test(content)) {
          issues.push({
            file: fullPath,
            pattern: pattern.toString()
          });
        }
      }
    }
  }
  return issues;
}

console.log('--- SkillMatrix Offline Integrity Verification ---');

const targets = [
  path.resolve('./packages/frontend/dist'),
  path.resolve('./packages/backend/dist')
];

let hasError = false;

for (const target of targets) {
  if (fs.existsSync(target)) {
    console.log(`Scanning build directory: ${target}`);
    const issues = scanDirectory(target);
    if (issues.length > 0) {
      hasError = true;
      console.error(`FAILED: Forbidden external URLs found in ${target}:`);
      issues.forEach((issue) => console.error(` - File: ${issue.file} (Matches: ${issue.pattern})`));
    } else {
      console.log(`PASS: No external runtime network dependencies found in ${target}`);
    }
  } else {
    console.log(`Notice: Target directory ${target} does not exist yet. Run build first.`);
  }
}

if (hasError) {
  process.exit(1);
} else {
  console.log('--- Offline Integrity Check SUCCESS ---');
}
