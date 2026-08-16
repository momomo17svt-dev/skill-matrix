import { describe, it, expect } from 'vitest';
import { LocalFileStorageService } from '../../src/utils/fileStorage.js';

describe('LocalFileStorageService', () => {
  const storage = new LocalFileStorageService();

  it('should validate and save valid PDF file', async () => {
    // %PDF-1.4 dummy header
    const pdfBuffer = Buffer.from('%PDF-1.4 sample pdf content for testing');
    const result = await storage.saveFile(pdfBuffer, 'certificate.pdf', 'application/pdf');

    expect(result.originalFileName).toBe('certificate.pdf');
    expect(result.storedFileName).toMatch(/^[0-9a-f-]+\.pdf$/);
    expect(result.fileSize).toBe(pdfBuffer.length);
    expect(result.mimeType).toBe('application/pdf');
    expect(result.sha256Hash).toHaveLength(64);

    // クリーンアップ
    await storage.deleteFile(result.storedFileName);
  });

  it('should reject disallowed file extensions', async () => {
    const exeBuffer = Buffer.from('MZ... executable content');
    await expect(storage.saveFile(exeBuffer, 'virus.exe', 'application/x-msdownload')).rejects.toThrow(
      '許可されていないファイル拡張子です'
    );
  });

  it('should reject invalid magic bytes for declared MIME type', async () => {
    const fakePdfBuffer = Buffer.from('FAKE NOT A PDF');
    await expect(storage.saveFile(fakePdfBuffer, 'fake.pdf', 'application/pdf')).rejects.toThrow(
      'PDFファイル形式が不正です'
    );
  });
});
