# テスト計画書

## 1. テストレベルと方針
1. **Unit Tests (単体テスト)**:
   - 対象: `packages/shared` のユーティリティ（期間Union計算、日付フォーマッタ）、Zodスキーマ、バックエンドサービスロジック
   - ツール: `vitest`
2. **API Integration Tests (API統合テスト)**:
   - 対象: 認証フロー（ログイン、ロックアウト、パスワード変更、CSRF、Cookie）
   - エンドポイント別CRUDおよびステータスコード
3. **Authorization & IDOR Tests (認可テスト)**:
   - 対象: ADMIN, DEPARTMENT_MANAGER, GENERAL 各ロールによる他部署データ・他社員データへの不正アクセス拒絶（403 Forbidden）検証
4. **DB Integration Tests (DB統合テスト)**:
   - 対象: 階層組織クエリ、トランザクション物理削除、インデックス検索
5. **E2E Tests (エンドツーエンドテスト)**:
   - 対象: Playwright によるブラウザシナリオ（ログイン、社員一覧・詳細、スキル評価入力、資格登録・ファイル添付、実務経歴登録、複合検索、ダッシュボード集計、言語切替、テーマ切替）
6. **Offline Integrity Tests (オフライン整合性検査)**:
   - 対象: ビルド成果物内の外部URL/CDN/外部フォント参照スキャン

## 2. 完了基準 (Pass Criteria)
- すべての単体・統合・認可・E2E・オフライン検査が 100% PASS すること。
- TypeScriptコンパイルエラー 0 件、Lintエラー 0 件。
