import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@tripconnect.com' },
    update: {},
    create: {
      email: 'admin@tripconnect.com',
      username: 'admin',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN'
    }
  });

  // Create demo user
  const demoPassword = await bcrypt.hash('demo123', 12);
  
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@tripconnect.com' },
    update: {},
    create: {
      email: 'demo@tripconnect.com',
      username: 'demo',
      password: demoPassword,
      firstName: 'Demo',
      lastName: 'User',
      role: 'USER'
    }
  });

  // Create sample tags
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { name_value: { name: 'Language', value: 'English' } },
      update: {},
      create: {
        name: 'Language',
        value: 'English',
        color: '#3B82F6',
        description: 'English speaking contacts'
      }
    }),
    prisma.tag.upsert({
      where: { name_value: { name: 'Language', value: 'Spanish' } },
      update: {},
      create: {
        name: 'Language',
        value: 'Spanish',
        color: '#EF4444',
        description: 'Spanish speaking contacts'
      }
    }),
    prisma.tag.upsert({
      where: { name_value: { name: 'Skill', value: 'Photography' } },
      update: {},
      create: {
        name: 'Skill',
        value: 'Photography',
        color: '#8B5CF6',
        description: 'Photography enthusiasts'
      }
    }),
    prisma.tag.upsert({
      where: { name_value: { name: 'Interest', value: 'Hiking' } },
      update: {},
      create: {
        name: 'Interest',
        value: 'Hiking',
        color: '#10B981',
        description: 'Hiking and outdoor activities'
      }
    }),
    prisma.tag.upsert({
      where: { name_value: { name: 'Dietary', value: 'Vegetarian' } },
      update: {},
      create: {
        name: 'Dietary',
        value: 'Vegetarian',
        color: '#F59E0B',
        description: 'Vegetarian diet preferences'
      }
    })
  ]);

  // Create automatic lists for tags
  for (const tag of tags) {
    await prisma.list.upsert({
      where: { tagId: tag.id },
      update: {},
      create: {
        name: `${tag.name}: ${tag.value}`,
        description: `Automatic list for ${tag.name} (${tag.value}) tag`,
        isAutomatic: true,
        tagId: tag.id
      }
    });
  }

  // Create sample contacts
  const contacts = await Promise.all([
    prisma.contact.create({
      data: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        address: '123 Main St, New York, NY',
        notes: 'Loves adventure travel and photography',
        createdById: demoUser.id,
        tags: {
          create: [
            { tagId: tags[0].id }, // English
            { tagId: tags[2].id }  // Photography
          ]
        }
      }
    }),
    prisma.contact.create({
      data: {
        firstName: 'Maria',
        lastName: 'Garcia',
        email: 'maria.garcia@example.com',
        phone: '+1234567891',
        address: '456 Oak Ave, Los Angeles, CA',
        notes: 'Experienced hiker and nature guide',
        createdById: demoUser.id,
        tags: {
          create: [
            { tagId: tags[1].id }, // Spanish
            { tagId: tags[3].id }  // Hiking
          ]
        }
      }
    }),
    prisma.contact.create({
      data: {
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@example.com',
        phone: '+1234567892',
        address: '789 Pine St, Seattle, WA',
        notes: 'Vegetarian chef and food blogger',
        createdById: demoUser.id,
        tags: {
          create: [
            { tagId: tags[0].id }, // English
            { tagId: tags[4].id }  // Vegetarian
          ]
        }
      }
    })
  ]);

  // Add contacts to their respective automatic lists
  for (const contact of contacts) {
    const contactWithTags = await prisma.contact.findUnique({
      where: { id: contact.id },
      include: { tags: true }
    });

    if (contactWithTags) {
      for (const contactTag of contactWithTags.tags) {
        const list = await prisma.list.findFirst({
          where: { tagId: contactTag.tagId, isAutomatic: true }
        });

        if (list) {
          await prisma.listMember.create({
            data: {
              listId: list.id,
              contactId: contact.id
            }
          }).catch(() => {}); // Ignore duplicates
        }
      }
    }
  }

  // Create sample trip group
  const tripGroup = await prisma.tripGroup.create({
    data: {
      name: 'Summer Adventure 2024',
      description: 'Epic summer trip to the Rocky Mountains',
      destination: 'Rocky Mountain National Park, Colorado',
      startDate: new Date('2024-07-15'),
      endDate: new Date('2024-07-22'),
      budget: 1500.00,
      status: 'PLANNING',
      createdById: demoUser.id,
      members: {
        create: [
          {
            userId: demoUser.id,
            role: 'ORGANIZER',
            isConfirmed: true
          },
          {
            contactId: contacts[0].id,
            role: 'MEMBER'
          },
          {
            contactId: contacts[1].id,
            role: 'VOLUNTEER'
          }
        ]
      }
    }
  });

  // Create sample itinerary
  await prisma.itinerary.create({
    data: {
      groupId: tripGroup.id,
      title: 'Arrival and Setup',
      description: 'Check into campsite and set up base camp',
      location: 'Moraine Park Campground',
      startTime: new Date('2024-07-15T14:00:00Z'),
      endTime: new Date('2024-07-15T17:00:00Z'),
      cost: 50.00,
      notes: 'Bring camping gear and food supplies'
    }
  });

  // Create sample expenses
  await prisma.expense.create({
    data: {
      groupId: tripGroup.id,
      title: 'Campsite Reservation',
      description: '7 nights at Moraine Park Campground',
      amount: 350.00,
      category: 'Accommodation',
      paidBy: 'Demo User',
      splitType: 'EQUAL',
      date: new Date('2024-06-01')
    }
  });

  // Create sample message
  await prisma.message.create({
    data: {
      content: 'Welcome to the Summer Adventure 2024 planning group! 🏔️',
      type: 'ANNOUNCEMENT',
      groupId: tripGroup.id,
      senderId: demoUser.id
    }
  });

  console.log('✅ Database seeding completed!');
  console.log('📊 Created:');
  console.log(`   - ${2} users`);
  console.log(`   - ${tags.length} tags`);
  console.log(`   - ${tags.length} automatic lists`);
  console.log(`   - ${contacts.length} contacts`);
  console.log(`   - 1 trip group`);
  console.log(`   - 1 itinerary item`);
  console.log(`   - 1 expense`);
  console.log(`   - 1 message`);
  console.log('\n🔑 Demo credentials:');
  console.log('   Email: demo@tripconnect.com');
  console.log('   Password: demo123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });