/**
 * Cleanup script to remove empty smart lists from the database
 * Run with: npx ts-node backend/src/scripts/cleanupEmptyLists.ts
 */

import { PrismaClient } from '@prisma/client';
import { SmartListManager } from '../utils/smartListManager';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Starting cleanup of empty smart lists...');

  try {
    // Get all automatic lists
    const automaticLists = await prisma.list.findMany({
      where: {
        isAutomatic: true
      },
      include: {
        _count: {
          select: {
            members: true
          }
        },
        tag: {
          include: {
            _count: {
              select: {
                contacts: true
              }
            }
          }
        }
      }
    });

    console.log(`Found ${automaticLists.length} automatic lists`);

    const emptyLists = automaticLists.filter(list => {
      const hasMembers = list._count.members > 0;
      const tagContactCount = list.tag?._count?.contacts ?? 0;
      const hasContactsWithTag = tagContactCount > 0;
      return !hasMembers && !hasContactsWithTag;
    });

    console.log(`Found ${emptyLists.length} empty smart lists to delete`);

    if (emptyLists.length > 0) {
      await prisma.list.deleteMany({
        where: {
          id: { in: emptyLists.map(l => l.id) }
        }
      });

      console.log(`✅ Deleted ${emptyLists.length} empty smart lists`);
    } else {
      console.log('✅ No empty smart lists found');
    }

    // Also run the SmartListManager cleanup for consistency
    await SmartListManager.cleanupEmptyLists();
    console.log('✅ Smart list manager cleanup completed');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
