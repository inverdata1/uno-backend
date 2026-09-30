/**
 * Copies the loose photos from a source folder into the layout the demo seeder
 * reads: uploads/demo/<slug>/{logo,banner,post-N,prod-NN}.<ext>
 *
 *   node scripts/organize-demo-media.js "C:/ruta/a/las/fotos"
 *   node scripts/organize-demo-media.js "/ruta" --dry    solo muestra el plan
 *
 * Which file belongs to which business lives in demo-media-map.js. A business
 * usually has fewer photos than slots, so its photos are cycled, offset between
 * posts and products so the same shot does not land in both at the same index.
 *
 * Slots with no photo are simply not written, and the seeder falls back to a
 * generic CDN image for them. That makes the folder safe to fill in gradually:
 * add files, re-run this, re-run the seeder.
 */

const fs = require('fs');
const path = require('path');
const { BUSINESSES } = require('./seed-demo-data');
const MEDIA_MAP = require('./demo-media-map');

const DEST_ROOT = path.join(process.cwd(), 'uploads', 'demo');

function copy(srcDir, file, destDir, basename, dryRun) {
  const ext = path.extname(file).toLowerCase().replace('.jpeg', '.jpg');
  const dest = path.join(destDir, `${basename}${ext}`);
  if (!dryRun) {
    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(path.join(srcDir, file), dest);
  }
  return `${basename}${ext}`;
}

function main() {
  const srcDir = process.argv[2];
  const dryRun = process.argv.includes('--dry');

  if (!srcDir) {
    console.error('Uso: node scripts/organize-demo-media.js "<carpeta con las fotos>" [--dry]');
    process.exit(1);
  }
  if (!fs.existsSync(srcDir)) {
    console.error(`No existe la carpeta: ${srcDir}`);
    process.exit(1);
  }

  const available = new Set(fs.readdirSync(srcDir));
  const missingFiles = [];
  let copied = 0;
  const gaps = [];

  for (const spec of BUSINESSES) {
    const entry = MEDIA_MAP[spec.slug] || {};
    const destDir = path.join(DEST_ROOT, spec.slug);

    // Drop anything the map names but the folder does not actually have
    const photos = (entry.photos || []).filter((f) => {
      if (available.has(f)) return true;
      missingFiles.push(`${spec.slug}: ${f}`);
      return false;
    });

    const slots = [];

    if (entry.logo && available.has(entry.logo)) {
      slots.push(copy(srcDir, entry.logo, destDir, 'logo', dryRun));
    } else if (entry.logo) {
      missingFiles.push(`${spec.slug}: ${entry.logo}`);
    }

    if (entry.banner && available.has(entry.banner)) {
      slots.push(copy(srcDir, entry.banner, destDir, 'banner', dryRun));
    }

    if (photos.length > 0) {
      for (let i = 0; i < 4; i++) {
        slots.push(copy(srcDir, photos[i % photos.length], destDir, `post-${i + 1}`, dryRun));
      }
      for (let i = 0; i < spec.products.length; i++) {
        // Offset by one so prod-01 is not the same shot as post-1
        const pick = photos[(i + 1) % photos.length];
        slots.push(copy(srcDir, pick, destDir, `prod-${String(i + 1).padStart(2, '0')}`, dryRun));
      }
    }

    copied += slots.length;

    const flags = [];
    if (!entry.logo || !available.has(entry.logo)) flags.push('sin logo');
    if (photos.length === 0) flags.push('SIN FOTOS -> Picsum');
    else if (photos.length < 4) flags.push(`${photos.length} foto(s), se repiten`);
    if (flags.length) gaps.push(`${spec.slug}: ${flags.join(', ')}`);

    console.log(
      `${photos.length === 0 ? '·' : '✓'} ${spec.slug.padEnd(26)} ${String(slots.length).padStart(2)} archivos` +
      (flags.length ? `   (${flags.join(', ')})` : ''),
    );
  }

  console.log('');
  console.log(dryRun ? '— simulación, no se copió nada —' : `Copiados ${copied} archivos a uploads/demo/`);

  if (missingFiles.length) {
    console.log(`\n⚠ ${missingFiles.length} archivo(s) del mapa no están en la carpeta:`);
    missingFiles.forEach((m) => console.log(`   ${m}`));
  }

  if (gaps.length) {
    console.log(`\nPendientes (${gaps.length} negocios):`);
    gaps.forEach((g) => console.log(`   ${g}`));
  }
}

main();
