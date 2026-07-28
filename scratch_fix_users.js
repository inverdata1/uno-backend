require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('🔄 Buscando usuarios de tipo negocio...');
  
  const users = await prisma.user.findMany({
    where: { currentUserType: 'business' },
    include: { ownedBusinesses: true }
  });

  console.log(`Encontrados ${users.length} usuarios con currentUserType = 'business'`);

  for (const user of users) {
    if (user.ownedBusinesses && user.ownedBusinesses.length > 0) {
      console.log(`✅ Usuario ${user.email} ya tiene un negocio asignado. Saltando...`);
      continue;
    }

    console.log(`⚠️ Usuario ${user.email} no tiene negocio. Creando negocio por defecto...`);
    const businessName = user.displayName || user.firstName ? `${user.firstName || user.displayName} Negocio` : 'Mi Negocio';
    
    const newBusiness = await prisma.business.create({
      data: {
        ownerId: user.id,
        businessName: businessName,
        status: 'active',
        branches: {
          create: {
            name: 'Sede Principal',
            isMain: true,
            status: 'active',
            phone: user.phone
          }
        }
      },
      include: {
        branches: true
      }
    });

    const mainBranch = newBusiness.branches[0];

    await prisma.user.update({
      where: { id: user.id },
      data: {
        currentBusinessId: newBusiness.id,
        currentBranchId: mainBranch.id
      }
    });

    console.log(`🎉 Negocio creado para ${user.email}. Business ID: ${newBusiness.id}`);
  }

  console.log('✅ Proceso de reparación de usuarios finalizado.');
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
