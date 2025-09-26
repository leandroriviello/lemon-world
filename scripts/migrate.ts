import { query, SQL_SCHEMA } from '../src/lib/db';

async function main() {
  try {
    await query(SQL_SCHEMA);
    console.log('✅ Migración aplicada: tablas users y sessions listas.');
  } catch (e) {
    console.error('❌ Error aplicando la migración:', e);
    process.exitCode = 1;
  }
}

main();

