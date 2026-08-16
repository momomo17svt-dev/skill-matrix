import { prisma } from '../prisma.js';
import {
  AuthSessionUser,
  Role,
  SkillLevel,
  DashboardStatsDto,
  calculateMergedMonths
} from '@skillmatrix/shared';

export class DashboardService {
  /**
   * ダッシュボード用統計集計データを取得
   */
  static async getStats(user: AuthSessionUser): Promise<DashboardStatsDto> {
    const employeeWhere: any = {};
    const departmentWhere: any = {};

    if (user.role === Role.DEPARTMENT_MANAGER) {
      const managerDept = await prisma.department.findUnique({ where: { id: user.departmentId } });
      if (managerDept) {
        employeeWhere.department = { path: { startsWith: managerDept.path } };
        departmentWhere.path = { startsWith: managerDept.path };
      }
    }

    // 1. 基本件数
    const [totalEmployees, departmentCount, certificationsCount] = await Promise.all([
      prisma.employee.count({ where: employeeWhere }),
      prisma.department.count({ where: departmentWhere }),
      prisma.employeeCertification.count({
        where: { employee: employeeWhere }
      })
    ]);

    // 2. 資格保有状況トップ
    const certs = await prisma.employeeCertification.findMany({
      where: { employee: employeeWhere },
      include: { master: true }
    });
    const certCountMap = new Map<string, number>();
    certs.forEach((c) => {
      const name = c.master ? c.master.name : c.customCertificationName || 'その他資格';
      certCountMap.set(name, (certCountMap.get(name) || 0) + 1);
    });
    const certificationsDistribution = Array.from(certCountMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 3. スキルレベル分布 & 評価ギャップ & 未評価数
    const evaluations = await prisma.skillEvaluation.findMany({
      where: { employee: employeeWhere }
    });

    let selfA = 0, selfB = 0, selfC = 0;
    let mgrA = 0, mgrB = 0, mgrC = 0;
    let gapSelfHigher = 0, gapEqual = 0, gapManagerHigher = 0;
    let unevaluatedCount = 0;

    const levelRank: Record<string, number> = {
      [SkillLevel.A]: 3,
      [SkillLevel.B]: 2,
      [SkillLevel.C]: 1,
      [SkillLevel.UNEVALUATED]: 0
    };

    evaluations.forEach((ev) => {
      if (ev.selfLevel === SkillLevel.A) selfA++;
      if (ev.selfLevel === SkillLevel.B) selfB++;
      if (ev.selfLevel === SkillLevel.C) selfC++;

      if (ev.managerLevel === SkillLevel.A) mgrA++;
      if (ev.managerLevel === SkillLevel.B) mgrB++;
      if (ev.managerLevel === SkillLevel.C) mgrC++;

      if (ev.selfLevel === SkillLevel.UNEVALUATED || ev.managerLevel === SkillLevel.UNEVALUATED) {
        unevaluatedCount++;
      }

      const sRank = levelRank[ev.selfLevel] || 0;
      const mRank = levelRank[ev.managerLevel] || 0;

      if (sRank > 0 && mRank > 0) {
        if (sRank > mRank) gapSelfHigher++;
        else if (sRank === mRank) gapEqual++;
        else gapManagerHigher++;
      }
    });

    const skillLevelDistribution = [
      { level: SkillLevel.A, selfCount: selfA, managerCount: mgrA },
      { level: SkillLevel.B, selfCount: selfB, managerCount: mgrB },
      { level: SkillLevel.C, selfCount: selfC, managerCount: mgrC }
    ];

    const evaluationGapDistribution = [
      { gap: '自己評価が高い', count: gapSelfHigher },
      { gap: '一致', count: gapEqual },
      { gap: '上長評価が高い', count: gapManagerHigher }
    ];

    // 4. 実務経験年数分布 (Union計算)
    const employeesWithWork = await prisma.employee.findMany({
      where: employeeWhere,
      include: { workHistories: true }
    });

    let expUnder1 = 0, exp1to3 = 0, exp3to5 = 0, exp5to10 = 0, expOver10 = 0;

    employeesWithWork.forEach((emp) => {
      const intervals = emp.workHistories.map((w) => ({
        startYearMonth: w.startYearMonth,
        endYearMonth: w.endYearMonth,
        isCurrent: w.isCurrent
      }));
      const union = calculateMergedMonths(intervals);
      const years = union.totalMonths / 12;

      if (years < 1) expUnder1++;
      else if (years < 3) exp1to3++;
      else if (years < 5) exp3to5++;
      else if (years < 10) exp5to10++;
      else expOver10++;
    });

    const experienceYearsDistribution = [
      { range: '1年未満', count: expUnder1 },
      { range: '1〜3年', count: exp1to3 },
      { range: '3〜5年', count: exp3to5 },
      { range: '5〜10年', count: exp5to10 },
      { range: '10年以上', count: expOver10 }
    ];

    // 5. 最近更新された社員
    const recentEmployees = await prisma.employee.findMany({
      where: employeeWhere,
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: { department: true }
    });

    const recentUpdatedEmployees = recentEmployees.map((e) => ({
      id: e.id,
      name: e.name,
      employeeNumber: e.employeeNumber,
      departmentName: e.department.name,
      updatedAt: e.updatedAt.toISOString()
    }));

    return {
      totalEmployees,
      departmentCount,
      certificationsCount,
      certificationsDistribution,
      skillLevelDistribution,
      evaluationGapDistribution,
      experienceYearsDistribution,
      unevaluatedSkillsCount: unevaluatedCount,
      recentUpdatedEmployees
    };
  }
}
