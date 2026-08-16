# Windows オフラインデプロイ設計書

## 1. 概要
Windows Server / Windows 10/11 閉域環境において、外部通信（`npm install` 等）を一切行わずに SkillMatrix を導入・運用するための手順です。

## 2. パッケージ構成
配布パッケージ（`skillmatrix-windows-vX.Y.Z.zip`）には以下が含まれます：
- `dist/` (バックエンドビルド成果物およびフロントエンドSPA静的成果物)
- `node_modules/` (ビルド済み本番実行依存ライブラリ)
- `scripts/` (PowerShell 管理スクリプト群)
- `.env.example`
- `prisma/` (マイグレーション定義)

## 3. PowerShell 管理コマンド一覧
- `scripts/service-install.ps1`: NSSM または Windows Task/Service としてサービス登録
- `scripts/service-start.ps1`: アプリケーションサービス開始
- `scripts/service-stop.ps1`: アプリケーションサービス停止
- `scripts/service-status.ps1`: サービス状態確認
- `scripts/service-uninstall.ps1`: サービス登録解除
- `scripts/migrate.ps1`: 明示的DBマイグレーション実行
- `scripts/seed.ps1`: 開発/デモデータ投入（本番環境プロテクト付き）
- `scripts/healthcheck.ps1`: `/health` および `/ready` の監視・動作検証

## 4. デプロイ手順
1. パッケージZIPを解凍。
2. `.env.example` をコピーして `.env` を作成し、SQL Server接続文字列（`Server=localhost\SQLEXPRESS;...`）等を設定。
3. `powershell -ExecutionPolicy Bypass -File .\scripts\migrate.ps1` を実行してDBスキーマを適用。
4. `powershell -ExecutionPolicy Bypass -File .\scripts\service-install.ps1` でサービスを登録・起動。
5. `powershell -ExecutionPolicy Bypass -File .\scripts\healthcheck.ps1` で起動完了を確認。
