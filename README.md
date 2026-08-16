# SkillMatrix

> **SkillMatrix** is an enterprise-grade talent and skill management platform designed specifically for system engineering and development organizations. It operates completely offline without external internet, CDN, or telemetry dependencies, and manages employees, organizational tree structures, certifications, work histories (with non-inflating period union calculations), department-specific skill matrixes, self/manager evaluations, history timelines, multi-criteria talent search, KPIs, and immutable audit logs.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node: LTS](https://img.shields.io/badge/Node.js-v20%20LTS-green.svg)]()
[![Database: SQL Server](https://img.shields.io/badge/Database-SQL%20Server-red.svg)]()

---

## 🌟 Key Features

- **Hierarchical Organization Tree**: Materialized-path based department hierarchy supporting deep sub-department scoping and queries.
- **Department-Specific Skill Sets**: Independent skill definition sets per department, avoiding global skill clutter.
- **Dual Evaluation System (Self & Manager)**: Side-by-side display of Self and Manager ratings (`A` - Expert / Can Train, `B` - Proficient / Independent, `C` - Intermediate, `UNEVALUATED`).
- **Evaluation History Timeline**: Full audit tracking of evaluation changes, reasons, timestamps, and evaluator identities.
- **Certifications & Attachment Storage**: Certification master integration + custom entries. Secure UUID local file storage for PDF/PNG/JPG certificate proofs (up to 10MB) with MIME verification and path-traversal protection.
- **Work History with Period Union Calculation**: Project histories with assigned technologies. Automatically merges overlapping project periods to compute exact non-inflated months and years of experience.
- **High-Performance Talent Search**: Multi-criteria compound search (name, employee number, department, position, certifications, skill level, minimum experience years, and used technologies) optimized for 1,000–5,000 employees with server-side pagination.
- **Dashboard & KPIs**: Real-time distribution charts (Recharts) for skill levels, evaluation gaps (Self vs Manager), experience years, top certifications, and unevaluated skill counts.
- **Security & RBAC**: Strict API-layer authorization (`ADMIN`, `DEPARTMENT_MANAGER`, `GENERAL`) with complete IDOR protection, SQL Server session store with `HttpOnly` cookies, 5-failure/15-min account lockout, and CSRF defense.
- **Immutable Audit Logs**: Append-only audit logger capturing before/after JSON diffs, snapshotting employee metadata even after physical deletion.
- **100% Fully Offline**: Zero runtime external dependencies (no Google Fonts, no external CDNs, no external APIs or telemetry).

---

## 📸 Screenshots (UI Preview)

```
+-------------------------------------------------------------------------------+
| SkillMatrix   [Dashboard]  [Employees]  [Talent Search]  [Org]   [JA|EN] [🌙|☀️] |
+-------------------------------------------------------------------------------+
|  TOTAL EMPLOYEES     DEPARTMENTS        CERTIFICATIONS      UNEVALUATED SKILLS|
|      25              6                   28                  4                |
|                                                                               |
|  [ Skill Level Distribution (Self vs Mgr) ]  [ Evaluation Gap Distribution ]  |
|  [  BarChart: A (12/10), B (15/14) ...   ]  [  PieChart: Self>Mgr, Equal.. ]  |
+-------------------------------------------------------------------------------+
```

---

## 🏗️ Architecture

Monorepo powered by `npm workspaces`:

```
skill-matrix/
├── packages/
│   ├── shared/       # Shared Zod schemas, TypeScript DTOs, Enums, i18n & Period Union logic
│   ├── backend/      # Hono REST API (/api/v1/*), Node.js, Prisma ORM, SQL Server, Audit Logger
│   └── frontend/     # React, Vite, Tailwind CSS, shadcn/ui, TanStack Table, Recharts
├── scripts/          # PowerShell administration & service scripts for Windows
├── docker/           # Multi-stage Dockerfile, docker-compose.yml & offline load scripts
└── docs/             # Systematic technical design documentation (00-08, ADRs)
```

---

## 🚀 Quick Start (Development)

### Prerequisites
- Node.js v20 LTS
- Microsoft SQL Server (e.g. `localhost\SQLEXPRESS` or SQL Server 2019/2022)
- Windows PowerShell / Bash

### 1. Installation
```powershell
# Clone the repository
git clone https://github.com/momomo17svt-dev/skill-matrix.git
cd skill-matrix

# Install dependencies
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env` and configure your SQL Server connection string:
```env
DATABASE_URL="sqlserver://localhost\\SQLEXPRESS;database=skillmatrix;integratedSecurity=true;trustServerCertificate=true;"
SESSION_SECRET="your-super-secure-random-32-char-string"
```

### 3. Database Migration & Seed
```powershell
# Run Prisma migration (Explicit script)
npm run db:migrate

# Seed demo dataset (25 employees, 3-tier org, skills, certs, work histories)
npm run db:seed
```

### 4. Start Development Server (Local Node.js)
```powershell
npm run dev
```
Open `http://localhost:5173` in your browser.

---

### 🐳 Quick Start with Docker (Standalone Container / Production Mode)

Run the full-stack application (Backend API + Frontend SPA on port `3000`) inside a single lightweight container:

#### Build & Start with Docker Compose:
```bash
docker compose -f docker/docker-compose.yml up -d --build
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

#### Stop Container:
```bash
docker compose -f docker/docker-compose.yml down
```

#### Default Demo Accounts:
- **Administrator**: `admin` / `Password123!`
- **Department Manager**: `takahashi.i` / `Password123!`
- **General Employee**: `watanabe.k` / `Password123!`

---

## 🧪 Testing & Quality Assurance

```powershell
# Run all unit and integration tests
npm test

# Run TypeScript typecheck
npm run typecheck

# Verify offline integrity (scans build assets for forbidden external CDNs/fonts)
npm run verify:offline
```

---

## 📦 Offline Deployment (Isolated / Air-gapped Environments)

### 1. Docker Offline Deployment (Ubuntu / Linux / Windows Docker)

#### Preparation (On Internet-Connected Host):
```bash
# Linux / macOS
bash docker/save-images.sh

# Windows (PowerShell)
powershell -ExecutionPolicy Bypass -File .\docker\save-images.ps1
```
This generates `images/skillmatrix-offline-image.tar` (~112 MB).

#### Launching in Isolated Offline Environment:
1. Transfer `images/skillmatrix-offline-image.tar`, `docker/docker-compose.yml`, and `.env.example` to the target host.
2. Load the archive and launch:

```bash
# Linux / Bash
bash docker/load-images.sh
cp .env.example .env
docker compose -f docker/docker-compose.yml up -d

# Windows PowerShell
powershell -ExecutionPolicy Bypass -File .\docker\load-images.ps1
Copy-Item .env.example .env
docker compose -f docker/docker-compose.yml up -d
```
Access the application at **`http://<server-ip-or-localhost>:3000`**.

---

### 2. Windows Service Deployment (PowerShell Service)
1. Generate the standalone offline ZIP package on a machine with internet:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\bundle-offline-windows.ps1
   ```
2. Transfer `skillmatrix-offline-windows.zip` to the isolated Windows environment and extract it.
3. Configure `.env` with the target SQL Server connection string.
4. Execute migration and install the Windows service:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\migrate.ps1
   powershell -ExecutionPolicy Bypass -File .\scripts\service-install.ps1
   powershell -ExecutionPolicy Bypass -File .\scripts\service-start.ps1
   ```

---

## 🔒 Security

- **Authentication**: `bcrypt` hashing with salt rounds 10.
- **Sessions**: SQL Server session store with `HttpOnly; Secure; SameSite=Lax` cookies.
- **Account Lock**: 5 consecutive failures triggers a 15-minute lockout.
- **IDOR Protection**: Strict tenant and department scope validation at the API layer.
- **Input & Upload Validation**: Strict Zod schemas, magic bytes MIME verification, and path traversal prevention.
- **Audit Logging**: Immutable append-only audit trail preserving user snapshots on deletion.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
