---
name: skillmatrix-guide
description: SkillMatrix 人材管理Webアプリケーションの開発・保守・運用・アーキテクチャガイド
---

# SkillMatrix Guide

## 概要
SkillMatrix は、システム開発組織の人材情報（組織、社員、保有資格・添付証明書、実務経歴、部署固有スキルセット、自己/所属長評価、評価履歴、人材検索、ダッシュボード、監査ログ）を一元管理するWebアプリケーションです。

## 開発コマンド
- `npm run dev`: フロントエンド・バックエンド同時起動
- `npm run build`: 全パッケージのProductionビルド
- `npm run test`: 全テスト実行 (Unit, Integration, Auth, DB)
- `npm run db:migrate`: SQL Serverへのマイグレーション適用
- `npm run db:seed`: デモデータ (25名) 投入
- `npm run verify:offline`: オフライン完全性スキャン
