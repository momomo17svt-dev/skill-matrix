import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { config } from '../config/index.js';
import { AppError } from './errors.js';
import { FILE_UPLOAD_CONSTANTS } from '@skillmatrix/shared';

export interface VirusScanner {
  scanFile(filePath: string): Promise<{ isClean: boolean; virusName?: string }>;
}

export class NoOpVirusScanner implements VirusScanner {
  async scanFile(_filePath: string): Promise<{ isClean: boolean; virusName?: string }> {
    return { isClean: true };
  }
}

export class LocalFileStorageService {
  private scanner: VirusScanner;

  constructor(scanner: VirusScanner = new NoOpVirusScanner()) {
    this.scanner = scanner;
  }

  /**
   * アップロードディレクトリを初期化します
   */
  async ensureUploadDir(): Promise<void> {
    try {
      await fs.mkdir(config.upload.dir, { recursive: true });
    } catch (err) {
      console.error('Failed to create upload directory:', err);
    }
  }

  /**
   * ファイルバッファを検証し、UUIDベースの安全なファイル名で保存します
   */
  async saveFile(
    fileBuffer: Buffer,
    originalFileName: string,
    mimeType: string
  ): Promise<{
    originalFileName: string;
    storedFileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    sha256Hash: string;
  }> {
    await this.ensureUploadDir();

    // 1. サイズ検証
    if (fileBuffer.length > config.upload.maxSizeBytes) {
      throw AppError.badRequest(`ファイルサイズが上限（${config.upload.maxSizeBytes / (1024 * 1024)}MB）を超えています。`);
    }

    // 2. 拡張子検証
    const ext = path.extname(originalFileName).toLowerCase();
    if (!FILE_UPLOAD_CONSTANTS.ALLOWED_EXTENSIONS.includes(ext as any)) {
      throw AppError.badRequest(`許可されていないファイル拡張子です。許可形式: ${FILE_UPLOAD_CONSTANTS.ALLOWED_EXTENSIONS.join(', ')}`);
    }

    // 3. MIMEタイプ検証
    if (!FILE_UPLOAD_CONSTANTS.ALLOWED_MIME_TYPES.includes(mimeType as any)) {
      throw AppError.badRequest(`許可されていないMIMEタイプです: ${mimeType}`);
    }

    // 4. マジックナンバー検証
    this.validateMagicBytes(fileBuffer, ext);

    // 5. UUIDファイル名生成
    const storedFileName = `${crypto.randomUUID()}${ext}`;
    const targetFilePath = path.join(config.upload.dir, storedFileName);

    // 6. 保存
    await fs.writeFile(targetFilePath, fileBuffer);

    // 7. ウイルススキャン
    const scanResult = await this.scanner.scanFile(targetFilePath);
    if (!scanResult.isClean) {
      await fs.unlink(targetFilePath).catch(() => {});
      throw AppError.badRequest(`セキュリティスキャンでウイルスが検出されました: ${scanResult.virusName || 'Unknown'}`);
    }

    const sha256Hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    return {
      originalFileName: path.basename(originalFileName),
      storedFileName,
      filePath: storedFileName, // 相対ファイル名
      fileSize: fileBuffer.length,
      mimeType,
      sha256Hash
    };
  }

  /**
   * ファイルの実体パスを取得します (Path Traversal 防止)
   */
  getAbsoluteFilePath(storedFileName: string): string {
    const safeName = path.basename(storedFileName);
    return path.join(config.upload.dir, safeName);
  }

  /**
   * 物理ファイルを安全に削除します
   */
  async deleteFile(storedFileName: string): Promise<void> {
    try {
      const fullPath = this.getAbsoluteFilePath(storedFileName);
      await fs.unlink(fullPath);
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        console.error(`Failed to delete physical file: ${storedFileName}`, err);
      }
    }
  }

  private validateMagicBytes(buffer: Buffer, ext: string) {
    if (buffer.length < 4) {
      throw AppError.badRequest('ファイルデータが不正です。');
    }
    // PDF: %PDF (0x25, 0x50, 0x44, 0x46)
    if (ext === '.pdf') {
      if (buffer[0] !== 0x25 || buffer[1] !== 0x50 || buffer[2] !== 0x44 || buffer[3] !== 0x46) {
        throw AppError.badRequest('PDFファイル形式が不正です。');
      }
    }
    // PNG: 89 50 4E 47
    else if (ext === '.png') {
      if (buffer[0] !== 0x89 || buffer[1] !== 0x50 || buffer[2] !== 0x4E || buffer[3] !== 0x47) {
        throw AppError.badRequest('PNGファイル形式が不正です。');
      }
    }
    // JPEG/JPG: FF D8 FF
    else if (ext === '.jpg' || ext === '.jpeg') {
      if (buffer[0] !== 0xFF || buffer[1] !== 0xD8 || buffer[2] !== 0xFF) {
        throw AppError.badRequest('JPEGファイル形式が不正です。');
      }
    }
  }
}

export const fileStorage = new LocalFileStorageService();
