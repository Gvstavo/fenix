'use server';

import { Pool } from 'pg';
import { Usuario } from '@/src/models.tsx';
import pool  from '@/src/db.ts';
import { revalidatePath } from 'next/cache'
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



export async function deleteUser(id: int){
  // Validação simples para garantir que o ID não está vazio
  if (!id) {
    return { success: false, message: 'ID do usuário é inválido.' };
  }

  try {
    
    const deleteQuery = 'DELETE FROM usuarios WHERE id = $1';
    
    await pool.query(deleteQuery, [id]);
    revalidatePath('/admin/usuarios');

    return { success: true, message: 'Usuário deletado com sucesso.' };
  } catch (error) {
    console.error('Erro de banco de dados ao deletar usuário:', error);
    return { success: false, message: 'Falha ao deletar o usuário.' };
  }
}