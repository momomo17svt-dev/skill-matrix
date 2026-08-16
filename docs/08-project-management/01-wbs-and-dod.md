# WBS と Definition of Done (完成基準)

## 1. WBS (Work Breakdown Structure)
- **Phase 0**: 環境・要件確認 [完了]
- **Phase 1**: 設計書体系化 (`docs/`, `adr/`) [進行中]
- **Phase 2**: プロジェクトハーネス・設定 (`CLAUDE.md`, `AGENTS.md`, `Skills`, `Hooks`, Monorepo構成)
- **Phase 3**: 共通パッケージ (`packages/shared` - 型, Zod, i18n, Period Union)
- **Phase 4**: バックエンド実装 (`packages/backend` - Prisma, Auth, RBAC, Services, Routes, Tests)
- **Phase 5**: フロントエンド実装 (`packages/frontend` - React, UI Components, Pages, i18n, Theme)
- **Phase 6**: 多層テスト・検証 (Unit, API Integration, Authorization, DB, E2E)
- **Phase 7**: オフラインパッケージング & デプロイスクリプト (Windows PowerShell, Docker)
- **Phase 8**: ドキュメント同期 & 最終検証 (Definition of Done チェック)

## 2. Definition of Done (DoD) チェックリスト
- [ ] 全要求機能（組織、社員、スキル、資格・添付、実務経歴、検索、ダッシュボード、監査ログ、認証、権限）の実装完了
- [ ] Lintエラー = 0
- [ ] TypeScript型エラー = 0
- [ ] 単体テスト（Unit Tests） PASS (100%)
- [ ] API統合テスト（Integration Tests） PASS (100%)
- [ ] 認可・IDORテスト（Authorization Tests） PASS (100%)
- [ ] E2Eテスト（Playwright Tests） PASS (100%)
- [ ] Productionビルド成功 (Frontend & Backend)
- [ ] DBマイグレーション検証成功 (SQL Server)
- [ ] デモデータ（25名シード）投入検証成功
- [ ] 日本語/英語 UI切替検証成功
- [ ] Light/Dark テーマ切替検証成功
- [ ] セキュリティ自己レビュー完了（パスワードハッシュ、セッション、Cookie、CSRF、マスキング）
- [ ] 設計書・README・README.ja・MIT License の完全同期
- [ ] Windows用オフライン配布物生成スクリプト検証完了
- [ ] Ubuntu用Dockerオフライン構成検証完了
- [ ] ランタイムインターネット依存ゼロ（CDN, 外部フォント, 外部API参照なし）
- [ ] ヘルスチェック (`/health`, `/ready`) PASS
- [ ] 不完全なTODO/モック/スタブの未残存確認
