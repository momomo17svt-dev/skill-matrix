import { prisma } from '../prisma.js';
import { AppError } from '../utils/errors.js';
import { calculateMergedMonths, formatExperience, AuthSessionUser, AuditAction, TargetType, WorkHistoryDto } from '@skillmatrix/shared';
import { AuditService } from './audit.service.js';

export class WorkHistoryService {
  /**
   * 社員の実務経歴一覧および期間Union集計結果を取得
   */
  static async listByEmployee(employeeId: string): Promise<{
    items: WorkHistoryDto[];
    totalUnionMonths: number;
    experienceFormatted: string;
    skillsExperience: { skillName: string; totalMonths: number; formatted: string }[];
  }> {
    const histories = await prisma.workHistory.findMany({
      where: { employeeId },
      include: { skills: true },
      orderBy: [{ startYearMonth: 'desc' }, { createdAt: 'desc' }]
    });

    // 1. 全体実稼働期間のUnion計算
    const intervals = histories.map((h) => ({
      startYearMonth: h.startYearMonth,
      endYearMonth: h.endYearMonth,
      isCurrent: h.isCurrent
    }));
    const totalUnion = calculateMergedMonths(intervals);
    const formatted = formatExperience(totalUnion.totalMonths);

    // 2. 技術別（スキル別）実稼働期間のUnion計算
    const skillIntervalMap = new Map<string, { startYearMonth: string; endYearMonth?: string | null; isCurrent?: boolean }[]>();

    histories.forEach((h) => {
      h.skills.forEach((s) => {
        const skillKey = s.skillName;
        if (!skillIntervalMap.has(skillKey)) {
          skillIntervalMap.set(skillKey, []);
        }
        skillIntervalMap.get(skillKey)!.push({
          startYearMonth: h.startYearMonth,
          endYearMonth: h.endYearMonth,
          isCurrent: h.isCurrent
        });
      });
    });

    const skillsExperience = Array.from(skillIntervalMap.entries()).map(([skillName, skIntervals]) => {
      const merged = calculateMergedMonths(skIntervals);
      return {
        skillName,
        totalMonths: merged.totalMonths,
        formatted: formatExperience(merged.totalMonths).formatted
      };
    }).sort((a, b) => b.totalMonths - a.totalMonths);

    const items: WorkHistoryDto[] = histories.map((h) => {
      const singleInterval = calculateMergedMonths([{
        startYearMonth: h.startYearMonth,
        endYearMonth: h.endYearMonth,
        isCurrent: h.isCurrent
      }]);

      return {
        id: h.id,
        employeeId: h.employeeId,
        projectName: h.projectName,
        description: h.description,
        role: h.role,
        startYearMonth: h.startYearMonth,
        endYearMonth: h.endYearMonth,
        isCurrent: h.isCurrent,
        notes: h.notes,
        durationMonths: singleInterval.totalMonths,
        skills: h.skills.map((s) => ({
          id: s.id,
          skillName: s.skillName,
          category: s.category
        }))
      };
    });

    return {
      items,
      totalUnionMonths: totalUnion.totalMonths,
      experienceFormatted: formatted.formatted,
      skillsExperience
    };
  }

