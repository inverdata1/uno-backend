const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const post = await prisma.post.findFirst({ orderBy: { createdAt: 'desc' } });
    console.log('Latest post id:', post.id);
    const updated = await prisma.post.update({
      where: { id: post.id },
      data: { isActive: false }
    });
    console.log('Updated:', updated.id);
  } catch (err) {
    console.error('Error:', err);
  }
}

main().finally(() => prisma.$disconnect());
