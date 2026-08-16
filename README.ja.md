# SkillMatrix (スキルマトリクス)

> **SkillMatrix** は、システム開発組織の人材・組織・保有資格（添付証明書）・実務経歴（重複期間除外のUnion計算）・部署固有スキルセット・自己/所属長評価・評価履歴・人材検索・ダッシュボード・不変監査ログを一元管理するエンタープライズ品質のWebアプリケーションです。外部インターネット、CDN、外部フォント、外部テレメトリへのアクセスを一切必要としない **完全オフライン環境** で動作します。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node: LTS](https://img.shields.io/badge/Node.js-v20%20LTS-green.svg)]()
[![Database: SQL Server](https://img.shields.io/badge/Database-SQL%20Server-red.svg)]()

---

## 🌟 主要機能

- **任意階層の組織ツリー**: Materialized Path 方式を採用し、配下部署を含む高速な権限解決と集計を実現。
- **部署固有のスキル定義**: 部署ごとに独立したスキルセットを定義可能（他部署のスキルと混ざりません）。
- **自己評価・所属長評価の並行管理**: `A`（指導可能）、`B`（単独実務遂行可能）、`C`（支援があれば遂行可能）、`未評価` を並列表示。
- **評価変更履歴タイムライン**: いつ、誰が、何の理由で評価を変更したかを完全追跡。
- **保有資格・証明書ファイル管理**: 資格マスタ＋自由入力。PDF/PNG/JPG等の証明書ファイル（最大10MB）をUUID安全ファイル名でローカル保存。MIMEマジックナンバー検証および将来のVirusScanner連携IF。
- **実務経歴と重複期間Union算出**: 案件ごとの使用技術を登録。重複期間（例: 2023-01〜2023-12と2023-06〜2024-05）を自動マージし、水増しのない正確な実務経験月数・年数を算出。
- **5000人規模対応 人材検索**: 氏名、社員番号、部署、役職、資格、スキル評価、実務経験年数、使用技術による高速複合検索（サーバーサイドページネーション）。
- **ダッシュボード & KPI**: Recharts によるスキル分布（自己 vs 上長）、評価ギャップ、経験年数分布、資格保有トップ、未評価スキルの可視化。
- **セキュリティ & RBAC**: APIレイヤーでの厳格な認可（`ADMIN`、`DEPARTMENT_MANAGER`、`GENERAL`）によるIDOR完全遮断、SQL Serverセッション管理、HttpOnly Cookie、5回失敗で15分アカウントロック、CSRF対策。
- **不変監査ログ**: 社員が物理削除された後も過去ログを保持し、変更前後のJSON差分スナップショットを記録。
- **完全オフライン運用**: Google Fonts、外部CDN、外部画像、外部API、外部テレメトリへのランタイム依存ゼロ。

---

## 🏗️ システムアーキテクチャ

`npm workspaces` による Monorepo 構成：

```
skill-matrix/
├── packages/
│   ├── shared/       # 共通型定義, Zodスキーマ, 定数, i18nリソース, 期間Union計算ロジック
│   ├── backend/      # Hono REST API (/api/v1/*), Node.js, Prisma ORM, SQL Server, 監査ログ
│   └── frontend/     # React, Vite, Tailwind CSS, shadcn/ui, TanStack Table, Recharts
├── scripts/          # Windows向け PowerShell 管理・サービス登録スクリプト群
├── docker/           # マルチステージDockerfile, docker-compose.yml, オフライン用スクリプト
└── docs/             # 体系的な技術設計書群 (00〜08, ADRs)
```

---

## 🚀 クイックスタート (開発環境)

### 前提条件
- Node.js v20 LTS
- Node.js v20 LTS
- Docker / Docker Desktop または PostgreSQL 16
- Windows PowerShell / Bash

### 1. インストール
```powershell
git clone https://github.com/momomo17svt-dev/skill-matrix.git
cd skill-matrix
npm install
```

### 2. 環境変数設定
`.env.example` を `.env` にコピーし、PostgreSQL 接続情報を設定（Docker 利用時は自動設定）：
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/skillmatrix?schema=public"
SESSION_SECRET="your-super-secure-random-32-char-string"
```

### 3. DBマイグレーション & デモデータ投入
```powershell
# DBスキーマ反映
npm run db:migrate

# デモデータ (25名、3階層組織、スキル、資格、実務歴、評価履歴) 投入
npm run db:seed
```

### 4. 開発サーバー起動 (ローカル Node.js 実行)
```powershell
npm run dev
```
ブラウザで `http://localhost:5173` にアクセスします。

---

### 🐳 Docker による起動方法 (コンテナ単体 / 本番モード)

Docker Desktop または Docker Engine が動作している環境では、コンテナ単体でバックエンドAPIおよびフロントエンドSPA画面（ポート `3000`）を起動できます。

#### パターン A: 通常起動 (ソースコードからビルドして起動)
```bash
# Docker Compose でビルド & バックグラウンド起動
docker compose -f docker/docker-compose.yml up -d --build
```

#### パターン B: オフライン起動 (tar アーカイブからロードして起動)
事前に生成された `images/skillmatrix-offline-image.tar` を読み込んで起動する場合：
```bash
# 1. イメージのロード
# [Windows PowerShell の場合]
powershell -ExecutionPolicy Bypass -File .\docker\load-images.ps1
# [Linux / Bash の場合]
bash docker/load-images.sh

# 2. コンテナ起動 (外部Pullなし)
docker compose -f docker/docker-compose.yml up -d
```
※ 手動でロードする場合は直接 `docker load -i images/skillmatrix-offline-image.tar` を実行してください。

---

#### アクセス先
ブラウザで **[http://localhost:3000](http://localhost:3000)** にアクセスします。

#### 停止コマンド:
```bash
docker compose -f docker/docker-compose.yml down
```

---

### 🗄️ SQL Server (データベース) の構成について

本システムでは、環境に合わせて以下の **2 つの DB 構成** に対応しています：

| 構成パターン | 想定環境 | 概要・起動方法 |
| :--- | :--- | :--- |
| **パターン 1: 既存 / ホスト SQL Server 連携**<br>*(デフォルト)* | Windows ホストに `SQLEXPRESS` がある場合、または社内の共有 SQL Server を利用する場合 | `docker-compose.yml` でアプリコンテナのみを起動し、ホスト側（または外部）の SQL Server に接続します。<br>`docker compose -f docker/docker-compose.yml up -d` |
| **パターン 2: All-in-One Docker 構成**<br>*(DB も Docker で起動)* | ホストマシンに SQL Server をインストールしていない場合（Linux サーバーやクリーンな検証環境など） | SQL Server コンテナ（`mssql/server:2022`）とアプリコンテナをまとめて Docker 上で起動します。<br>`docker compose -f docker/docker-compose.with-db.yml up -d` |

#### デモ用初期アカウント:
- **システム管理者 (ADMIN)**: `admin` / `Password123!`
- **第1開発部長 (MANAGER)**: `takahashi.i` / `Password123!`
- **一般社員 (GENERAL)**: `watanabe.k` / `Password123!`

---

## 🧪 テスト & 品質検証

```powershell
# 全単体・統合テストの実行
npm test

# TypeScript 型チェック
npm run typecheck

# オフライン完全性検査 (ビルド成果物内の外部CDN・Webフォント参照スキャン)
npm run verify:offline
```

---

## 📦 オフラインデプロイ手順 (閉域網・完全オフライン環境)

### 1. Docker 環境でのオフライン起動 (Ubuntu / Linux / Windows Docker)

#### 事前準備 (インターネット接続環境):
```bash
# Linux / macOS
bash docker/save-images.sh

# Windows (PowerShell)
powershell -ExecutionPolicy Bypass -File .\docker\save-images.ps1
```
`images/skillmatrix-offline-image.tar`（約 112 MB）が生成されます。

#### 閉域オフライン環境での起動:
1. `images/skillmatrix-offline-image.tar`、`docker/docker-compose.yml`、`.env.example` を閉域サーバーへ持ち込みます。
2. 以下の手順でイメージを読み込み、コンテナを起動します：

```bash
# [Linux の場合]
bash docker/load-images.sh
cp .env.example .env
docker compose -f docker/docker-compose.yml up -d

# [Windows PowerShell の場合]
powershell -ExecutionPolicy Bypass -File .\docker\load-images.ps1
Copy-Item .env.example .env
docker compose -f docker/docker-compose.yml up -d
```
起動後、ブラウザで **`http://<サーバーIPまたはlocalhost>:3000`** にアクセスします。

---

### 2. Windows サービス環境 (PowerShell / Windows Task Scheduler)
1. インターネット接続環境でスタンドアロン配布用ZIPを生成：
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\bundle-offline-windows.ps1
   ```
2. 生成された `skillmatrix-offline-windows.zip` を閉域環境へ持ち込み展開。
3. `.env` の接続情報を設定後、以下を実行：
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\migrate.ps1
   powershell -ExecutionPolicy Bypass -File .\scripts\service-install.ps1
   powershell -ExecutionPolicy Bypass -File .\scripts\service-start.ps1
   ```

---

## 📄 ライセンス

本ソフトウェアは [MIT License](LICENSE) の下で公開されています。
