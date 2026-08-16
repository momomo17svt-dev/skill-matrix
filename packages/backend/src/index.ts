import { serve } from '@hono/node-server';
import { createApp } from './app.js';
import { config } from './config/index.js';
import { prisma } from './prisma.js';
import { hashPassword } from './utils/crypto.js';
import { Role, EmployeeStatus } from '@skillmatrix/shared';

async function bootstrapAdmin() {
  if (!config.bootstrapAdmin.enabled) return;

  try {
    const adminCount = await prisma.employee.count({
      where: { role: Role.ADMIN }
    });

    if (adminCount === 0) {
      console.log('No administrator found. Creating initial bootstrap administrator...');

      // ルート部署の存在確認または作成
      let rootDept = await prisma.department.findFirst({
        where: { parentId: null }
      });

      if (!rootDept) {
        rootDept = await prisma.department.create({
          data: {
            code: 'SYSTEM',
            name: 'システム管理部',
            path: '/SYSTEM',
            level: 1,
            sortOrder: 0
          }
        });
      }

      const passwordHash = await hashPassword(config.bootstrapAdmin.password);

      const adminEmp = await prisma.employee.create({
        data: {
          employeeNumber: 'ADM001',
          name: config.bootstrapAdmin.name,
          nameKana: 'システム カンリシャ',
          email: config.bootstrapAdmin.email,
          departmentId: rootDept.id,
          position: 'システム管理者',
          role: Role.ADMIN,
          hireDate: new Date(),
          status: EmployeeStatus.ACTIVE,
          notes: '初期自動生成管理者アカウント'
        }
      });

      await prisma.account.create({
        data: {
          employeeId: adminEmp.id,
          loginId: config.bootstrapAdmin.loginId,
          passwordHash,
          isInitialPassword: false
        }
      });

      console.log(`Bootstrap admin successfully created: Login ID "${config.bootstrapAdmin.loginId}"`);
    }
  } catch (err) {
    console.error('Failed to bootstrap initial admin:', err);
  }
}

async function main() {
  const app = createApp();

  // 起動時の管理者Bootstrap
  await bootstrapAdmin();

  console.log(`Starting SkillMatrix Backend on http://${config.host}:${config.port} (${config.env})`);

  serve({
    fetch: app.fetch,
    port: config.port,
    hostname: config.host
  });
}

main().catch((err) => {
  console.error('Fatal error during startup:', err);
  process.exit(1);
});
