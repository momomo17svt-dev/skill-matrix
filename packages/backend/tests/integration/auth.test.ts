import { describe, it, expect } from 'vitest';
import { createApp } from '../../src/app.js';

describe('API Integration: Health & Auth endpoints', () => {
  const app = createApp();

  it('GET /health should return 200 OK', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
  });

  it('POST /api/v1/auth/login with invalid input should return 400 Bad Request', async () => {
    const res = await app.request('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId: '', password: '' })
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('GET /api/v1/employees without auth cookie should return 401 Unauthorized', async () => {
    const res = await app.request('/api/v1/employees');
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });
});
