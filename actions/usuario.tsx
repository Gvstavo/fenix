'use server';

import { Pool } from 'pg';
import { Usuario } from '@/src/models.tsx';
import pool  from '@/src/db.ts';
const ITEMS_PER_PAGE = 20;

export async function fetchUsersByPage(page: number): Promise<{ 
  users: Usuario[]; 
  totalCount: number; 
}> {
  // Garante que o número da página seja pelo menos 1
  const currentPage = Math.max(page, 1);
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    
    // A query utiliza LIMIT e OFFSET para paginação e COUNT(*) OVER()
    // para obter o número total de registros sem fazer uma segunda consulta.
    const query = `
      SELECT
        id,
        nome,
        email,
        url,
        admin,
        created_at,
        COUNT(*) OVER() AS total_count
      FROM usuarios
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2;
    `;

    const result = await pool.query(query, [ITEMS_PER_PAGE, offset]);


    const users = result.rows as Usuario[];

    const totalCount = parseInt(result.rows[0]?.total_count || '0', 0);


    return { users, totalCount };

  } catch (error) {
    return {
      users: [],
      totalCount: 0,
    };
  }
}