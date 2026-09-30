/**
 * Demo data seeder
 *
 * Creates 20 businesses, each with an owner account, a main branch, a product
 * catalogue and 5 published posts (4 photos + 1 video).
 *
 * Safe to re-run: every record it creates is tagged with DEMO_EMAIL_DOMAIN and
 * wiped before reseeding, so it never touches real accounts or their data.
 *
 *   node scripts/seed-demo-data.js          seed (wipes previous demo data first)
 *   node scripts/seed-demo-data.js --clean  only remove demo data
 *
 * Media points at public CDNs (Picsum for stills, test-videos.co.uk and Pexels
 * for clips) rather than local files, so nothing needs uploading to the server.
 */

require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const DEMO_EMAIL_DOMAIN = 'demo.unodelivery.com';
const DEMO_PASSWORD = 'demo1234';

const VIDEO_POOL = [
  'https://videos.pexels.com/video-files/3195394/3195394-sd_640_360_25fps.mp4',
  'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
  'https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_1MB.mp4',
  'https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_1MB.mp4',
  'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
  'https://test-videos.co.uk/vids/sintel/mp4/h264/360/Sintel_360_10s_1MB.mp4',
];

const photo = (seed, size = 1080) => `https://picsum.photos/seed/${seed}/${size}/${size}`;
const wide = (seed) => `https://picsum.photos/seed/${seed}/1200/600`;

// Caracas, roughly. Each branch gets a small offset so the map has spread.
const BASE_LAT = 10.4806;
const BASE_LON = -66.9036;

