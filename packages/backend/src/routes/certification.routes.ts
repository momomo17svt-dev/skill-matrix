import { Hono } from 'hono';
import fs from 'fs/promises';
import { CertificationService } from '../services/certification.service.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { requireRoles, assertCanAccessEmployee } from '../middlewares/rbacMiddleware.js';
import {
  CreateCertificationMasterSchema,
  Role,
  AuthSessionUser
} from '@skillmatrix/shared';

import { AppEnv } from '../types/index.js';

export const certificationRoutes = new Hono<AppEnv>();

certificationRoutes.use('*', authMiddleware());

// 資格マスタ一覧取得
certificationRoutes.get('/masters', async (c) => {
  const masters = await CertificationService.listMasters();
  return c.json({
    success: true,
    data: masters
  });
});

// 資格マスタ作成 (ADMINのみ)
certificationRoutes.post('/masters', requireRoles([Role.ADMIN]), async (c) => {
  const user = c.get('user') as AuthSessionUser;
  const body = await c.req.json();
  const validated = CreateCertificationMasterSchema.parse(body);

  const master = await CertificationService.createMaster({
    name: validated.name,
    issuer: validated.issuer,
    category: validated.category,
    user
  });

  return c.json({
    success: true,
    data: master
  }, 201);
});

// 社員保有資格登録 (JSONまたはmultipart/form-data)
certificationRoutes.post('/employee/:employeeId', async (c) => {
  const user = c.get('user') as AuthSessionUser;
  const employeeId = c.req.param('employeeId');
  const ip = c.req.header('x-forwarded-for') || '127.0.0.1';
  const requestId = c.get('requestId');

  await assertCanAccessEmployee(user, employeeId, 'write');

  const contentType = c.req.header('content-type') || '';
  let certificationMasterId: string | undefined;
  let customCertificationName: string | undefined;
  let acquiredDate: string = '';
  let expirationDate: string | undefined;
  let certificateNumber: string | undefined;
  let notes: string | undefined;
  let fileBuffer: Buffer | undefined;
  let originalFileName: string | undefined;
  let mimeType: string | undefined;

  if (contentType.includes('multipart/form-data')) {
    const formData = await c.req.formData();
    certificationMasterId = formData.get('certificationMasterId') as string || undefined;
    customCertificationName = formData.get('customCertificationName') as string || undefined;
    acquiredDate = formData.get('acquiredDate') as string;
    expirationDate = formData.get('expirationDate') as string || undefined;
    certificateNumber = formData.get('certificateNumber') as string || undefined;
    notes = formData.get('notes') as string || undefined;

    const file = formData.get('file');
    if (file && typeof file === 'object' && 'arrayBuffer' in file) {
      const f = file as File;
      originalFileName = f.name;
      mimeType = f.type;
      const arrayBuf = await f.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuf);
    }
  } else {
    const body = await c.req.json();
    certificationMasterId = body.certificationMasterId;
    customCertificationName = body.customCertificationName;
    acquiredDate = body.acquiredDate;
    expirationDate = body.expirationDate;
    certificateNumber = body.certificateNumber;
    notes = body.notes;
  }

  const cert = await CertificationService.addEmployeeCertification({
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
    ipAddress: ip,
    requestId
  });

  return c.json({
    success: true,
    data: cert
  }, 201);
});

// 社員保有資格削除
certificationRoutes.delete('/:id', async (c) => {
  const user = c.get('user') as AuthSessionUser;
  const id = c.req.param('id');
  const ip = c.req.header('x-forwarded-for') || '127.0.0.1';
  const requestId = c.get('requestId');

  await CertificationService.deleteEmployeeCertification(id, user, ip, requestId);

  return c.json({
    success: true,
    data: { message: '資格情報を削除しました。' }
  });
});

// 添付ファイル安全ダウンロード (IDORチェック付き)
certificationRoutes.get('/attachments/:attachmentId/download', async (c) => {
  const user = c.get('user') as AuthSessionUser;
  const attachmentId = c.req.param('attachmentId');

  const { attachment, absolutePath, employeeId } = await CertificationService.getAttachmentForDownload(attachmentId);

  await assertCanAccessEmployee(user, employeeId, 'read');

  const fileBytes = await fs.readFile(absolutePath);

  // 安全なContent-Dispositionヘッダー
  const encodedName = encodeURIComponent(attachment.originalFileName);
  return c.newResponse(fileBytes, 200, {
    'Content-Type': attachment.mimeType,
    'Content-Disposition': `attachment; filename*=UTF-8''${encodedName}`
  });
});
