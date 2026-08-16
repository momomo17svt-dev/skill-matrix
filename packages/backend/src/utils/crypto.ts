import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { config } from '../config/index.js';

/**
 * パスワードを安全にハッシュ化します (bcrypt, saltRounds: 10)
 */
export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, config.auth.saltRounds);
}

/**
 * パスワードを検証します
 */
export async function verifyPassword(plainText: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plainText, hashed);
}

/**
 * 32バイトの暗号論的安全なセッショントークンを生成します
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * トークンや文字列の SHA-256 ハッシュを計算します
 */
export function sha256(input: string | Buffer): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}
