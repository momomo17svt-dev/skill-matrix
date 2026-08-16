import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  databaseUrl: process.env.DATABASE_URL || 'sqlserver://localhost\\SQLEXPRESS;database=skillmatrix;integratedSecurity=true;trustServerCertificate=true;',
  session: {
    secret: process.env.SESSION_SECRET || 'skillmatrix-dev-session-secret-key-32chars!!',
    expiresInHours: parseInt(process.env.SESSION_EXPIRES_IN_HOURS || '24', 10),
    cookieName: 'skillmatrix_session',
    secure: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production'
  },
  auth: {
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
    lockoutDurationMinutes: parseInt(process.env.LOCKOUT_DURATION_MINUTES || '15', 10),
    saltRounds: 10
  },
  bootstrapAdmin: {
    enabled: process.env.ADMIN_BOOTSTRAP_ENABLED !== 'false',
    loginId: process.env.ADMIN_BOOTSTRAP_LOGIN_ID || 'admin',
    password: process.env.ADMIN_BOOTSTRAP_PASSWORD || 'AdminPassword123!',
    name: process.env.ADMIN_BOOTSTRAP_NAME || 'システム管理者',
    email: process.env.ADMIN_BOOTSTRAP_EMAIL || 'admin@skillmatrix.local'
  },
  upload: {
    dir: path.resolve(process.env.UPLOAD_DIR || './uploads'),
    maxSizeBytes: parseInt(process.env.MAX_UPLOAD_SIZE_BYTES || '10485760', 10) // 10MB
  },
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173'
};
