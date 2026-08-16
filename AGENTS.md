# AGENTS.md - Antigravity Agent Guidelines for SkillMatrix

## Overview
SkillMatrix は、システム開発組織の人材管理Webアプリケーションです。Monorepo構成（`packages/shared`, `packages/backend`, `packages/frontend`）で開発され、SQL Serverをデータベースとして利用します。

## Critical Rules
1. **日本語対応**: ユーザーとの対話および主要設計書は日本語を原則とします。
2. **完全オフライン保証**: 外部CDN、外部Webフォント、外部テレメトリへのランタイム依存は一切禁止です。
3. **ドキュメント駆動**: コード変更時は必ず `docs/` および `docs/adr/` を同期更新してください。
4. **型安全性**: `any` による型逃げを禁止し、ZodスキーマとPrismaモデルに基づく厳格な型付けを行ってください。
5. **セキュリティ**: APIレイヤーでのRBAC、IDOR防止、CSRF対策、Cookieセッション管理、パスワードハッシュ、不変監査ログを必須とします。
