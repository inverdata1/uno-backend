const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Buscando usuarios con negocios pero sin contexto asignado...');
  
  // Buscar usuarios que tienen negocios, pero su currentBusinessId es null
  const usersWithMissingContext = await prisma.user.findMany({
    where: {
      currentBusinessId: null,
      ownedBusinesses: {
        some: {}
      }
    },
    include: {
      ownedBusinesses: {
        include: {
          branches: {
            where: { isMain: true },
            take: 1
          }
        }
      }
    }
  });

  console.log(`Se encontraron ${usersWithMissingContext.length} usuarios para corregir.`);

  for (const user of usersWithMissingContext) {
    const firstBusiness = user.ownedBusinesses[0];
    const mainBranch = firstBusiness?.branches?.[0];

    if (firstBusiness) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          currentBusinessId: firstBusiness.id,
          currentBranchId: mainBranch ? mainBranch.id : null,
          currentUserType: 'business'
        }
      });
      console.log(`✅ Usuario ${user.email} actualizado -> Negocio: ${firstBusiness.businessName}`);
    }
  }

  console.log('¡Proceso completado con éxito!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