  /**
   * 実務経歴の新規登録
   */
  static async create(params: {
    employeeId: string;
    projectName: string;
    description?: string | null;
    role?: string | null;
    startYearMonth: string;
    endYearMonth?: string | null;
    isCurrent?: boolean;
    notes?: string | null;
    skills: { skillName: string; category?: string | null }[];
    user: AuthSessionUser;
    ipAddress?: string;
    requestId?: string;
  }): Promise<WorkHistoryDto> {
    const {
      employeeId,
      projectName,
      description,
      role,
      startYearMonth,
      endYearMonth,
      isCurrent = false,
      notes,
      skills,
      user,
      ipAddress,
      requestId
    } = params;

    const created = await prisma.workHistory.create({
      data: {
        employeeId,
        projectName,
        description: description || null,
        role: role || null,
        startYearMonth,
        endYearMonth: isCurrent ? null : endYearMonth || null,
        isCurrent,
        notes: notes || null,
        skills: {
          create: skills.map((s) => ({
            skillName: s.skillName,
            category: s.category || null
          }))
        }
      },
      include: { skills: true }
    });

    await AuditService.record({
      actorId: user.employeeId,
      actorName: user.name,
      action: AuditAction.WORK_HISTORY_CREATE,
      targetType: TargetType.WORK_HISTORY,
      targetId: created.id,
      targetName: created.projectName,
      after: created,
      ipAddress,
      requestId
    });

    return {
      id: created.id,
      employeeId: created.employeeId,
      projectName: created.projectName,
      description: created.description,
      role: created.role,
      startYearMonth: created.startYearMonth,
      endYearMonth: created.endYearMonth,
      isCurrent: created.isCurrent,
      notes: created.notes,
      skills: created.skills.map((s) => ({
        id: s.id,
        skillName: s.skillName,
        category: s.category
      }))
    };
  }

  /**
   * 実務経歴の更新
   */
  static async update(
    id: string,
    params: {
      projectName?: string;
      description?: string | null;
      role?: string | null;
      startYearMonth?: string;
      endYearMonth?: string | null;
      isCurrent?: boolean;
      notes?: string | null;
      skills?: { skillName: string; category?: string | null }[];
      user: AuthSessionUser;
      ipAddress?: string;
      requestId?: string;
    }
  ): Promise<WorkHistoryDto> {
    const { projectName, description, role, startYearMonth, endYearMonth, isCurrent, notes, skills, user, ipAddress, requestId } = params;

    const current = await prisma.workHistory.findUnique({
      where: { id },
      include: { skills: true }
    });

    if (!current) throw AppError.notFound('実務経歴が見つかりません。');

    const updated = await prisma.$transaction(async (tx) => {
      if (skills !== undefined) {
        await tx.workHistorySkill.deleteMany({ where: { workHistoryId: id } });
      }

      return tx.workHistory.update({
        where: { id },
        data: {
          projectName: projectName || undefined,
          description: description !== undefined ? description : undefined,
          role: role !== undefined ? role : undefined,
          startYearMonth: startYearMonth || undefined,
          endYearMonth: isCurrent ? null : endYearMonth !== undefined ? endYearMonth : undefined,
          isCurrent: isCurrent !== undefined ? isCurrent : undefined,
          notes: notes !== undefined ? notes : undefined,
          skills: skills
            ? {
                create: skills.map((s) => ({
                  skillName: s.skillName,
                  category: s.category || null
                }))
              }
            : undefined
        },
        include: { skills: true }
      });
    });

    await AuditService.record({
      actorId: user.employeeId,
      actorName: user.name,
      action: AuditAction.WORK_HISTORY_UPDATE,
      targetType: TargetType.WORK_HISTORY,
      targetId: id,
      targetName: updated.projectName,
      before: current,
      after: updated,
      ipAddress,
      requestId
    });

    return {
      id: updated.id,
      employeeId: updated.employeeId,
      projectName: updated.projectName,
      description: updated.description,
      role: updated.role,
      startYearMonth: updated.startYearMonth,
      endYearMonth: updated.endYearMonth,
      isCurrent: updated.isCurrent,
      notes: updated.notes,
      skills: updated.skills.map((s) => ({
        id: s.id,
        skillName: s.skillName,
        category: s.category
      }))
    };
  }

  /**
   * 実務経歴の削除
   */
  static async delete(id: string, user: AuthSessionUser, ipAddress?: string, requestId?: string): Promise<void> {
    const current = await prisma.workHistory.findUnique({ where: { id } });
    if (!current) throw AppError.notFound('実務経歴が見つかりません。');

    await prisma.workHistory.delete({ where: { id } });

    await AuditService.record({
      actorId: user.employeeId,
      actorName: user.name,
      action: AuditAction.WORK_HISTORY_DELETE,
      targetType: TargetType.WORK_HISTORY,
      targetId: id,
      targetName: current.projectName,
      before: current,
      ipAddress,
      requestId
    });
  }
}
