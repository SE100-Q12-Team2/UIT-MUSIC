import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import envConfig from 'src/shared/config';
import { Role } from 'src/shared/constants/role.constant';
import { HashingService } from 'src/shared/services';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const hashingService = new HashingService();

export const initScript = async () => {
  const roleCount = await prisma.role.count();
  if (roleCount > 0) {
    throw new Error('Role already exists');
  }

  const roles = await prisma.role.createMany({
    data: [
      { name: Role.ADMIN, description: 'Đây là role ADMIN' },
      { name: Role.LABEL, description: 'Đây là role LABEL' },
      { name: Role.LISTENER, description: 'Đây là role LISTENER' },
    ],
  });

  const adminRole = await prisma.role.findFirstOrThrow({
    where: { name: Role.ADMIN },
  });

  const hashedPassword = await hashingService.hash(envConfig.ADMIN_PASSWORD);

  const adminUser = await prisma.user.create({
    data: {
      email: envConfig.ADMIN_EMAIL,
      fullName: envConfig.ADMIN_NAME,
      password: hashedPassword,
      roleId: adminRole.id,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      roleId: true,
    },
  });

  return { createdRolesCount: roles.count, adminUser };
};

initScript()
  .then(({ createdRolesCount, adminUser }) => {
    console.log(`Đã tạo ra ${createdRolesCount} roles`);
    console.log(`Admin có tài khoản là ${adminUser.email}`);
  })
  .catch((error) => {
    console.error(error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
