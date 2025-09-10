import { Pool } from 'pg';

// Declaração para estender o tipo global do Node.js e adicionar nossa
// propriedade 'pool' para armazenar a conexão. Isso é necessário para o TypeScript.
declare global {
  // eslint-disable-next-line no-var
  var pool: Pool | undefined;
}

// Esta função cria e retorna uma única instância do pool de conexões.
// Em desenvolvimento, o 'globalThis' é usado para persistir a variável
// entre as recargas do hot-reloading, evitando criar múltiplos pools.
const pool =
  globalThis.pool ||
  new Pool({
    // É recomendado usar uma URL de conexão se disponível (ex: no Vercel).
    connectionString: process.env.DATABASE_URL,
    // Em produção, especialmente em ambientes serverless, você pode precisar
    // de configurações de SSL.
    ssl:
      process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.pool = pool;
}

export default pool;