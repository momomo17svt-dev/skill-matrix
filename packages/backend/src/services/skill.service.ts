import { prisma } from '../prisma.js';
import { AppError } from '../utils/errors.js';
import {
  AuthSessionUser,
  Role,
  SkillLevel,
  EvaluationType,
  AuditAction,
  TargetType,
  SkillCategoryDto,
  SkillDto,
  SkillEvaluationHistoryDto
} from '@skillmatrix/shared';
import { AuditService } from './audit.service.js';

export class SkillService {
  /**
   * 部署固有のスキル定義一覧（カテゴリ階層付き）を取得
   */
  static async getDepartmentSkills(departmentId: string): Promise<SkillCategoryDto[]> {
    const categories = await prisma.skillCategory.findMany({
      where: { departmentId },
      orderBy: { sortOrder: 'asc' },
      include: {
        skills: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    return categories.map((cat) => ({
      id: cat.id,
      departmentId: cat.departmentId,
      name: cat.name,
      sortOrder: cat.sortOrder,
      skills: cat.skills.map((s) => ({
        id: s.id,
        categoryId: s.categoryId,
        departmentId: s.departmentId,
        name: s.name,
        notes: s.notes,
        sortOrder: s.sortOrder
      }))
    }));
  }

  /**
   * スキルカテゴリ作成
   */
  static async createCategory(params: {
    departmentId: string;
    name: string;
    sortOrder?: number;
    user: AuthSessionUser;
  }) {
    const { departmentId, name, sortOrder = 0 } = params;
    return prisma.skillCategory.create({
      data: { departmentId, name, sortOrder }
    });
  }

  /**
   * スキル定義作成
   */
  static async createSkill(params: {
    categoryId: string;
    departmentId: string;
    name: string;
    notes?: string | null;
    sortOrder?: number;
    user: AuthSessionUser;
    ipAddress?: string;
    requestId?: string;
  }): Promise<SkillDto> {
    const { categoryId, departmentId, name, notes, sortOrder = 0, user, ipAddress, requestId } = params;

    const skill = await prisma.skill.create({
      data: {
        categoryId,
        departmentId,
        name,
        notes,
        sortOrder
      },
      include: { category: true }
    });

    await AuditService.record({
      actorId: user.employeeId,
      actorName: user.name,
      action: AuditAction.SKILL_CREATE,
      targetType: TargetType.SKILL,
      targetId: skill.id,
      targetName: skill.name,
      after: skill,
      ipAddress,
      requestId
    });

    return {
      id: skill.id,
      categoryId: skill.categoryId,
      categoryName: skill.category.name,
      departmentId: skill.departmentId,
      name: skill.name,
      notes: skill.notes,
      sortOrder: skill.sortOrder
    };
  }

  /**
   * 自己評価の登録・更新
   */
  static async evaluateSelf(params: {
    employeeId: string;
    skillId: string;
    level: SkillLevel;
    reason?: string;
    user: AuthSessionUser;
    ipAddress?: string;
    requestId?: string;
  }) {
    const { employeeId, skillId, level, reason, user, ipAddress, requestId } = params;

    if (user.role === Role.GENERAL && user.employeeId !== employeeId) {
      throw AppError.forbidden('他人の自己評価を更新することはできません。');
    }

    const skill = await prisma.skill.findUnique({ where: { id: skillId } });
    if (!skill) throw AppError.notFound('スキル定義が見つかりません。');

    const existing = await prisma.skillEvaluation.findUnique({
      where: {
        employeeId_skillId: { employeeId, skillId }
      }
    });

    const previousLevel = (existing?.selfLevel || SkillLevel.UNEVALUATED) as SkillLevel;

    const evaluation = await prisma.skillEvaluation.upsert({
      where: {
        employeeId_skillId: { employeeId, skillId }
      },
      create: {
        employeeId,
        skillId,
        selfLevel: level,
        selfEvaluatedAt: new Date()
      },
      update: {
        selfLevel: level,
        selfEvaluatedAt: new Date()
      }
    });

    // 評価履歴を記録
    await prisma.skillEvaluationHistory.create({
      data: {
        evaluationId: evaluation.id,
        employeeId,
        skillId,
        evaluatorId: user.employeeId,
        evaluatorRole: user.role,
        evalType: EvaluationType.SELF,
        previousLevel,
        newLevel: level,
        reason: reason || null
      }
    });

    await AuditService.record({
      actorId: user.employeeId,
      actorName: user.name,
      action: AuditAction.SKILL_EVALUATION_SELF,
      targetType: TargetType.SKILL_EVALUATION,
      targetId: evaluation.id,
      after: { employeeId, skillId, selfLevel: level, reason },
      ipAddress,
      requestId
    });

    return evaluation;
  }

  /**
   * 所属長評価の登録・更新
   */
  static async evaluateManager(params: {
    employeeId: string;
    skillId: string;
    level: SkillLevel;
    reason?: string;
    user: AuthSessionUser;
    ipAddress?: string;
    requestId?: string;
  }) {
    const { employeeId, skillId, level, reason, user, ipAddress, requestId } = params;

    if (user.role === Role.GENERAL) {
      throw AppError.forbidden('一般ユーザーは所属長評価を行えません。');
    }

    const skill = await prisma.skill.findUnique({ where: { id: skillId } });
    if (!skill) throw AppError.notFound('スキル定義が見つかりません。');

    const existing = await prisma.skillEvaluation.findUnique({
      where: {
        employeeId_skillId: { employeeId, skillId }
      }
    });

    const previousLevel = (existing?.managerLevel || SkillLevel.UNEVALUATED) as SkillLevel;

    const evaluation = await prisma.skillEvaluation.upsert({
      where: {
        employeeId_skillId: { employeeId, skillId }
      },
      create: {
        employeeId,
        skillId,
        managerLevel: level,
        managerEvaluatedAt: new Date(),
        managerEvaluatorId: user.employeeId
      },
      update: {
        managerLevel: level,
        managerEvaluatedAt: new Date(),
        managerEvaluatorId: user.employeeId
      }
    });

    await prisma.skillEvaluationHistory.create({
      data: {
        evaluationId: evaluation.id,
        employeeId,
        skillId,
        evaluatorId: user.employeeId,
        evaluatorRole: user.role,
        evalType: EvaluationType.MANAGER,
        previousLevel,
        newLevel: level,
        reason: reason || null
      }
    });

    await AuditService.record({
      actorId: user.employeeId,
      actorName: user.name,
      action: AuditAction.SKILL_EVALUATION_MANAGER,
      targetType: TargetType.SKILL_EVALUATION,
      targetId: evaluation.id,
      after: { employeeId, skillId, managerLevel: level, reason },
      ipAddress,
      requestId
    });

    return evaluation;
  }

  /**
   * 社員のスキル評価履歴を取得
   */
  static async getEvaluationHistory(employeeId: string): Promise<SkillEvaluationHistoryDto[]> {
    const histories = await prisma.skillEvaluationHistory.findMany({
      where: { employeeId },
      include: {
        skill: true,
        employee: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // 評価者の氏名を取得
    const evaluatorIds = Array.from(new Set(histories.map((h) => h.evaluatorId)));
    const evaluators = await prisma.employee.findMany({
      where: { id: { in: evaluatorIds } },
      select: { id: true, name: true }
    });
    const evaluatorMap = new Map(evaluators.map((e) => [e.id, e.name]));

    return histories.map((h) => ({
      id: h.id,
      evaluationId: h.evaluationId,
      employeeId: h.employeeId,
      skillId: h.skillId,
      skillName: h.skill.name,
      evaluatorId: h.evaluatorId,
      evaluatorName: evaluatorMap.get(h.evaluatorId) || '不明',
      evaluatorRole: h.evaluatorRole,
      evalType: h.evalType as EvaluationType,
      previousLevel: h.previousLevel as SkillLevel,
      newLevel: h.newLevel as SkillLevel,
      reason: h.reason,
      createdAt: h.createdAt.toISOString()
    }));
  }
}
