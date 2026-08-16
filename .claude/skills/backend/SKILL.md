---
name: backend
description: Hono, Prisma (SQL Server), REST API, 認証・認可、セキュア実装のガイドライン
---

# Backend Skill

## 責務と規約
1. `/api/v1/*` プレフィックスの統一。
2. リクエストバリデーションは `packages/shared` の Zod スキーマを使用。
3. エラーハンドリングは `AppError` 経由で統一レスポンスを返却。
4. パスワードハッシュは `bcrypt` を使用。
5. セッションは SQL Server の `sessions` テーブルで管理。
