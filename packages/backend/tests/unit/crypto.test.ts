import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, generateSessionToken, sha256 } from '../../src/utils/crypto.js';

describe('Backend Crypto Utils', () => {
  it('should hash and verify passwords correctly', async () => {
    const plain = 'MySecretPassword123!';
    const hashed = await hashPassword(plain);

    expect(hashed).toBeDefined();
    expect(hashed).not.toBe(plain);

    const match = await verifyPassword(plain, hashed);
    expect(match).toBe(true);

    const wrongMatch = await verifyPassword('WrongPassword', hashed);
    expect(wrongMatch).toBe(false);
  });

  it('should generate secure 64-char hex session token (32 bytes)', () => {
    const token1 = generateSessionToken();
    const token2 = generateSessionToken();

    expect(token1).toHaveLength(64);
    expect(token2).toHaveLength(64);
    expect(token1).not.toBe(token2);
  });

  it('should compute SHA-256 hash correctly', () => {
    const hash = sha256('hello-world');
    expect(hash).toHaveLength(64);
  });
});
