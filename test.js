const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const posts = await prisma.post.findMany({ where: { taggedProducts: { not: null } } });
  console.log(posts.length + ' posts with tagged products');
  if (posts.length > 0) {
    console.log(typeof posts[0].taggedProducts);
    console.log(Array.isArray(posts[0].taggedProducts));
    console.log(posts[0].taggedProducts);
  }
}
run();
