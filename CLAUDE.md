# CLAUDE.md - SkillMatrix Autonomous Development Guide

## Project Mission
SkillMatrix は、システム開発組織の人材情報（社員・組織・スキル評価・資格/証明書・実務経歴・人材検索・ダッシュボード・監査ログ）を一元管理するWebアプリケーションです。完全オフライン環境（Windows & Ubuntu Docker）への展開を前提とし、OSS公開可能な品質で構築されます。

## Source of Truth
- システム要件・アーキテクチャ・DB設計・API仕様のSource of Truthはすべて `docs/` 配下の設計書および `docs/adr/` に存在します。
- コード変更や仕様拡張時は、必ず `docs/` を同時に更新してください。

## Architecture Rules
- **Monorepo**: npm workspaces (`packages/shared`, `packages/backend`, `packages/frontend`)
- **Backend**: Hono + Node.js LTS + REST API (`/api/v1/*`) + Zod + Prisma (SQL Server)
- **Frontend**: React + Vite + TypeScript + Tailwind CSS + shadcn/ui + TanStack Table + Recharts
- **Database**: Microsoft SQL Server (`Server=localhost\SQLEXPRESS`)
- **No Automatic Migration**: 本番アプリ起動時の自動マイグレーションは禁止。明示的マイグレーションスクリプトを使用。

## Security & RBAC Rules
- ロール: `ADMIN`, `DEPARTMENT_MANAGER`, `GENERAL`
- 認可は必ずバックエンドAPI側で検証（フロントエンド非表示だけに依存しない）。
- IDOR防止: 部署階層ツリー判定をAPIで実施し、別部署/他社員データへの不正アクセスを403拒絶。
- 認証: ログインID＋パスワード（bcryptハッシュ）。セッションはSQL Serverで管理。
- Cookie属性: `HttpOnly=true`, `SameSite=Lax`, `Secure=true` (開発HTTP許容)。localStorageへトークン保存禁止。
- ログイン5回失敗で15分アカウントロック。
- 監査ログ: 不変（Append-only）。社員物理削除時も監査ログは削除禁止。
- ログマスキング: パスワード、Cookie、セッショントークン、個人機密情報を除外。

## Offline Deployment Rules
- 実行時の外部通信（npm install, docker pull, GitHub, CDN, Google Fonts, 外部API, 外部画像, 外部テレメトリ）は **完全禁止**。
- すべてのアセット（フォント、アイコン、CSS、JS）はローカルにバンドル。
- Windows: PowerShellによるサービス管理（install, uninstall, start, stop, status, migrate, healthcheck）。
- Ubuntu: `docker save` したtarイメージによるオフライン `docker load` & `docker compose up -d`。

## i18n & UI Rules
- 日本語 (`ja`) および英語 (`en`) をサポート。UI文字列のハードコードを禁止し、`packages/shared` のlocale定義を使用。
- テーマ: `Light`, `Dark`, `System` を実装。
- PCブラウザ（Edge最新版, Chrome最新版）を対象。

## Development Loop & Quality Assurance
`PLAN -> IMPLEMENT -> TEST -> REVIEW -> FIX -> VERIFY -> DOCUMENT -> COMPLETE`
- 型安全性を徹底し、`any` を禁止。
- 未完成のTODOやモックを本番コードに残さない。
- テスト: 単体テスト、API統合テスト、DB統合テスト、認可・IDORテスト、Playwright E2Eテスト、オフラインアセット検査。
