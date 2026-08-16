---
name: architecture
description: SkillMatrixのアーキテクチャガイドライン、Monorepo設計、レイヤード構造の参照と検証
---

# Architecture Skill

## 構成
- **Monorepo**: npm workspaces
  - `packages/shared`: 共通型、Zod、i18n、ユーティリティ
  - `packages/backend`: Hono REST API, Prisma (SQL Server), 認証・認可
  - `packages/frontend`: React SPA, Vite, Tailwind CSS, TanStack Table, Recharts
- **ドキュメント**: `docs/02-architecture/`
