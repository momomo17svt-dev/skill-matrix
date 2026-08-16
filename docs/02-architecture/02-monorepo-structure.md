# Monorepo構成設計書

## 1. ディレクトリ構造
```
skill-matrix/
├── .agents/                    # Antigravity Skills & Rules
├── .claude/                    # Claude Code Skills & Hooks
├── docker/                     # Dockerfile, docker-compose, offline scripts
├── docs/                       # 体系的ドキュメント (00〜08, adr)
├── packages/
│   ├── shared/                 # 共通型定義, Zodスキーマ, 定数, i18nリソース
│   │   ├── src/
│   │   │   ├── constants/      # アプリ共通定数 (権限, スキルレベル, 制限値)
│   │   │   ├── dtos/           # APIリクエスト/レスポンス型
│   │   │   ├── enums/          # Role, SkillLevel, AuditAction etc.
│   │   │   ├── i18n/           # ja / en 翻訳リソース定義
│   │   │   ├── schemas/        # Zodスキーマ
│   │   │   └── utils/          # 期間Union計算等の共通ユーティリティ
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── backend/                # Hono + Node.js + Prisma (SQL Server)
│   │   ├── prisma/             # schema.prisma, migrations, seed.ts
│   │   ├── src/
│   │   │   ├── config/         # 環境変数, 設定定義
│   │   │   ├── constants/
│   │   │   ├── middlewares/    # auth, rbac, csrf, rateLimiter, logger, errorHandler
│   │   │   ├── routes/         # auth, employees, departments, skills, certs, work, search, audit, health
│   │   │   ├── services/       # ドメインビジネスロジック
│   │   │   ├── repositories/   # DBアクセス & 外部社員境界抽象化
│   │   │   ├── utils/          # 暗号化, ファイル処理, 日付処理
│   │   │   └── index.ts        # サーバー起動エントリーポイント
│   │   ├── tests/              # unit, integration, authorization, db tests
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── frontend/               # React + Vite + Tailwind CSS + shadcn/ui
│       ├── public/             # 静的アセット (favicon等)
│       ├── src/
│       │   ├── assets/         # ローカルフォント, ローカル画像
│       │   ├── components/     # UIコンポーネント, レイアウト, ダイアログ
│       │   ├── contexts/       # AuthContext, ThemeContext, I18nContext
│       │   ├── hooks/          # useAuth, useApi, useDebounce, etc.
│       │   ├── pages/          # Login, Dashboard, EmployeeList, Detail, Edit, Search, Org, Audit
│       │   ├── routes/         # React Router 定義, 認可ガード
│       │   ├── services/       # APIクライアント
│       │   ├── types/          # UI専用型
│       │   └── App.tsx
│       ├── package.json
│       ├── tsconfig.json
│       └── vite.config.ts
├── scripts/                    # PowerShell Windows管理 & デプロイスクリプト
├── .env.example
├── .gitignore
├── AGENTS.md                   # Antigravity 開発ガイド
├── CLAUDE.md                   # Claude Code 開発ガイド
├── LICENSE                     # MIT License
├── package.json                # npm workspaces root
├── README.md                   # OSS 英語README
└── README.ja.md                # OSS 日本語README
```

## 2. ワークスペース依存関係
- `packages/shared` はゼロ外部依存（またはZodのみ）とし、`packages/backend` と `packages/frontend` の双方がローカル参照します。
- これにより型定義・バリデーション・エラーコード・i18nキーの一貫性を100%保証します。
