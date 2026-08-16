# ADR-009: データベースの PostgreSQL への完全移行と All-in-One Docker 構成の採用

## ステータス
承認済み (Accepted) - 2026-08-17

## コンテキスト (背景)
SkillMatrix は当初 SQL Server を利用する前提で設計されていましたが、以下の課題が判明しました：
1. **Docker コンテナイメージの容量肥大化**: SQL Server 公式イメージ（`mcr.microsoft.com/mssql/server`）は容量が **約 1.5GB 〜 2GB** あり、完全オフライン環境（閉域網）への持ち運びや配布時にネットワークやメディアの負担が大きい。
2. **クロスプラットフォーム性**: Linux/macOS 環境での SQL Server の運用オーバーヘッドおよび Windows 認証依存。

## 決定事項 (Decision)
1. **RDBMS を PostgreSQL (16-Alpine) へ完全移行**:
   - `packages/backend/prisma/schema.prisma` の provider を `postgresql` に移行。
   - `postgres:16-alpine`（約 85MB）を採用し、App コンテナ（約 112MB）と合わせて **合計約 240MB の超軽量 All-in-One Docker 構成** を実現。
2. **完全オフライン配布パッケージの刷新**:
   - `images/skillmatrix-offline-image.tar` に `skillmatrix-app:latest` と `postgres:16-alpine` をまとめて同梱。
   - 閉域サーバー側では、DB の手動インストール不要で `docker load` および `docker compose up -d` のみで即座に完全稼働。

## 影響・効果 (Consequences)
- **圧倒的な軽量化**: Docker イメージアーカイブが従来の 1.5GB〜2GB から **約 240MB（約 1/8）** に削減。
- **ポータビリティの向上**: Windows / Ubuntu / RHEL 等、あらゆる OS で同一の Docker Compose コマンドで一発起動可能。
- **データモデル・型安全性の維持**: Prisma ORM により、既存の Zod スキーマ・TypeScript DTO・ビジネスロジックは一切破壊されることなく 100% 互換性を維持。
