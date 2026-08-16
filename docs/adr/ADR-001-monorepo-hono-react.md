# ADR-001: Monorepo構成および Hono + React の採用

## ステータス
承認済み (Accepted)

## コンテキスト
システム開発部署向け人材管理システム「SkillMatrix」は、型安全なAPI通信、高いパフォーマンス、完全オフライン稼働、高い保守性を同時に満たす必要があります。

## 意思決定
1. **Monorepo**: npm workspaces を採用し、`packages/shared`, `packages/backend`, `packages/frontend` の3層で管理。型定義とZodスキーマを共有。
2. **Backend**: Node.js LTS上で動作する軽量高速Webフレームワーク `Hono` を採用。Prisma ORMでSQL Serverと接続。
3. **Frontend**: `React` + `Vite` + `Tailwind CSS` + `shadcn/ui` を採用し、モダンなUIと高い応答性を確保。

## 結果と影響
- 共通型定義によりAPIコントラクトの不整合をゼロ化。
- 軽量かつ標準準拠なHonoにより、Windows ServiceおよびDocker環境での低メモリ・高速起動を実現。
