import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Role, EmployeeStatus, SkillLevel, EvaluationType } from '@skillmatrix/shared';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PRODUCTION_SEED !== 'true') {
    console.error('ERROR: Seeding in production environment is strictly forbidden!');
    process.exit(1);
  }

  console.log('Starting SkillMatrix Database Seeding (Demo dataset)...');

  // 1. 既存データのクリーンアップ（依存関係順）
  console.log('Cleaning existing data...');
  await prisma.auditLog.deleteMany({});
  await prisma.certificationAttachment.deleteMany({});
  await prisma.employeeCertification.deleteMany({});
  await prisma.certificationMaster.deleteMany({});
  await prisma.workHistorySkill.deleteMany({});
  await prisma.workHistory.deleteMany({});
  await prisma.skillEvaluationHistory.deleteMany({});
  await prisma.skillEvaluation.deleteMany({});
  await prisma.skill.deleteMany({});
  await prisma.skillCategory.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.passwordHistory.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.employee.deleteMany({});
  await prisma.department.deleteMany({});

  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

  // 2. 組織階層（3階層ツリー）作成
  console.log('Creating organization hierarchy...');
  // Level 1
  const hq = await prisma.department.create({
    data: {
      code: 'HQ',
      name: '本社統括',
      path: '/HQ',
      level: 1,
      sortOrder: 1
    }
  });

  // Level 2
  const sysDiv = await prisma.department.create({
    data: {
      code: 'SYS-DIV',
      name: 'システム開発本部',
      parentId: hq.id,
      path: '/HQ/SYS-DIV',
      level: 2,
      sortOrder: 1
    }
  });

  const infraDiv = await prisma.department.create({
    data: {
      code: 'INFRA-DIV',
      name: '基盤技術本部',
      parentId: hq.id,
      path: '/HQ/INFRA-DIV',
      level: 2,
      sortOrder: 2
    }
  });

  // Level 3
  const devDept1 = await prisma.department.create({
    data: {
      code: 'DEV-1',
      name: '第1開発部 (Web基幹)',
      parentId: sysDiv.id,
      path: '/HQ/SYS-DIV/DEV-1',
      level: 3,
      sortOrder: 1
    }
  });

  const devDept2 = await prisma.department.create({
    data: {
      code: 'DEV-2',
      name: '第2開発部 (モバイル・UI)',
      parentId: sysDiv.id,
      path: '/HQ/SYS-DIV/DEV-2',
      level: 3,
      sortOrder: 2
    }
  });

  const cloudDept = await prisma.department.create({
    data: {
      code: 'CLOUD-DEPT',
      name: 'クラウド推進部',
      parentId: infraDiv.id,
      path: '/HQ/INFRA-DIV/CLOUD-DEPT',
      level: 3,
      sortOrder: 1
    }
  });

  // 3. 部署固有スキルセット & カテゴリ作成
  console.log('Creating department skill sets...');
  // DEV-1 (Web基幹) スキル
  const dev1BackendCat = await prisma.skillCategory.create({
    data: { departmentId: devDept1.id, name: 'バックエンド言語 & DB', sortOrder: 1 }
  });
  const dev1FrontendCat = await prisma.skillCategory.create({
    data: { departmentId: devDept1.id, name: 'フロントエンド & 設計', sortOrder: 2 }
  });

  const sCsharp = await prisma.skill.create({
    data: { categoryId: dev1BackendCat.id, departmentId: devDept1.id, name: 'C# / .NET Core', notes: 'ASP.NET Core, EF Core', sortOrder: 1 }
  });
  const sJava = await prisma.skill.create({
    data: { categoryId: dev1BackendCat.id, departmentId: devDept1.id, name: 'Java / Spring Boot', notes: 'Spring Framework, JUnit', sortOrder: 2 }
  });
  const sSql = await prisma.skill.create({
    data: { categoryId: dev1BackendCat.id, departmentId: devDept1.id, name: 'SQL Server', notes: 'ストアドプロシージャ, チューニング', sortOrder: 3 }
  });
  const sReact1 = await prisma.skill.create({
    data: { categoryId: dev1FrontendCat.id, departmentId: devDept1.id, name: 'React / TypeScript', notes: 'SPA開発, Hooks, State Management', sortOrder: 1 }
  });
  const sArch1 = await prisma.skill.create({
    data: { categoryId: dev1FrontendCat.id, departmentId: devDept1.id, name: 'ドメイン駆動設計 (DDD)', notes: 'クリーンアーキテクチャ', sortOrder: 2 }
  });

  // DEV-2 (モバイル・UI) スキル
  const dev2MobCat = await prisma.skillCategory.create({
    data: { departmentId: devDept2.id, name: 'モバイル & クライアント', sortOrder: 1 }
  });
  const sFlutter = await prisma.skill.create({
    data: { categoryId: dev2MobCat.id, departmentId: devDept2.id, name: 'Flutter / Dart', notes: 'クロスプラットフォームモバイルアプリ', sortOrder: 1 }
  });
  const sSwift = await prisma.skill.create({
    data: { categoryId: dev2MobCat.id, departmentId: devDept2.id, name: 'iOS / Swift', notes: 'SwiftUI, UIKit', sortOrder: 2 }
  });
  const sKotlin = await prisma.skill.create({
    data: { categoryId: dev2MobCat.id, departmentId: devDept2.id, name: 'Android / Kotlin', notes: 'Jetpack Compose', sortOrder: 3 }
  });

  // CLOUD-DEPT スキル
  const cloudCat = await prisma.skillCategory.create({
    data: { departmentId: cloudDept.id, name: 'クラウド & インフラ', sortOrder: 1 }
  });
  const sAws = await prisma.skill.create({
    data: { categoryId: cloudCat.id, departmentId: cloudDept.id, name: 'AWS アーキテクチャ', notes: 'ECS, Lambda, RDS, IAM', sortOrder: 1 }
  });
  const sAzure = await prisma.skill.create({
    data: { categoryId: cloudCat.id, departmentId: cloudDept.id, name: 'Azure クラウド基盤', notes: 'App Service, SQL Database', sortOrder: 2 }
  });
  const sTerraform = await prisma.skill.create({
    data: { categoryId: cloudCat.id, departmentId: cloudDept.id, name: 'Terraform / IaC', notes: 'インフラ自動化', sortOrder: 3 }
  });

  // 4. 資格マスタ作成
  console.log('Creating certification masters...');
  const cAwsSaa = await prisma.certificationMaster.create({
    data: { name: 'AWS 認定ソリューションアーキテクト - アソシエイト', issuer: 'Amazon Web Services', category: 'Cloud' }
  });
  const cAwsSap = await prisma.certificationMaster.create({
    data: { name: 'AWS 認定ソリューションアーキテクト - プロフェッショナル', issuer: 'Amazon Web Services', category: 'Cloud' }
  });
  const cAp = await prisma.certificationMaster.create({
    data: { name: '応用情報技術者試験 (AP)', issuer: 'IPA', category: 'IT General' }
  });
  const cDb = await prisma.certificationMaster.create({
    data: { name: 'データベーススペシャリスト (DB)', issuer: 'IPA', category: 'Database' }
  });
  const cJavaGold = await prisma.certificationMaster.create({
    data: { name: 'Oracle Certified Java Programmer (Gold)', issuer: 'Oracle', category: 'Programming' }
  });

  // 5. 社員・アカウント・資格・経歴・評価作成 (25名)
  console.log('Creating 25 employees with skills, certs, work histories, and evaluations...');

  const employeeDataList = [
    // 1. システム管理者
    {
      num: 'EMP001', name: '佐藤 管理一', kana: 'サトウ カンリイチ', email: 'admin@skillmatrix.local',
      dept: hq.id, pos: '情報統括責任者', role: Role.ADMIN, hire: '2015-04-01',
      login: 'admin', isInitial: false
    },
    // 2. 本部長 (MANAGER)
    {
      num: 'EMP002', name: '鈴木 開発郎', kana: 'スズキ カイハツロウ', email: 'suzuki.k@skillmatrix.local',
      dept: sysDiv.id, pos: 'システム開発本部長', role: Role.DEPARTMENT_MANAGER, hire: '2016-04-01',
      login: 'suzuki.k', isInitial: false
    },
    // 3. 第1開発部 部長 (MANAGER)
    {
      num: 'EMP003', name: '高橋 一部郎', kana: 'タカハシ イチブロウ', email: 'takahashi.i@skillmatrix.local',
      dept: devDept1.id, pos: '第1開発部長', role: Role.DEPARTMENT_MANAGER, hire: '2017-04-01',
      login: 'takahashi.i', isInitial: false
    },
    // 4. 第2開発部 部長 (MANAGER)
    {
      num: 'EMP004', name: '田中 二部郎', kana: 'タナカ ニブロウ', email: 'tanaka.n@skillmatrix.local',
      dept: devDept2.id, pos: '第2開発部長', role: Role.DEPARTMENT_MANAGER, hire: '2018-04-01',
      login: 'tanaka.n', isInitial: false
    },
    // 5. クラウド推進部 部長 (MANAGER)
    {
      num: 'EMP005', name: '伊藤 雲男', kana: 'イトウ クモオ', email: 'ito.k@skillmatrix.local',
      dept: cloudDept.id, pos: 'クラウド推進部長', role: Role.DEPARTMENT_MANAGER, hire: '2017-10-01',
      login: 'ito.k', isInitial: false
    },
    // 6〜15. 第1開発部 メンバー (GENERAL)
    {
      num: 'EMP006', name: '渡辺 健太', kana: 'ワタナベ ケンタ', email: 'watanabe.k@skillmatrix.local',
      dept: devDept1.id, pos: 'シニアリードエンジニア', role: Role.GENERAL, hire: '2019-04-01',
      login: 'watanabe.k', isInitial: false
    },
    {
      num: 'EMP007', name: '山本 翔太', kana: 'ヤマモト ショウタ', email: 'yamamoto.s@skillmatrix.local',
      dept: devDept1.id, pos: 'フルスタックエンジニア', role: Role.GENERAL, hire: '2020-04-01',
      login: 'yamamoto.s', isInitial: false
    },
    {
      num: 'EMP008', name: '中村 優希', kana: 'ナカムラ ユウキ', email: 'nakamura.y@skillmatrix.local',
      dept: devDept1.id, pos: 'バックエンドエンジニア', role: Role.GENERAL, hire: '2021-04-01',
      login: 'nakamura.y', isInitial: false
    },
    {
      num: 'EMP009', name: '小林 葵', kana: 'コバヤシ アオイ', email: 'kobayashi.a@skillmatrix.local',
      dept: devDept1.id, pos: 'フロントエンドエンジニア', role: Role.GENERAL, hire: '2022-04-01',
      login: 'kobayashi.a', isInitial: false
    },
    {
      num: 'EMP010', name: '加藤 陸', kana: 'カトウ リク', email: 'kato.r@skillmatrix.local',
      dept: devDept1.id, pos: 'エンジニア', role: Role.GENERAL, hire: '2023-04-01',
      login: 'kato.r', isInitial: true
    },
    {
      num: 'EMP011', name: '吉田 遥', kana: 'ヨシダ ハルカ', email: 'yoshida.h@skillmatrix.local',
      dept: devDept1.id, pos: 'エンジニア', role: Role.GENERAL, hire: '2023-10-01',
      login: 'yoshida.h', isInitial: true
    },
    {
      num: 'EMP012', name: '山田 太郎', kana: 'ヤマダ タロウ', email: 'yamada.t@skillmatrix.local',
      dept: devDept1.id, pos: 'DBスペシャリスト', role: Role.GENERAL, hire: '2018-04-01',
      login: 'yamada.t', isInitial: false
    },
    {
      num: 'EMP013', name: '佐々木 翼', kana: 'ササキ ツバサ', email: 'sasaki.t@skillmatrix.local',
      dept: devDept1.id, pos: 'エンジニア', role: Role.GENERAL, hire: '2024-04-01',
      login: 'sasaki.t', isInitial: true
    },
    {
      num: 'EMP014', name: '山口 蓮', kana: 'ヤマグチ レン', email: 'yamaguchi.r@skillmatrix.local',
      dept: devDept1.id, pos: 'エンジニア', role: Role.GENERAL, hire: '2022-04-01',
      login: 'yamaguchi.r', isInitial: false
    },
    {
      num: 'EMP015', name: '松本 陽菜', kana: 'マツモト ヒナ', email: 'matsumoto.h@skillmatrix.local',
      dept: devDept1.id, pos: 'エンジニア', role: Role.GENERAL, hire: '2023-04-01',
      login: 'matsumoto.h', isInitial: false
    },
    // 16〜20. 第2開発部 メンバー (GENERAL)
    {
      num: 'EMP016', name: '井上 颯太', kana: 'イノウエ ソウタ', email: 'inoue.s@skillmatrix.local',
      dept: devDept2.id, pos: 'モバイルリードエンジニア', role: Role.GENERAL, hire: '2019-04-01',
      login: 'inoue.s', isInitial: false
    },
    {
      num: 'EMP017', name: '木村 結衣', kana: 'キムラ ユイ', email: 'kimura.y@skillmatrix.local',
      dept: devDept2.id, pos: 'iOSエンジニア', role: Role.GENERAL, hire: '2021-04-01',
      login: 'kimura.y', isInitial: false
    },
    {
      num: 'EMP018', name: '林 大和', kana: 'ハヤシ ヤマト', email: 'hayashi.y@skillmatrix.local',
      dept: devDept2.id, pos: 'Androidエンジニア', role: Role.GENERAL, hire: '2022-04-01',
      login: 'hayashi.y', isInitial: false
    },
    {
      num: 'EMP019', name: '斎藤 芽衣', kana: 'サイトウ メイ', email: 'saito.m@skillmatrix.local',
      dept: devDept2.id, pos: 'Flutterエンジニア', role: Role.GENERAL, hire: '2023-04-01',
      login: 'saito.m', isInitial: true
    },
    {
      num: 'EMP020', name: '清水 蒼', kana: 'シミズ アオ', email: 'shimizu.a@skillmatrix.local',
      dept: devDept2.id, pos: 'エンジニア', role: Role.GENERAL, hire: '2024-04-01',
      login: 'shimizu.a', isInitial: true
    },
    // 21〜25. クラウド推進部 メンバー (GENERAL)
    {
      num: 'EMP021', name: '山崎 拓海', kana: 'ヤマザキ タクミ', email: 'yamazaki.t@skillmatrix.local',
      dept: cloudDept.id, pos: 'クラウドアーキテクト', role: Role.GENERAL, hire: '2018-04-01',
      login: 'yamazaki.t', isInitial: false
    },
    {
      num: 'EMP022', name: '森 奈々', kana: 'モリ ナナ', email: 'mori.n@skillmatrix.local',
      dept: cloudDept.id, pos: 'インフラエンジニア', role: Role.GENERAL, hire: '2020-04-01',
      login: 'mori.n', isInitial: false
    },
    {
      num: 'EMP023', name: '阿部 樹', kana: 'アベ イツキ', email: 'abe.i@skillmatrix.local',
      dept: cloudDept.id, pos: 'SREエンジニア', role: Role.GENERAL, hire: '2021-04-01',
      login: 'abe.i', isInitial: false
    },
    {
      num: 'EMP024', name: '池田 紬', kana: 'イケダ ツムギ', email: 'ikeda.t@skillmatrix.local',
      dept: cloudDept.id, pos: 'クラウドエンジニア', role: Role.GENERAL, hire: '2023-04-01',
      login: 'ikeda.t', isInitial: true
    },
    {
      num: 'EMP025', name: '橋本 湊', kana: 'ハシモト ミナト', email: 'hashimoto.m@skillmatrix.local',
      dept: cloudDept.id, pos: 'エンジニア', role: Role.GENERAL, hire: '2024-04-01',
      login: 'hashimoto.m', isInitial: true
    }
  ];

  const createdEmployees: any[] = [];

  for (const empData of employeeDataList) {
    const emp = await prisma.employee.create({
      data: {
        employeeNumber: empData.num,
        name: empData.name,
        nameKana: empData.kana,
        email: empData.email,
        departmentId: empData.dept,
        position: empData.pos,
        role: empData.role,
        hireDate: new Date(empData.hire),
        status: EmployeeStatus.ACTIVE,
        notes: `${empData.pos}。開発実績多数。`
      }
    });

    await prisma.account.create({
      data: {
        employeeId: emp.id,
        loginId: empData.login,
        passwordHash: defaultPasswordHash,
        isInitialPassword: empData.isInitial
      }
    });

    createdEmployees.push(emp);
  }

  // 渡辺 健太 (EMP006 - 第1開発部シニア) の実務経歴（重複期間あり）と資格・評価の投入
  const emp6 = createdEmployees[5]; // EMP006
  const mgrDev1 = createdEmployees[2]; // EMP003 (高橋 部長)

  // 実務経歴 (重複期間Unionのテストデータ)
  // 案件1: 2021-04 〜 2022-09 (18ヶ月) C#, SQL Server
  // 案件2: 2022-04 〜 2023-03 (12ヶ月、重複6ヶ月) C#, React
  // 案件3: 2023-01 〜 2024-05 (17ヶ月、重複3ヶ月) C#, React, DDD
  await prisma.workHistory.create({
    data: {
      employeeId: emp6.id,
      projectName: 'メガバンク向け次世代決済基盤構築',
      description: 'C# / ASP.NET Coreを用いた高スループットマイクロサービス基盤の設計・開発。',
      role: 'リードアーキテクト',
      startYearMonth: '2021-04',
      endYearMonth: '2022-09',
      skills: {
        create: [
          { skillName: 'C#' },
          { skillName: 'SQL Server' },
          { skillName: '.NET Core' }
        ]
      }
    }
  });

  await prisma.workHistory.create({
    data: {
      employeeId: emp6.id,
      projectName: 'EC大手向けリアルタイム在庫管理API',
      description: 'C# および React SPA 管理画面の開発。',
      role: 'テックリード',
      startYearMonth: '2022-04',
      endYearMonth: '2023-03',
      skills: {
        create: [
          { skillName: 'C#' },
          { skillName: 'React' },
          { skillName: 'TypeScript' }
        ]
      }
    }
  });

  await prisma.workHistory.create({
    data: {
      employeeId: emp6.id,
      projectName: 'グローバル基幹ERPリプレイスプロジェクト',
      description: 'DDD / クリーンアーキテクチャによるWebAPI設計および実装統括。',
      role: '開発リーダー',
      startYearMonth: '2023-01',
      endYearMonth: '2024-05',
      skills: {
        create: [
          { skillName: 'C#' },
          { skillName: 'React' },
          { skillName: 'DDD' },
          { skillName: 'SQL Server' }
        ]
      }
    }
  });

  // 資格登録
  await prisma.employeeCertification.create({
    data: {
      employeeId: emp6.id,
      certificationMasterId: cDb.id,
      acquiredDate: new Date('2020-06-21'),
      certificateNumber: 'DB-2020-00123'
    }
  });
  await prisma.employeeCertification.create({
    data: {
      employeeId: emp6.id,
      certificationMasterId: cAwsSaa.id,
      acquiredDate: new Date('2021-11-15'),
      expirationDate: new Date('2024-11-15'),
      certificateNumber: 'AWS-SAA-887766'
    }
  });

  // スキル評価 (DEV-1スキル)
  const dev1Skills = [sCsharp, sJava, sSql, sReact1, sArch1];
  const evalLevels = [
    { skill: sCsharp, self: SkillLevel.A, mgr: SkillLevel.A },
    { skill: sJava, self: SkillLevel.B, mgr: SkillLevel.B },
    { skill: sSql, self: SkillLevel.A, mgr: SkillLevel.A },
    { skill: sReact1, self: SkillLevel.A, mgr: SkillLevel.B }, // ギャップあり (Self A vs Mgr B)
    { skill: sArch1, self: SkillLevel.A, mgr: SkillLevel.A }
  ];

  for (const item of evalLevels) {
    const ev = await prisma.skillEvaluation.create({
      data: {
        employeeId: emp6.id,
        skillId: item.skill.id,
        selfLevel: item.self,
        managerLevel: item.mgr,
        selfEvaluatedAt: new Date('2024-04-10'),
        managerEvaluatedAt: new Date('2024-04-15'),
        managerEvaluatorId: mgrDev1.id
      }
    });

    // 評価履歴
    await prisma.skillEvaluationHistory.create({
      data: {
        evaluationId: ev.id,
        employeeId: emp6.id,
        skillId: item.skill.id,
        evaluatorId: emp6.id,
        evaluatorRole: Role.GENERAL,
        evalType: EvaluationType.SELF,
        previousLevel: SkillLevel.B,
        newLevel: item.self,
        reason: '直近の大規模ERP案件での主導実績に基づく自己評価更新'
      }
    });
  }

  // 他の社員へのランダムな評価・経歴・資格データの投入
  for (let i = 0; i < createdEmployees.length; i++) {
    const emp = createdEmployees[i];
    if (emp.id === emp6.id) continue;

    // DEV-1 所属社員の場合
    if (emp.departmentId === devDept1.id) {
      await prisma.skillEvaluation.create({
        data: {
          employeeId: emp.id,
          skillId: sCsharp.id,
          selfLevel: i % 2 === 0 ? SkillLevel.B : SkillLevel.C,
          managerLevel: i % 3 === 0 ? SkillLevel.B : SkillLevel.C,
          selfEvaluatedAt: new Date(),
          managerEvaluatedAt: new Date(),
          managerEvaluatorId: mgrDev1.id
        }
      });
      await prisma.skillEvaluation.create({
        data: {
          employeeId: emp.id,
          skillId: sSql.id,
          selfLevel: SkillLevel.B,
          managerLevel: SkillLevel.B,
          selfEvaluatedAt: new Date(),
          managerEvaluatedAt: new Date(),
          managerEvaluatorId: mgrDev1.id
        }
      });
    }

    // クラウド推進部 所属社員の場合
    if (emp.departmentId === cloudDept.id) {
      await prisma.skillEvaluation.create({
        data: {
          employeeId: emp.id,
          skillId: sAws.id,
          selfLevel: SkillLevel.A,
          managerLevel: SkillLevel.A,
          selfEvaluatedAt: new Date(),
          managerEvaluatedAt: new Date(),
          managerEvaluatorId: createdEmployees[4].id // 伊藤 部長
        }
      });
      await prisma.employeeCertification.create({
        data: {
          employeeId: emp.id,
          certificationMasterId: cAwsSap.id,
          acquiredDate: new Date('2022-08-01')
        }
      });
    }
  }

  console.log('Seeding completed successfully!');
  console.log('Admin account: ID="admin", Password="Password123!"');
  console.log('Manager account: ID="takahashi.i", Password="Password123!"');
  console.log('General user account: ID="watanabe.k", Password="Password123!"');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