const BUSINESSES = [
  {
    slug: 'arepera-candelaria',
    name: 'Arepera La Candelaria',
    type: 'Comida Venezolana',
    category: 'restaurante',
    description: 'Arepas de maíz pilado hechas al budare, rellenas como en casa. Más de 20 años en La Candelaria.',
    hours: '7:00 AM - 10:00 PM',
    phone: '+584121110001',
    featured: true,
    products: [
      ['Reina Pepiada', 4.5], ['Pelúa', 4.8], ['Domino', 3.9], ['Catira', 4.6],
      ['Pabellón Criollo', 7.5], ['Cachapa con Queso de Mano', 6.2], ['Jugo de Papelón', 1.8],
    ],
  },
  {
    slug: 'pizzeria-don-ciccio',
    name: 'Pizzería Don Ciccio',
    type: 'Italiana',
    category: 'restaurante',
    description: 'Masa madre fermentada 48 horas y horno de leña. Recetas napolitanas de la familia Ciccio.',
    hours: '12:00 PM - 11:00 PM',
    phone: '+584121110002',
    featured: true,
    products: [
      ['Margherita', 9.5], ['Pepperoni', 11.0], ['Cuatro Quesos', 12.5], ['Diavola', 11.8],
      ['Calzone Clásico', 10.9], ['Lasaña Boloñesa', 13.0],
    ],
  },
  {
    slug: 'sushi-sakura',
    name: 'Sushi Sakura',
    type: 'Japonesa',
    category: 'restaurante',
    description: 'Pescado fresco del día y arroz preparado al momento. Barra de sushi y delivery en Chacao.',
    hours: '12:00 PM - 10:30 PM',
    phone: '+584121110003',
    featured: false,
    products: [
      ['Roll California', 8.5], ['Roll Filadelfia', 9.2], ['Nigiri Salmón (2u)', 6.0],
      ['Sashimi Atún', 12.5], ['Tempura Roll', 10.0], ['Sopa Miso', 3.5], ['Gyozas (6u)', 7.0],
    ],
  },
  {
    slug: 'burger-house-ccs',
    name: 'Burger House CCS',
    type: 'Hamburguesas',
    category: 'comida rapida',
    description: 'Carne 100% de res molida en casa, pan brioche y papas rústicas. Smash burgers desde 2019.',
    hours: '11:00 AM - 12:00 AM',
    phone: '+584121110004',
    featured: true,
    products: [
      ['Clásica Doble', 8.9], ['BBQ Bacon', 10.5], ['Pollo Crispy', 8.2], ['Veggie Portobello', 7.9],
      ['Papas con Queso', 4.5], ['Malteada de Chocolate', 5.0],
    ],
  },
  {
    slug: 'pollos-el-fogon',
    name: 'Pollos El Fogón',
    type: 'Pollo a la Brasa',
    category: 'comida rapida',
    description: 'Pollo marinado 12 horas y asado a la brasa. Combos familiares con yuca y ensalada.',
    hours: '11:00 AM - 9:00 PM',
    phone: '+584121110005',
    featured: false,
    products: [
      ['Pollo Entero', 14.0], ['Medio Pollo', 7.5], ['Combo Familiar', 22.0],
      ['Yuca Frita', 3.2], ['Ensalada Rallada', 2.8], ['Refresco 1.5L', 2.5],
    ],
  },
  {
    slug: 'cafe-altamira',
    name: 'Café Altamira',
    type: 'Cafetería',
    category: 'cafeteria',
    description: 'Café de origen venezolano tostado cada semana. Espacio para trabajar con wifi y buena música.',
    hours: '6:30 AM - 8:00 PM',
    phone: '+584121110006',
    featured: true,
    products: [
      ['Espresso', 1.5], ['Cortado', 2.0], ['Latte', 2.8], ['Capuchino', 3.0],
      ['Cold Brew', 3.5], ['Croissant de Mantequilla', 2.6], ['Tequeños (5u)', 4.5],
    ],
  },
  {
    slug: 'tostadas-el-molino',
    name: 'Tostadas El Molino',
    type: 'Desayunos',
    category: 'cafeteria',
    description: 'Desayunos criollos servidos todo el día. Perico, empanadas y café guayoyo.',
    hours: '6:00 AM - 2:00 PM',
    phone: '+584121110007',
    featured: false,
    products: [
      ['Desayuno Criollo', 6.5], ['Perico con Arepa', 4.2], ['Empanada de Queso', 1.8],
      ['Empanada de Carne Mechada', 2.2], ['Café Guayoyo', 1.2], ['Batido de Lechosa', 2.5],
    ],
  },
  {
    slug: 'panaderia-la-espiga',
    name: 'Panadería La Espiga',
    type: 'Panadería',
    category: 'panaderia',
    description: 'Pan canilla recién horneado cada tres horas. Pastelería, charcutería y café al paso.',
    hours: '5:30 AM - 9:00 PM',
    phone: '+584121110008',
    featured: false,
    products: [
      ['Pan Canilla', 1.0], ['Pan Campesino', 2.5], ['Cachito de Jamón', 2.0],
      ['Golfeado con Queso', 2.4], ['Pastel de Pollo', 3.0], ['Torta de Auyama (porción)', 2.8],
    ],
  },
  {
    slug: 'dulceria-dona-carmen',
    name: 'Dulcería Doña Carmen',
    type: 'Repostería',
    category: 'postres',
    description: 'Tortas por encargo y dulces criollos. Quesillo, bienmesabe y torta negra de la abuela.',
    hours: '8:00 AM - 7:00 PM',
    phone: '+584121110009',
    featured: false,
    products: [
      ['Quesillo (porción)', 3.0], ['Bienmesabe', 3.5], ['Torta Tres Leches', 4.2],
      ['Marquesa de Chocolate', 3.8], ['Torta Negra (kg)', 18.0], ['Suspiros (12u)', 2.5],
    ],
  },
  {
    slug: 'heladeria-frescolita',
    name: 'Heladería Frescolita',
    type: 'Heladería',
    category: 'postres',
    description: 'Helados artesanales con frutas de temporada. Más de 30 sabores rotativos.',
    hours: '11:00 AM - 10:00 PM',
    phone: '+584121110010',
    featured: true,
    products: [
      ['Barquilla Simple', 2.0], ['Barquilla Doble', 3.2], ['Copa Sundae', 4.5],
      ['Helado de Parchita', 2.8], ['Tina 1L', 9.0], ['Milkshake de Fresa', 4.0],
    ],
  },
  {
    slug: 'farmacia-saludmax',
    name: 'Farmacia SaludMax',
    type: 'Farmacia',
    category: 'farmacia',
    description: 'Medicamentos, cuidado personal y tensiómetro gratis. Delivery en menos de una hora.',
    hours: '7:00 AM - 10:00 PM',
    phone: '+584121110011',
    featured: false,
    products: [
      ['Acetaminofén 500mg (20u)', 3.5], ['Ibuprofeno 400mg (20u)', 4.0], ['Alcohol Isopropílico', 2.5],
      ['Vitamina C 1000mg', 8.5], ['Gel Antibacterial 500ml', 3.2], ['Tensiómetro Digital', 32.0],
    ],
  },
  {
    slug: 'farmacia-los-palos',
    name: 'Farmacia Los Palos Grandes',
    type: 'Farmacia',
    category: 'farmacia',
    description: 'Atención farmacéutica las 24 horas. Convenios con los principales seguros del país.',
    hours: '24 horas',
    phone: '+584121110012',
    featured: false,
    products: [
      ['Omeprazol 20mg (14u)', 5.5], ['Loratadina 10mg (10u)', 3.0], ['Suero Fisiológico', 2.0],
      ['Protector Solar FPS50', 14.0], ['Termómetro Infrarrojo', 22.0], ['Mascarillas (50u)', 6.5],
    ],
  },
  {
    slug: 'super-el-trigal',
    name: 'Supermercado El Trigal',
    type: 'Supermercado',
    category: 'supermercado',
    description: 'Surtido completo de víveres, frutas y verduras frescas. Ofertas semanales.',
    hours: '7:00 AM - 9:00 PM',
    phone: '+584121110013',
    featured: true,
    products: [
      ['Harina de Maíz 1kg', 1.4], ['Arroz Blanco 1kg', 1.8], ['Aceite de Maíz 1L', 3.2],
      ['Café Molido 500g', 5.5], ['Queso Blanco (kg)', 7.0], ['Docena de Huevos', 3.6], ['Azúcar 1kg', 1.5],
    ],
  },
  {
    slug: 'minimarket-chacao',
    name: 'Minimarket 24/7 Chacao',
    type: 'Minimarket',
    category: 'supermercado',
    description: 'Abierto las 24 horas. Lo esencial cerca de casa, con delivery nocturno.',
    hours: '24 horas',
    phone: '+584121110014',
    featured: false,
    products: [
      ['Leche Completa 1L', 2.2], ['Pan de Sándwich', 2.8], ['Jamón de Pierna (kg)', 9.5],
      ['Refresco 2L', 2.4], ['Papas Fritas 150g', 2.0], ['Agua Mineral 5L', 3.0],
    ],
  },
  {
    slug: 'licoreria-el-barril',
    name: 'Licorería El Barril',
    type: 'Licores',
    category: 'licoreria',
    description: 'Rones venezolanos, cervezas artesanales y destilados importados. Hielo siempre disponible.',
    hours: '10:00 AM - 11:00 PM',
    phone: '+584121110015',
    featured: false,
    products: [
      ['Ron Añejo 750ml', 16.0], ['Cerveza Artesanal IPA', 3.5], ['Six Pack Nacional', 8.0],
      ['Whisky 12 años', 42.0], ['Vino Tinto Reserva', 14.5], ['Hielo 2kg', 1.8],
    ],
  },
  {
    slug: 'vinos-y-mas',
    name: 'Vinos y Más',
    type: 'Licores',
    category: 'licoreria',
    description: 'Cava climatizada con etiquetas de Argentina, Chile y España. Asesoría de sommelier.',
    hours: '11:00 AM - 9:00 PM',
    phone: '+584121110016',
    featured: false,
    products: [
      ['Malbec Mendoza', 18.0], ['Carménère Reserva', 16.5], ['Rioja Crianza', 21.0],
      ['Espumante Brut', 15.0], ['Set de Copas (2u)', 12.0], ['Sacacorchos Profesional', 9.0],
    ],
  },
  {
    slug: 'parrilla-el-budare',
    name: 'Parrilla El Budare',
    type: 'Parrilla',
    category: 'restaurante',
    description: 'Carnes a la parrilla al carbón, cortes argentinos y guarniciones criollas.',
    hours: '12:00 PM - 11:00 PM',
    phone: '+584121110017',
    featured: true,
    products: [
      ['Punta Trasera (400g)', 16.0], ['Churrasco', 18.5], ['Chorizo Parrillero', 5.0],
      ['Parrilla Mixta (2 personas)', 34.0], ['Yuca con Mojo', 4.0], ['Ensalada César', 6.5],
    ],
  },
  {
    slug: 'empanadas-la-costena',
    name: 'Empanadas La Costeña',
    type: 'Empanadas',
    category: 'comida rapida',
    description: 'Empanadas fritas al momento con relleno de la costa oriental. Salsas de la casa.',
    hours: '6:00 AM - 3:00 PM',
    phone: '+584121110018',
    featured: false,
    products: [
      ['Empanada de Cazón', 2.5], ['Empanada de Pabellón', 2.8], ['Empanada de Queso', 1.8],
      ['Empanada de Pollo', 2.2], ['Tequeños (6u)', 5.0], ['Jugo de Melón', 2.0],
    ],
  },
  {
    slug: 'jugos-vitamina',
    name: 'Jugos Naturales Vitamina',
    type: 'Jugos y Batidos',
    category: 'cafeteria',
    description: 'Jugos exprimidos al momento, sin azúcar añadida. Bowls de fruta y meriendas saludables.',
    hours: '7:00 AM - 7:00 PM',
    phone: '+584121110019',
    featured: false,
    products: [
      ['Jugo de Naranja 500ml', 3.0], ['Batido de Fresa', 3.5], ['Detox Verde', 4.0],
      ['Bowl de Açaí', 6.5], ['Ensalada de Frutas', 4.2], ['Merengada de Cambur', 3.8],
    ],
  },
  {
    slug: 'charcuteria-la-italiana',
    name: 'Charcutería La Italiana',
    type: 'Charcutería',
    category: 'supermercado',
    description: 'Quesos madurados, embutidos importados y pastas frescas hechas en casa.',
    hours: '8:00 AM - 7:00 PM',
    phone: '+584121110020',
    featured: false,
    products: [
      ['Jamón Serrano (100g)', 6.5], ['Queso Parmesano (200g)', 9.0], ['Mortadela Italiana (kg)', 8.5],
      ['Pasta Fresca Fettuccine', 4.5], ['Aceitunas Rellenas', 3.5], ['Salsa Pesto Artesanal', 5.0],
    ],
  },
];

