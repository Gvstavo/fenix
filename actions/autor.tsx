'use server';

import { Pool } from 'pg';
import { Autor } from '@/src/models.tsx';
import pool  from '@/src/db.ts';
import { revalidatePath } from 'next/cache'
import { z } from 'zod';
import slug from 'slug'

const ITEMS_PER_PAGE = 20;


const CreateAutorSchema = z.object({
  nome: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
});

// Esquema para atualizar (senha é opcional)
const UpdateAutorSchema = z.object({
  id: z.string(),
  nome: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
});


// Tipagem para o estado do formulário
export interface FormState {
  message: string;
  errors?: { [key: string]: string[] | undefined };
  success: boolean;
}



export async function fetchAutoresByPage(page: number,query: string = ''): Promise<{ 
  autores: Autor[]; 
  totalCount: number; 
}> {
  // Garante que o número da página seja pelo menos 1
  const currentPage = Math.max(page, 1);
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  const searchQuery = `%${query}%`;

  try {
    
    // A query utiliza LIMIT e OFFSET para paginação e COUNT(*) OVER()
    // para obter o número total de registros sem fazer uma segunda consulta.
    const query = `
      SELECT
        id,
        nome,
        slug,
        COUNT(*) OVER() AS total_count
      FROM autores
      WHERE nome ILIKE $1
      ORDER BY nome ASC
      LIMIT $2 OFFSET $3;
    `;

    const result = await pool.query(query, [searchQuery,ITEMS_PER_PAGE, offset]);


    const autores = result.rows as Autor[];

    const totalCount = parseInt(result.rows[0]?.total_count || '0', 0);


    return { autores, totalCount };

  } catch (error) {
    return {
      autores: [],
      totalCount: 0,
    };
  }
}



export async function deleteAutor(id: int){
  // Validação simples para garantir que o ID não está vazio
  if (!id) {
    return { success: false, message: 'ID do autor é inválido.' };
  }

  try {
    
    const deleteQuery = 'DELETE FROM autores WHERE id = $1';
    
    await pool.query(deleteQuery, [id]);
    revalidatePath('/admin/autores');

    return { success: true, message: 'Autor deletado com sucesso.' };
  } catch (error) {
    console.error('Erro de banco de dados ao deletar autor:', error);
    return { success: false, message: 'Falha ao deletar o autor.' };
  }
}



export async function createAutor(prevState: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = CreateAutorSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { success: false, message: 'Erro de validação.', errors: validatedFields.error.flatten().fieldErrors };
  }
  const { nome } = validatedFields.data;

  try {

    
    await pool.query(
      'INSERT INTO autores (nome, slug) VALUES ($1, $2)',
      [nome, slug(nome)]
    );

    revalidatePath('/admin/autores');
    return { success: true, message: 'Autor criado com sucesso!' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Erro de banco de dados.' };
  }
}


export async function updateAutor(prevState: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = UpdateAutorSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { success: false, message: 'Erro de validação.', errors: validatedFields.error.flatten().fieldErrors };
  }
  const { nome, id } = validatedFields.data;

  try {

    
    // Query dinâmica: só atualiza a senha se uma nova for fornecida
    const queryText =   'UPDATE autores SET nome = $1, slug = $2 WHERE id = $3';
      
    const queryParams =  [nome, slug(nome), id];

    await pool.query(queryText, queryParams);    
    revalidatePath('/admin/autores');
    return { success: true, message: 'Autor atualizado com sucesso!' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Erro de banco de dados.' };
  }
}