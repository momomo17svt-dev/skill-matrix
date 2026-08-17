import { prisma } from '../prisma.js';
import { AuditAction, TargetType } from '@skillmatrix/shared';

export interface RecordAuditLogParams {
  actorId: string;
  actorName: string;
  action: AuditAction;
  targetType: TargetType;
  targetId: string;
  targetEmployeeNumber?: string | null;
  targetName?: string | null;
  before?: unknown;
  after?: unknown;
  ipAddress?: string | null;
  requestId?: string | null;
}

export class AuditService {
  /**
   * 不変の監査ログを記録します
   */
  static async record(params: RecordAuditLogParams): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          actorId: params.actorId,
          actorName: params.actorName,
          action: params.action,
          targetType: params.targetType,
          targetId: params.targetId,
          targetEmployeeNumber: params.targetEmployeeNumber,
          targetName: params.targetName,
          beforeJson: params.before ? JSON.stringify(params.before) : null,
          afterJson: params.after ? JSON.stringify(params.after) : null,
          ipAddress: params.ipAddress,
          requestId: params.requestId
        }
      });
    } catch (err) {
      console.error('CRITICAL: Failed to write audit log:', err);
    }
  }

  /**
   * 監査ログ一覧を取得します (ADMIN専用)
   */
  static async list(params: {
    page: number;
    limit: number;
    keyword?: string;
    action?: string;
    targetType?: string;
    targetId?: string;
    actorId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { page, limit, keyword, action, targetType, targetId, actorId, startDate, endDate } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (action) where.action = action;
    if (targetType) where.targetType = targetType;
    if (targetId) where.targetId = targetId;
    if (actorId) where.actorId = actorId;

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.timestamp.lte = end;
      }
    }

    if (keyword && keyword.trim()) {
      const q = keyword.trim();
      where.OR = [
        { action: { contains: q, mode: 'insensitive' } },
        { targetType: { contains: q, mode: 'insensitive' } },
        { actorName: { contains: q, mode: 'insensitive' } },
        { targetName: { contains: q, mode: 'insensitive' } },
        { targetEmployeeNumber: { contains: q, mode: 'insensitive' } },
        { targetId: { contains: q, mode: 'insensitive' } },
        { ipAddress: { contains: q, mode: 'insensitive' } },
        { requestId: { contains: q, mode: 'insensitive' } }
      ];
    }

    const [total, items] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit
      })
    ]);

    return {
      items: items.map((log) => ({
        id: log.id,
        timestamp: log.timestamp.toISOString(),
        actorId: log.actorId,
        actorName: log.actorName,
        action: log.action as AuditAction,
        targetType: log.targetType as TargetType,
        targetId: log.targetId,
        targetEmployeeNumber: log.targetEmployeeNumber,
        targetName: log.targetName,
        beforeJson: log.beforeJson,
        afterJson: log.afterJson,
        ipAddress: log.ipAddress,
        requestId: log.requestId
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + items.length < total
      }
    };
  }
}
