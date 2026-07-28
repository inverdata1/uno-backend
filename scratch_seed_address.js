require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('🔄 Iniciando seeder de Direcciones...');

  // 1. Crear AddressTypes si no existen
  const types = [
    { name: 'Casa', icon: 'home' },
    { name: 'Trabajo', icon: 'business' },
    { name: 'Otro', icon: 'location' }
  ];

  let addressTypes = await prisma.addressType.findMany();
  if (addressTypes.length === 0) {
    console.log('🌱 Poblando AddressType...');
    for (const t of types) {
      await prisma.addressType.create({ data: t });
    }
    addressTypes = await prisma.addressType.findMany();
  } else {
    console.log('✅ AddressType ya contiene datos.');
  }

  // 2. Crear Estados de Venezuela si no existen
  const states = [
    { name: 'Distrito Capital' },
    { name: 'Miranda' },
    { name: 'Zulia' },
    { name: 'Carabobo' },
    { name: 'Lara' },
    { name: 'Aragua' },
    { name: 'Anzoátegui' }
  ];

  let venezuelanStates = await prisma.venezuelanState.findMany();
  if (venezuelanStates.length === 0) {
    console.log('🌱 Poblando VenezuelanState...');
    for (const s of states) {
      await prisma.venezuelanState.create({ data: s });
    }
    venezuelanStates = await prisma.venezuelanState.findMany();
  } else {
    console.log('✅ VenezuelanState ya contiene datos.');
  }

  // 3. Buscar usuarios clientes sin dirección
  console.log('🔍 Buscando usuarios clientes sin dirección...');
  const clients = await prisma.user.findMany({
    where: {
      OR: [
        { currentUserType: 'client' },
        { currentUserType: null } // Algunos tal vez no tengan el tipo seteado
      ]
    },
    include: {
      addresses: true
    }
  });

  const defaultType = addressTypes.find(t => t.name === 'Casa') || addressTypes[0];
  const defaultState = venezuelanStates.find(s => s.name === 'Distrito Capital') || venezuelanStates[0];

  for (const client of clients) {
    if (client.addresses && client.addresses.length > 0) {
      console.log(`✅ Cliente ${client.email} ya tiene dirección.`);
      continue;
    }

    console.log(`⚠️ Cliente ${client.email} no tiene dirección. Creando dirección por defecto...`);
    
    await prisma.address.create({
      data: {
        userId: client.id,
        typeId: defaultType.id,
        stateId: defaultState.id,
        city: 'Caracas',
        street: 'Avenida Principal',
        details: 'Casa',
        isDefault: true,
        latitude: 10.4806,
        longitude: -66.9036
      }
    });
    
    console.log(`🎉 Dirección por defecto creada para ${client.email}.`);
  }

  console.log('✅ Proceso de reparación de direcciones finalizado.');
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
