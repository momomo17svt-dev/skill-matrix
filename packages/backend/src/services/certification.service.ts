import { prisma } from '../prisma.js';
import { AppError } from '../utils/errors.js';
import { fileStorage } from '../utils/fileStorage.js';
import { AuthSessionUser, AuditAction, TargetType, CertificationMasterDto, EmployeeCertificationDto } from '@skillmatrix/shared';
import { AuditService } from './audit.service.js';

export class CertificationService {
  /**
   * 資格マスタ一覧取得
   */
  static async listMasters(): Promise<CertificationMasterDto[]> {
    const masters = await prisma.certificationMaster.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }]
    });
    return masters.map((m) => ({
      id: m.id,
      name: m.name,
      issuer: m.issuer,
      category: m.category
    }));
  }

  /**
   * 資格マスタ作成 (ADMINのみ)
   */
  static async createMaster(params: {
    name: string;
    issuer?: string | null;
    category?: string | null;
    user: AuthSessionUser;
  }): Promise<CertificationMasterDto> {
    const { name, issuer, category } = params;
    const existing = await prisma.certificationMaster.findUnique({ where: { name } });
    if (existing) throw AppError.conflict('その資格名は既にマスタに存在します。');

    const created = await prisma.certificationMaster.create({
      data: { name, issuer: issuer || null, category: category || null }
    });
    return created;
  }

  /**
   * 社員保有資格登録（添付ファイル対応）
   */
  static async addEmployeeCertification(params: {
    employeeId: string;
    certificationMasterId?: string | null;
    customCertificationName?: string | null;
    acquiredDate: string;
    expirationDate?: string | null;
    certificateNumber?: string | null;
    notes?: string | null;
    fileBuffer?: Buffer;
    originalFileName?: string;
    mimeType?: string;
    user: AuthSessionUser;
    ipAddress?: string;
    requestId?: string;
  }): Promise<EmployeeCertificationDto> {
    const {
      employeeId,
      certificationMasterId,
      customCertificationName,
      acquiredDate,
      expirationDate,
      certificateNumber,
      notes,
      fileBuffer,
      originalFileName,
      mimeType,
      user,
      ipAddress,
      requestId
    } = params;

    if (!certificationMasterId && !customCertificationName) {
      throw AppError.badRequest('資格マスタを選択するか、資格名を入力してください。');
    }

    let savedAttachment: any = null;
    if (fileBuffer && originalFileName && mimeType) {
      savedAttachment = await fileStorage.saveFile(fileBuffer, originalFileName, mimeType);
    }

    const created = await prisma.employeeCertification.create({
      data: {
        employeeId,
        certificationMasterId: certificationMasterId || null,
        customCertificationName: customCertificationName || null,
        acquiredDate: new Date(acquiredDate),
        expirationDate: expirationDate ? new Date(expirationDate) : null,
        certificateNumber: certificateNumber || null,
        notes: notes || null,
        attachment: savedAttachment
          ? {
              create: {
                originalFileName: savedAttachment.originalFileName,
                storedFileName: savedAttachment.storedFileName,
                filePath: savedAttachment.filePath,
                fileSize: savedAttachment.fileSize,
                mimeType: savedAttachment.mimeType,
                sha256Hash: savedAttachment.sha256Hash
              }
            }
          : undefined
      },
      include: {
        master: true,
        attachment: true
      }
    });

    await AuditService.record({
      actorId: user.employeeId,
      actorName: user.name,
      action: AuditAction.CERTIFICATION_CREATE,
      targetType: TargetType.CERTIFICATION,
      targetId: created.id,
      targetName: created.master?.name || created.customCertificationName || '資格',
      after: created,
      ipAddress,
      requestId
    });

    return {
      id: created.id,
      employeeId: created.employeeId,
      certificationMasterId: created.certificationMasterId,
      certificationName: created.master?.name || created.customCertificationName || '',
      issuer: created.master?.issuer || null,
      acquiredDate: created.acquiredDate.toISOString().split('T')[0],
      expirationDate: created.expirationDate ? created.expirationDate.toISOString().split('T')[0] : null,
      certificateNumber: created.certificateNumber,
      notes: created.notes,
      attachment: created.attachment
        ? {
            id: created.attachment.id,
            originalFileName: created.attachment.originalFileName,
            fileSize: created.attachment.fileSize,
            mimeType: created.attachment.mimeType,
            createdAt: created.attachment.createdAt.toISOString()
          }
        : null
    };
  }

  /**
   * 社員保有資格削除（物理ファイル整合性削除含む）
   */
  static async deleteEmployeeCertification(
    id: string,
    user: AuthSessionUser,
    ipAddress?: string,
    requestId?: string
  ): Promise<void> {
    const cert = await prisma.employeeCertification.findUnique({
      where: { id },
      include: { attachment: true }
    });

    if (!cert) throw AppError.notFound('資格が見つかりません。');

    const storedFileName = cert.attachment?.storedFileName;

    await prisma.employeeCertification.delete({ where: { id } });

    if (storedFileName) {
      await fileStorage.deleteFile(storedFileName);
    }

    await AuditService.record({
      actorId: user.employeeId,
      actorName: user.name,
      action: AuditAction.CERTIFICATION_DELETE,
      targetType: TargetType.CERTIFICATION,
      targetId: id,
      before: cert,
      ipAddress,
      requestId
    });
  }

  /**
   * 添付ファイルダウンロード情報取得
   */
  static async getAttachmentForDownload(attachmentId: string) {
    const attachment = await prisma.certificationAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        certification: {
          include: { employee: true }
        }
      }
    });

    if (!attachment) throw AppError.notFound('添付ファイルが見つかりません。');

    const absolutePath = fileStorage.getAbsoluteFilePath(attachment.storedFileName);
    return {
      attachment,
      absolutePath,
      employeeId: attachment.certification.employeeId
    };
  }
}