const POST_CAPTIONS = [
  (b) => `Así se ve un día normal en ${b.name}. Te esperamos 👋`,
  (b) => `Recién salido. ${b.description.split('.')[0]}.`,
  (b) => `Nuestros clientes preguntan por esto todas las semanas 😍`,
  (b) => `Pedidos por delivery abiertos. Horario de hoy: ${b.hours}`,
  (b) => `Detrás de cámaras en ${b.name} 🎬`,
];

const POST_TITLES = ['Lo de hoy', 'Recomendado', 'Favorito de la casa', 'Nuevo en carta', 'Así lo hacemos'];

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const uuid = () => crypto.randomUUID();

async function cleanDemoData(client) {
  const { rows: users } = await client.query(
    `SELECT id FROM "User" WHERE email LIKE $1`,
    [`%@${DEMO_EMAIL_DOMAIN}`],
  );

  if (users.length === 0) return 0;

  const userIds = users.map((u) => u.id);

  const { rows: businesses } = await client.query(
    `SELECT id FROM "Business" WHERE "ownerId" = ANY($1::text[])`,
    [userIds],
  );
  const businessIds = businesses.map((b) => b.id);

  // Detach the self-references first so Business/Branch become deletable
  await client.query(
    `UPDATE "User" SET "currentBusinessId" = NULL, "currentBranchId" = NULL
     WHERE "currentBusinessId" = ANY($1::text[]) OR id = ANY($2::text[])`,
    [businessIds.length ? businessIds : [''], userIds],
  );

  if (businessIds.length) {
    await client.query(`DELETE FROM "Comment" WHERE "postId" IN (SELECT id FROM "Post" WHERE "businessId" = ANY($1::text[]))`, [businessIds]);
    await client.query(`DELETE FROM "OrderItem" WHERE "orderId" IN (SELECT id FROM "Order" WHERE "businessId" = ANY($1::text[]))`, [businessIds]);
    await client.query(`DELETE FROM "Order" WHERE "businessId" = ANY($1::text[])`, [businessIds]);
    await client.query(`DELETE FROM "Post" WHERE "businessId" = ANY($1::text[])`, [businessIds]);
    await client.query(`DELETE FROM "Story" WHERE "businessId" = ANY($1::text[])`, [businessIds]);
    await client.query(`DELETE FROM "Follow" WHERE "followingId" = ANY($1::text[])`, [businessIds]);
    await client.query(`DELETE FROM "UserInteraction" WHERE "businessId" = ANY($1::text[])`, [businessIds]);
    await client.query(`DELETE FROM "Favorite" WHERE "entityId" IN (SELECT id FROM "Product" WHERE "businessId" = ANY($1::text[]))`, [businessIds]);
    await client.query(`DELETE FROM "Product" WHERE "businessId" = ANY($1::text[])`, [businessIds]);
    await client.query(`DELETE FROM "Category" WHERE "businessId" = ANY($1::text[])`, [businessIds]);
    await client.query(`DELETE FROM "Branch" WHERE "businessId" = ANY($1::text[])`, [businessIds]);
    await client.query(`DELETE FROM "Business" WHERE id = ANY($1::text[])`, [businessIds]);
  }

  await client.query(`DELETE FROM "Comment" WHERE "userId" = ANY($1::text[])`, [userIds]);
  await client.query(`DELETE FROM "Favorite" WHERE "userId" = ANY($1::text[])`, [userIds]);
  await client.query(`DELETE FROM "UserInteraction" WHERE "userId" = ANY($1::text[])`, [userIds]);
  await client.query(`DELETE FROM "Address" WHERE "userId" = ANY($1::text[])`, [userIds]);
  await client.query(`DELETE FROM "Post" WHERE "userId" = ANY($1::text[])`, [userIds]);
  await client.query(`DELETE FROM "User" WHERE id = ANY($1::text[])`, [userIds]);

  return users.length;
}

