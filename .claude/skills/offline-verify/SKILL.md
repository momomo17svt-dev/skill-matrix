---
name: offline-verify
description: 成果物内の外部CDN、外部Webフォント、外部API依存の自動検査
---

# Offline Verification Skill

## チェック項目
- `dist/` 配下の HTML/JS/CSS に `fonts.googleapis.com`, `cdnjs`, `unpkg.com` 等の外部URL参照がないこと。
- システムフォントまたはローカルWOFF2フォントが適用されていること。
- Docker Compose が `pull_policy: never` で起動可能であること。
