import { query } from '../src/lib/db';

async function main() {
  try {
    const res = await query<{ now: string }>('SELECT NOW() as now');
    const now = res.rows?.[0]?.now ?? 'unknown';
    console.log(`✅ Conectado a la DB: ${now}`);
  } catch (e) {
    console.error('❌ Error conectando a la DB:', e);
    process.exitCode = 1;
  }
}

main();

