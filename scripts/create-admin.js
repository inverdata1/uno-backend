/**
 * Create a super user (or promote an existing one) for the admin dashboard.
 *
 *   node scripts/create-admin.js admin@ejemplo.com
 *
 * The password is asked for in the terminal and never echoed, so it does not
 * end up in the shell history or in the repository. It is stored hashed with
 * bcrypt, like every other account. Running it again for the same email
 * resets that account's password and keeps the admin role.
 */
require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const readline = require('readline');

const askHidden = (question) =>
  new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    // Swallow the typed characters instead of echoing them
    rl._writeToOutput = (text) => {
      if (text.includes(question)) rl.output.write(text);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
  });

async function main() {
  const email = (process.argv[2] || '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    console.error('Uso: node scripts/create-admin.js <correo>');
    process.exit(1);
  }

  const password = await askHidden('Contraseña del superusuario: ');
  if (password.length < 8) {
    console.error('La contraseña debe tener al menos 8 caracteres.');
    process.exit(1);
  }
  const confirm = await askHidden('Repite la contraseña: ');
  if (confirm !== password) {
    console.error('Las contraseñas no coinciden.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL.replace(/\?.*$/, '') });
  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query('SELECT id FROM "User" WHERE lower(email) = $1', [email]);

    if (rows.length) {
      await pool.query(
        `UPDATE "User" SET role = 'admin', password = $1, "updatedAt" = now() WHERE id = $2`,
        [hash, rows[0].id],
      );
      console.log(`✅ ${email} ahora es superusuario (contraseña actualizada).`);
    } else {
      await pool.query(
        `INSERT INTO "User" (id, email, password, "displayName", role, "currentUserType", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, 'Administrador', 'admin', 'client', now(), now())`,
        [crypto.randomUUID(), email, hash],
      );
      console.log(`✅ Superusuario creado: ${email}`);
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('❌ No se pudo crear el superusuario:', error.message);
  process.exit(1);
});
