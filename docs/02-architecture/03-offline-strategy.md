# 完全オフライン運用設計書

## 1. 原則と制約
デプロイ先の本番環境は **完全オフライン（物理的または論理的にインターネット切断された閉域環境）** です。
以下の外部通信・外部リソース要求は一切発生してはなりません。

- ❌ `npm install` / `npm fetch` / `npm update`
- ❌ `docker pull` / Docker Hub へのアクセス
- ❌ GitHub / GitLab 等へのアクセス
- ❌ Google Fonts / Typekit 等の外部Webフォント参照
- ❌ cdnjs / unpkg / jsdelivr / FontAwesome 等の外部CDN参照
- ❌ 外部画像URL (`https://...` のアバター・画像)
- ❌ 外部認証 (Auth0, Firebase Auth, Google OAuth 等)
- ❌ 外部SaaS・API (Sentry, Google Analytics, Datadog等の外部Telemetry)
- ❌ 外部NTP等の時間同期API (OSのシステム時刻を使用)

## 2. アセットのローカルバンドル化
1. **フォント**:
   - Google Fontsへのリンクタグ（`<link href="https://fonts.googleapis.com/...">`）は使用せず、システム標準フォントスタック（Segoe UI, Meiryo, Yu Gothic, Noto Sans JP, sans-serif）またはローカル配置したWOFF2フォントを使用します。
2. **アイコン**:
   - `lucide-react` をローカルパッケージとしてViteビルド内に完全バンドルします。
3. **スタイル & ライブラリ**:
   - Tailwind CSS および shadcn/ui コンポーネントはビルド時に静的CSS (`dist/assets/index-*.css`) にプリコンパイルされます。

## 3. 配布パッケージ方針
### A. Windows環境向けオフラインパッケージ
1. **構成**:
   - ビルド済みバックエンド (`packages/backend/dist`)
   - ビルド済みフロントエンド静的ファイル (`packages/frontend/dist` -> バックエンドが静的ファイル配信または専用静的サーブ)
   - 本番用 `node_modules` (プロダクション依存のみ同梱)
   - Node.js LTS ポータブルバイナリ（必要に応じて同梱）
   - 管理用PowerShellスクリプト (`scripts/service-install.ps1`, `scripts/migrate.ps1`, `scripts/healthcheck.ps1` 等)
2. **起動・運用**:
   - インストーラースクリプトによりWindows Serviceとして登録、またはバッチで即時バックグラウンド起動。

### B. Ubuntu/Linux環境向けオフラインDockerパッケージ
1. **事前準備（オンライン環境）**:
   - `docker build` により単一または複合コンテナイメージを作成。
   - `docker save -o skillmatrix-offline-images.tar <image-name>` でtarファイルへ保存。
2. **本番展開（オフライン環境）**:
   - `docker load -i skillmatrix-offline-images.tar` でイメージを展開。
   - `docker compose up -d` （`pull_policy: never` 設定）でローカル起動。

## 4. 自動オフライン整合性検証 (CI/Build時)
- ビルド後の `dist/` 配下の HTML/JS/CSS に対して正規表現スキャン（`http://`, `https://`, `//fonts.`, `//cdn.` 等）を実行し、外部URL参照が含まれていないことを自動検証するテストスクリプト `verify-offline.ts` を提供します。
