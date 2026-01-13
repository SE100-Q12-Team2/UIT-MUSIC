import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function cleanupPaymentMethods() {
  console.log('🧹 Cleaning up duplicate payment methods...');

  // Get all payment methods
  const allMethods = await prisma.paymentMethod.findMany({
    orderBy: { id: 'asc' }
  });

  console.log(`Found ${allMethods.length} payment methods`);

  // Group by methodName and keep only the first one
  const uniqueNames = new Set<string>();
  const toDelete: number[] = [];

  for (const method of allMethods) {
    if (uniqueNames.has(method.methodName)) {
      toDelete.push(method.id);
      console.log(`  ❌ Marking duplicate for deletion: ${method.methodName} (ID: ${method.id})`);
    } else {
      uniqueNames.add(method.methodName);
      console.log(`  ✓ Keeping: ${method.methodName} (ID: ${method.id})`);
    }
  }

  if (toDelete.length > 0) {
    console.log(`\nUpdating transactions to use the first payment method...`);
    
    // Update transactions to point to the first Momo (ID 1)
    const transactionsToUpdate = await prisma.transaction.findMany({
      where: {
        paymentMethodId: {
          in: toDelete.filter((id, idx) => {
            // Find which duplicates are Momo
            const method = allMethods.find(m => m.id === id);
            return method?.methodName === 'Momo';
          })
        }
      }
    });

    if (transactionsToUpdate.length > 0) {
      console.log(`  Found ${transactionsToUpdate.length} transactions to update`);
      await prisma.transaction.updateMany({
        where: {
          id: {
            in: transactionsToUpdate.map(t => t.id)
          }
        },
        data: {
          paymentMethodId: 1 // First Momo ID
        }
      });
      console.log('  ✓ Transactions updated');
    }

    console.log(`\nDeleting ${toDelete.length} duplicate payment methods...`);
    await prisma.paymentMethod.deleteMany({
      where: {
        id: {
          in: toDelete
        }
      }
    });
    console.log('✅ Duplicates removed successfully!');
  } else {
    console.log('✅ No duplicates found!');
  }

  // Show final list
  const finalMethods = await prisma.paymentMethod.findMany();
  console.log('\n📋 Final payment methods:');
  finalMethods.forEach(m => {
    console.log(`  - ${m.methodName} (ID: ${m.id}, Active: ${m.isActive})`);
  });

  await prisma.$disconnect();
}

cleanupPaymentMethods().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
