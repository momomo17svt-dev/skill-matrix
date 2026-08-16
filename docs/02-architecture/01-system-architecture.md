# システムアーキテクチャ設計書

## 1. システム全体構成図 (Mermaid)

```mermaid
flowchart TB
    subgraph Client ["Client Tier (Browser: Edge/Chrome)"]
        SPA["React 18 + Vite SPA\n(Tailwind CSS, shadcn/ui, TanStack Table, Recharts)"]
        LocalAssets["Local Bundled Assets\n(Local Fonts, Local Lucide Icons, Local i18n)"]
    end

    subgraph AppServer ["Application Server Tier (Node.js LTS)"]
        HonoApp["Hono HTTP Router & API Handlers (/api/v1/*)"]
        
        subgraph Middlewares ["Middlewares"]
            ReqId["Request ID Middleware"]
            Logger["Structured JSON Logger (Masking)"]
            SecHeaders["Security Headers (CSP, HSTS, etc.)"]
            CSRF["CSRF Protection"]
            RateLimit["Rate Limiter (5 fails / 15 mins)"]
            AuthEngine["Auth & Session Validation (Cookie)"]
            RBAC["RBAC & IDOR Department Tree Resolver"]
        end

        subgraph CoreServices ["Core Domain Services"]
            EmpService["Employee Service (Master Boundary)"]
            DeptService["Department Tree Service"]
            SkillService["Skill & Evaluation Service"]
            CertService["Certification & Attachment Service"]
            WorkService["Work History & Period Union Engine"]
            SearchService["Multi-Criteria Search Engine"]
            DashService["Dashboard Aggregator"]
            AuditService["Immutable Audit Logger"]
        end

        subgraph InfraAdapters ["Infrastructure Adapters"]
            PrismaORM["Prisma Client (SQL Server)"]
            FileStorage["Local UUID File Storage + VirusScanner IF"]
        end
    end

    subgraph DataTier ["Data Tier (Self-Hosted / Offline)"]
        SQLServer[("Microsoft SQL Server\n(SQLEXPRESS / MSSQLSERVER)")]
        DiskStorage[("Local File Storage\n(Encrypted/UUID cert attachments)")]
    end

    SPA --> |"HTTP / REST (/api/v1/*) with HttpOnly Cookie"| HonoApp
    HonoApp --> Middlewares
    Middlewares --> CoreServices
    CoreServices --> InfraAdapters
    PrismaORM --> SQLServer
    FileStorage --> DiskStorage
```

## 2. レイヤードアーキテクチャ設計
1. **Presentation Layer (Frontend)**:
   - React SPA, TanStack Table, Recharts, i18next
   - サーバーサイドページネーション、アクセシビリティ、テーマ切替 (Light/Dark/System)
2. **Interface Layer (Backend Routes & Middlewares)**:
   - Hono REST API エンドポイント (`/api/v1/*`)
   - Zod によるリクエスト/レスポンスバリデーション
   - 認証、認可、セキュリティヘッダー、エラーハンドリング
3. **Application & Domain Layer (Services)**:
   - 部署階層トラバーサル、実務経歴期間Union計算、評価履歴記録、不変監査ログ生成
   - 外部社員マスタ連携を考慮したリポジトリ抽象化
4. **Infrastructure Layer (Data & Storage)**:
   - Prisma Client による SQL Server へのパラメータ化クエリ発行
   - 安全なUUIDファイルストレージ管理とVirusScanner抽象化
