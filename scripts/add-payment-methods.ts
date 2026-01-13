import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function addPaymentMethods() {
  console.log('Adding payment methods...');

  const methods = [
    { methodName: 'Momo', isActive: true },
    { methodName: 'Bank Transfer', isActive: true },
    { methodName: 'SePay QR', isActive: true },
  ];

  for (const method of methods) {
    const existing = await prisma.paymentMethod.findFirst({
      where: { methodName: method.methodName },
    });

    if (!existing) {
      await prisma.paymentMethod.create({
        data: method,
      });
      console.log(`✓ Added payment method: ${method.methodName}`);
    } else {
      console.log(`→ Payment method already exists: ${method.methodName}`);
    }
  }

  console.log('✅ Payment methods setup complete!');
  await prisma.$disconnect();
}

addPaymentMethods().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