async function seedBusiness(client, spec, index, passwordHash) {
  const now = new Date();

  // --- owner ---
  const userId = uuid();
  const email = `${spec.slug}@${DEMO_EMAIL_DOMAIN}`;
  await client.query(
    `INSERT INTO "User" (id, email, password, "displayName", "firstName", "lastName", phone,
       "avatarUrl", "userTypes", "currentUserType", "createdAt", "updatedAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$11)`,
    [
      userId, email, passwordHash, spec.name, spec.name.split(' ')[0], 'Demo', spec.phone,
      photo(`${spec.slug}-avatar`, 400),
      JSON.stringify({ client: { status: 'active' }, business: { status: 'active' } }),
      'business', now,
    ],
  );

  // --- business ---
  const businessId = uuid();
  await client.query(
    `INSERT INTO "Business" (id, "ownerId", "businessName", "businessType", category, description,
       "businessHours", "isActive", "isVerified", "isFeatured", "followersCount", "viewCount",
       rating, "reviewsCount", "logoUrl", "bannerUrl", status, "createdAt", "updatedAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7,true,$8,$9,$10,$11,$12,$13,$14,$15,'active',$16,$16)`,
    [
      businessId, userId, spec.name, spec.type, spec.category, spec.description, spec.hours,
      index % 3 === 0, spec.featured,
      40 + ((index * 37) % 260), 120 + ((index * 91) % 900),
      (3.8 + ((index * 7) % 12) / 10).toFixed(2), 8 + ((index * 13) % 90),
      photo(`${spec.slug}-logo`, 400), wide(`${spec.slug}-banner`), now,
    ],
  );

  // --- main branch ---
  const branchId = uuid();
  const lat = (BASE_LAT + (((index * 17) % 100) - 50) / 1000).toFixed(6);
  const lon = (BASE_LON + (((index * 23) % 100) - 50) / 1000).toFixed(6);
  const street = `Av. Principal #${100 + index}, Caracas`;
  await client.query(
    `INSERT INTO "Branch" (id, "businessId", name, "isMain", "isActive", address, latitude, longitude,
       phone, status, "createdAt", "updatedAt")
     VALUES ($1,$2,'Sede Principal',true,true,$3,$4,$5,$6,'active',$7,$7)`,
    [
      branchId, businessId,
      JSON.stringify({ street, coordinates: { latitude: Number(lat), longitude: Number(lon) } }),
      lat, lon, spec.phone, now,
    ],
  );

  await client.query(
    `UPDATE "User" SET "currentBusinessId" = $1, "currentBranchId" = $2 WHERE id = $3`,
    [businessId, branchId, userId],
  );

  // --- product category + products ---
  const categoryId = uuid();
  await client.query(
    `INSERT INTO "Category" (id, "businessId", name, "iconUrl", "productCount") VALUES ($1,$2,$3,$4,$5)`,
    [categoryId, businessId, 'Destacados', photo(`${spec.slug}-cat`, 200), spec.products.length],
  );

  const productIds = [];
  for (let i = 0; i < spec.products.length; i++) {
    const [pname, price] = spec.products[i];
    const productId = uuid();
    productIds.push({ id: productId, name: pname, price });
    const thumb = photo(`${spec.slug}-prod${i}`, 800);
    const onSale = i % 4 === 0;
    await client.query(
      `INSERT INTO "Product" (id, "businessId", "categoryId", name, description, price, "discountPrice",
         currency, "isDiscountActive", "hasVariants", "thumbnailUrl", images, "isActive", "isAvailable",
         "isFeatured", "viewCount", "favoriteCount", "orderCount", rating, "reviewCount", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,'USD',$8,false,$9,$10,true,$11,$12,$13,$14,$15,$16,$17,$18,$18)`,
      [
        productId, businessId, categoryId, pname,
        `${pname} de ${spec.name}. Preparado el mismo día.`,
        price.toFixed(2), onSale ? (price * 0.85).toFixed(2) : null, onSale,
        thumb, JSON.stringify([thumb, photo(`${spec.slug}-prod${i}-b`, 800)]),
        i % 7 !== 0, i < 2,
        20 + ((i * 31) % 400), (i * 5) % 40, (i * 11) % 120,
        (4.0 + ((i * 3) % 10) / 10).toFixed(2), 3 + ((i * 7) % 40), now,
      ],
    );
  }

  // --- posts: 4 photos + 1 video ---
  const postIds = [];
  for (let i = 0; i < 4; i++) {
    const postId = uuid();
    const url = photo(`${spec.slug}-post${i}`, 1080);
    // Tag a couple of real products so the tagged-products sheet has content
    const tagged = productIds.slice(i, i + 2).map((p) => ({
      productId: p.id,
      name: p.name,
      price: String(p.price),
      mediaIndex: 0,
      thumbnailUrl: photo(`${spec.slug}-prod${productIds.indexOf(p)}`, 800),
    }));
    const publishedAt = new Date(now.getTime() - (index * 5 + i) * 3600 * 1000);

    await client.query(
      `INSERT INTO "Post" (id, "businessId", "userId", type, title, caption, media, "thumbnailUrl",
         "isActive", "isPublished", "isPinned", "likeCount", "commentCount", "shareCount", "viewCount",
         "saveCount", keywords, "taggedProducts", "publishedAt", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,'image',$4,$5,$6,$7,true,true,$8,$9,0,$10,$11,$12,$13,$14,$15,$15,$15)`,
      [
        postId, businessId, userId, POST_TITLES[i % POST_TITLES.length], POST_CAPTIONS[i % POST_CAPTIONS.length](spec),
        JSON.stringify([{ url, type: 'image' }]), url,
        i === 0,
        5 + ((index * 13 + i * 29) % 180), (i * 3) % 25, 60 + ((index * 7 + i * 41) % 900), (i * 4) % 30,
        JSON.stringify([spec.category, spec.type.toLowerCase()]),
        JSON.stringify(tagged), publishedAt,
      ],
    );
    postIds.push(postId);
  }

  const videoPostId = uuid();
  const videoUrl = VIDEO_POOL[index % VIDEO_POOL.length];
  const videoThumb = photo(`${spec.slug}-video`, 1080);
  const videoPublishedAt = new Date(now.getTime() - index * 5 * 3600 * 1000 - 1800 * 1000);
  await client.query(
    `INSERT INTO "Post" (id, "businessId", "userId", type, title, caption, media, "thumbnailUrl",
       "isActive", "isPublished", "isPinned", "likeCount", "commentCount", "shareCount", "viewCount",
       "saveCount", keywords, "taggedProducts", "publishedAt", "createdAt", "updatedAt")
     VALUES ($1,$2,$3,'video',$4,$5,$6,$7,true,true,false,$8,0,$9,$10,$11,$12,$13,$14,$14,$14)`,
    [
      videoPostId, businessId, userId, 'Detrás de cámaras', POST_CAPTIONS[4](spec),
      JSON.stringify([{ url: videoUrl, type: 'video', thumbnailUrl: videoThumb }]), videoThumb,
      30 + ((index * 53) % 400), 120 + ((index * 17) % 300), 400 + ((index * 71) % 4000), (index * 9) % 60,
      JSON.stringify([spec.category, 'video']),
      JSON.stringify(productIds.slice(0, 2).map((p, i2) => ({
        productId: p.id, name: p.name, price: String(p.price), mediaIndex: 0,
        thumbnailUrl: photo(`${spec.slug}-prod${i2}`, 800),
      }))),
      videoPublishedAt,
    ],
  );
  postIds.push(videoPostId);

  return { userId, businessId, email, posts: postIds.length, products: productIds.length };
}

