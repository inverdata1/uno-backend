const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.$transaction(async (tx) => {
      let createdUser = await tx.user.create({
        data: {
          email: `test_${Date.now()}@test.com`,
          password: 'hashedpassword',
          firstName: 'Test',
          lastName: 'User',
          phone: '+584141234567',
        },
      });

      const business = await tx.business.create({
        data: {
          businessName: 'My Business',
          category: 'Food',
          description: '',
          address: '123 Test St',
          coordinates: null,
          phone: '12345678',
          logoUrl: null,
          bannerUrl: null,
          ownerId: createdUser.id,
        },
      });

      createdUser = await tx.user.update({
        where: { id: createdUser.id },
        data: { currentBusinessId: business.id },
      });

      return createdUser;
    });

    console.log('Success:', user.id);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
