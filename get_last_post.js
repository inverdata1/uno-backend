const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const lastPost = await prisma.post.findFirst({
    orderBy: { createdAt: 'desc' },
  });
  console.log(JSON.stringify(lastPost, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
