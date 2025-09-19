'use server';

import { Pool } from 'pg';
import { Artista } from '@/src/models.tsx';
import pool  from '@/src/db.ts';
import { revalidatePath } from 'next/cache'
import { z } from 'zod';
import slug from 'slug'

const ITEMS_PER_PAGE = 20;


const CreateArtistSchema = z.object({
  nome: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
});

// Esquema para atualizar (senha é opcional)
const UpdateArtistSchema = z.object({
  id: z.string(),
  nome: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
});


// Tipagem para o estado do formulário
export interface FormState {
  message: string;
  errors?: { [key: string]: string[] | undefined };
  success: boolean;
}



export async function fetchArtistsByPage(page: number): Promise<{ 
  artists: Artista[]; 
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
        slug,
        COUNT(*) OVER() AS total_count
      FROM artistas
      ORDER BY nome ASC
      LIMIT $1 OFFSET $2;
    `;

    const result = await pool.query(query, [ITEMS_PER_PAGE, offset]);


    const artists = result.rows as Artista[];

    const totalCount = parseInt(result.rows[0]?.total_count || '0', 0);


    return { artists, totalCount };

  } catch (error) {
    return {
      artists: [],
      totalCount: 0,
    };
  }
}



export async function deleteArtist(id: int){
  // Validação simples para garantir que o ID não está vazio
  if (!id) {
    return { success: false, message: 'ID do artista é inválido.' };
  }

  try {
    
    const deleteQuery = 'DELETE FROM artistas WHERE id = $1';
    
    await pool.query(deleteQuery, [id]);
    revalidatePath('/admin/artistas');

    return { success: true, message: 'Artista deletado com sucesso.' };
  } catch (error) {
    console.error('Erro de banco de dados ao deletar artista:', error);
    return { success: false, message: 'Falha ao deletar o artista.' };
  }
}



export async function createArtista(prevState: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = CreateArtistSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { success: false, message: 'Erro de validação.', errors: validatedFields.error.flatten().fieldErrors };
  }
  const { nome } = validatedFields.data;

  try {

    
    await pool.query(
      'INSERT INTO artistas (nome, slug) VALUES ($1, $2)',
      [nome, slug(nome)]
    );

    revalidatePath('/admin/artistas');
    return { success: true, message: 'Artista criado com sucesso!' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Erro de banco de dados.' };
  }
}


export async function updateArtista(prevState: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = UpdateArtistSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { success: false, message: 'Erro de validação.', errors: validatedFields.error.flatten().fieldErrors };
  }
  const { nome, id } = validatedFields.data;

  try {

    
    // Query dinâmica: só atualiza a senha se uma nova for fornecida
    const queryText =   'UPDATE artistas SET nome = $1, slug = $2 WHERE id = $3';
      
    const queryParams =  [nome, slug(nome), id];

    await pool.query(queryText, queryParams);    
    revalidatePath('/admin/artistas');
    return { success: true, message: 'Artista atualizado com sucesso!' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Erro de banco de dados.' };
  }
}