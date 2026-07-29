const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:admin1206@localhost:5432/uno_delivery?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany({
    include: {
      ownedBusinesses: true
    }
  });

  console.log(`Total usuarios: ${users.length}`);
  users.forEach(user => {
    console.log(`- ${user.email} | currentBusinessId: ${user.currentBusinessId} | Negocios: ${user.ownedBusinesses.length}`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