async function main() {
  const cleanOnly = process.argv.includes('--clean');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const removed = await cleanDemoData(client);
    if (removed > 0) console.log(`🧹 Datos demo previos eliminados (${removed} cuentas)`);

    if (cleanOnly) {
      await client.query('COMMIT');
      console.log('✅ Limpieza completa. No se sembró nada nuevo.');
      return;
    }

    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

    let totalPosts = 0;
    let totalProducts = 0;
    for (let i = 0; i < BUSINESSES.length; i++) {
      const result = await seedBusiness(client, BUSINESSES[i], i, passwordHash);
      totalPosts += result.posts;
      totalProducts += result.products;
      console.log(`  ✓ ${String(i + 1).padStart(2)}. ${BUSINESSES[i].name}  (${result.products} productos, ${result.posts} posts)`);
    }

    await client.query('COMMIT');

    console.log('');
    console.log('✅ Datos demo creados');
    console.log(`   Negocios : ${BUSINESSES.length}`);
    console.log(`   Posts    : ${totalPosts}  (${BUSINESSES.length * 4} fotos + ${BUSINESSES.length} videos)`);
    console.log(`   Productos: ${totalProducts}`);
    console.log('');
    console.log(`   Login de cualquier negocio: <slug>@${DEMO_EMAIL_DOMAIN} / ${DEMO_PASSWORD}`);
    console.log(`   Ej: ${BUSINESSES[0].slug}@${DEMO_EMAIL_DOMAIN}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Falló el seed, se revirtió todo:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
