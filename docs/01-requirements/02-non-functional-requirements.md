# 非機能要件定義書

## 1. セキュリティ要件
- **SEC-001: 認証方式**: ログインID＋パスワード認証。パスワードハッシュは `bcrypt`（salt rounds 10以上）を使用。
- **SEC-002: セッション管理**:
  - セッションIDは暗号論的擬似乱数（32バイト以上）で生成し、ハッシュ値をSQL Serverに保管。
  - Cookie属性: `HttpOnly=true`, `Secure=true` (開発HTTPでは条件付き許容), `SameSite=Lax`, `Path=/api`.
  - localStorageへのトークン保存は禁止。
- **SEC-003: アカウントロック**: 連続5回のパスワード試行失敗で15分間アカウントロック。
- **SEC-004: 認可 & IDOR防止**: APIレイヤーでの厳格なRBAC・テナント/部署境界チェック。
- **SEC-005: インジェクション対策**:
  - SQL Injection: Prisma ORMによるパラメータ化クエリの強制。生SQL使用時もバインドパラメータを徹底。
  - XSS: Reactによる自動エスケープ、およびContent-Security-Policy (CSP) の適用。
  - Path Traversal: アップロードファイル名にUUIDを採用し、実ファイルパスはサーバー側で完全に制御。
- **SEC-006: ファイルアップロード検証**:
  - ファイル拡張子（.pdf, .png, .jpg, .jpeg）およびマジックナンバー（MIMEタイプ）の厳格検証。
  - 最大ファイルサイズ制限（10MB/ファイル）。
  - 将来のClamAV等のウイルススキャンIF（`VirusScanner`）の整備。
- **SEC-007: ログ機密情報マスク**: パスワード、Cookie、セッショントークン、添付ファイルバイナリ、個人特定機密情報をログ出力から除外。
- **SEC-008: セキュリティヘッダー**:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
  - `Referrer-Policy: strict-origin-when-cross-origin`

## 2. オフライン運用要件
- **OFF-001: 外部通信ゼロ**: 実行時におけるインターネット通信（Google Fonts, CDN, 外部API, 外部テレメトリ, npm registryアクセス）の完全排除。
- **OFF-002: 自律配布パッケージ**:
  - Windows: Node.jsランタイム同梱または単一ポータブルZIP、PowerShellによるWindows Service管理。
  - Linux: `docker save` したtarイメージによるオフライン `docker load` および `docker compose up -d` 実行。

## 3. 性能・スケーラビリティ要件
- **PERF-001: 想定規模**: 登録社員数 1,000〜5,000名、部署数 100〜300件、スキル定義数 500件。
- **PERF-002: レスポンス性能**:
  - 社員一覧（サーバーサイドページネーション 25/50/100件）: 200ms以内。
  - 複合人材検索: 500ms以内（適切なINDEXを活用）。
- **PERF-003: メモリ効率**: クライアント・サーバーでの全件メモリロードを防止し、ストリーミング・ページネーションを徹底。

## 4. 信頼性・保守性要件
- **REL-001: ヘルスチェック**: `/health` (プロセス稼働確認) および `/ready` (DB接続・ファイルストレージ書き込み確認)。
- **REL-002: 物理削除整合性**: DBカスケード削除トランザクションと実ファイル削除の補償ロジック。
- **REL-003: 構造化ログ**: JSONフォーマットによる構造化ログ、Request IDによるリクエスト追跡。
