# REST API 仕様書 (`/api/v1/*`)

## 1. 共通仕様
- **ベースパス**: `/api/v1`
- **リクエスト/レスポンス形式**: JSON (`Content-Type: application/json` または `multipart/form-data`)
- **共通レスポンス構造**:
  - 成功時: `{ "success": true, "data": { ... } }`
  - 失敗時: `{ "success": false, "error": { "code": "ERROR_CODE", "message": "説明文", "details": [...] } }`
- **HTTPヘッダー**: `X-Request-Id` が全レスポンスに付与されます。

## 2. エンドポイント一覧

### 2.1 ヘルスチェック
- `GET /health` : プロセス稼働確認 (`{ "status": "ok" }`)
- `GET /ready` : 依存コンポーネント（DB接続・ストレージ）の正常性確認 (`{ "status": "ready", "db": "connected" }`)

### 2.2 認証 (`/api/v1/auth`)
- `POST /api/v1/auth/login`: ログイン (ID, パスワード) -> Cookie付与
- `POST /api/v1/auth/logout`: ログアウト -> セッション削除 & Cookie無効化
- `GET /api/v1/auth/me`: 現在のログインユーザー情報・権限取得
- `POST /api/v1/auth/change-password`: 自身のパスワード変更
- `POST /api/v1/auth/initial-password-change`: 初回パスワード強制変更
- `POST /api/v1/auth/reset-password`: 管理者によるパスワードリセット (ADMINのみ)

### 2.3 組織・部署 (`/api/v1/departments`)
- `GET /api/v1/departments`: 部署一覧・ツリー取得
- `POST /api/v1/departments`: 部署作成 (ADMIN)
- `PUT /api/v1/departments/:id`: 部署更新 (ADMIN)
- `DELETE /api/v1/departments/:id`: 部署削除 (ADMIN)

### 2.4 社員 (`/api/v1/employees`)
- `GET /api/v1/employees`: 社員一覧 (Server-side pagination: page, limit, sort, filter, departmentId)
- `GET /api/v1/employees/:id`: 社員詳細 (基本情報, 資格, 経歴, 部署スキル評価マトリクス)
- `POST /api/v1/employees`: 社員登録 (ADMIN)
- `PUT /api/v1/employees/:id`: 社員更新 (ADMIN / MANAGER / 本人一部項目)
- `DELETE /api/v1/employees/:id`: 社員削除 (ADMIN)

### 2.5 スキル & 評価 (`/api/v1/skills`, `/api/v1/evaluations`)
- `GET /api/v1/skills/department/:deptId`: 部署スキルセット一覧
- `POST /api/v1/skills`: スキルマスタ登録 (ADMIN / 該当部署MANAGER)
- `PUT /api/v1/skills/:id`: スキルマスタ更新
- `DELETE /api/v1/skills/:id`: スキルマスタ削除
- `POST /api/v1/evaluations/self`: 自己評価入力
- `POST /api/v1/evaluations/manager`: 所属長評価入力
- `GET /api/v1/evaluations/history/:employeeId`: 評価変更履歴一覧

### 2.6 資格 & 添付ファイル (`/api/v1/certifications`)
- `GET /api/v1/certifications/masters`: 資格マスタ一覧
- `POST /api/v1/certifications/masters`: 資格マスタ作成 (ADMIN)
- `PUT /api/v1/certifications/masters/:id`: 資格マスタ更新 (ADMIN, トランザクション & 監査ログ)
- `DELETE /api/v1/certifications/masters/:id`: 資格マスタ削除 (ADMIN, トランザクション & 参照整合性チェック & 監査ログ)
- `POST /api/v1/certifications/employee/:employeeId`: 社員資格登録 (添付ファイルアップロード対応)
- `PUT /api/v1/certifications/:id`: 社員資格更新
- `DELETE /api/v1/certifications/:id`: 社員資格削除
- `GET /api/v1/certifications/attachments/:attachmentId/download[/:filename]`: 添付ファイル安全ダウンロード (RFC 6266準拠ヘッダー)

### 2.7 実務経歴 (`/api/v1/work-histories`)
- `GET /api/v1/work-histories/employee/:employeeId`: 社員の実務経歴一覧 & 重複期間Union算出結果
- `POST /api/v1/work-histories/employee/:employeeId`: 実務経歴登録
- `PUT /api/v1/work-histories/:id`: 実務経歴更新
- `DELETE /api/v1/work-histories/:id`: 実務経歴削除

### 2.8 人材検索 (`/api/v1/search`)
- `POST /api/v1/search`: 複合条件検索（氏名, 社員番号, 部署, 役職, 資格, スキル+レベル, 実務経験年数, 使用技術）

### 2.9 ダッシュボード (`/api/v1/dashboard`)
- `GET /api/v1/dashboard/stats`: ロール別KPI集計データ取得

### 2.10 監査ログ (`/api/v1/audit-logs`)
- `GET /api/v1/audit-logs`: 監査ログ一覧 (ADMINのみ, page, limit, keyword, action, targetType, startDate, endDate による複合検索・ページネーション)
