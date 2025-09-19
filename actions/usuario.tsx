'use server';

import { Pool } from 'pg';
import { Usuario } from '@/src/models.tsx';
import pool  from '@/src/db.ts';
import { revalidatePath } from 'next/cache'
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const ITEMS_PER_PAGE = 20;


const CreateUserSchema = z.object({
  nome: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
  senha: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
  admin: z.preprocess(val => val === 'on', z.boolean()), // Converte 'on'/'off' do checkbox
});

// Esquema para atualizar (senha é opcional)
const UpdateUserSchema = z.object({
  id: z.string(),
  nome: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
  senha: z.string().optional(), // Senha é opcional
  admin: z.preprocess(val => val === 'on', z.boolean()),
});


// Tipagem para o estado do formulário
export interface FormState {
  message: string;
  errors?: { [key: string]: string[] | undefined };
  success: boolean;
}



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
      ORDER BY nome ASC
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



export async function createUser(prevState: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = CreateUserSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { success: false, message: 'Erro de validação.', errors: validatedFields.error.flatten().fieldErrors };
  }
  const { nome, email, senha, admin } = validatedFields.data;

  try {
    // Verifica se o email já existe
    const existingUser = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (existingUser.rowCount > 0) {
      return { success: false, message: 'Este e-mail já está em uso.', errors: { email: ['E-mail já cadastrado.'] } };
    }

    const hashedPassword = await bcrypt.hash(senha, 10);
    
    await pool.query(
      'INSERT INTO usuarios (nome, email, senha, admin, created_at) VALUES ($1, $2, $3, $4, NOW())',
      [nome, email, hashedPassword, admin]
    );

    revalidatePath('/admin/usuarios');
    return { success: true, message: 'Usuário criado com sucesso!' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Erro de banco de dados.' };
  }
}


export async function updateUser(prevState: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = UpdateUserSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { success: false, message: 'Erro de validação.', errors: validatedFields.error.flatten().fieldErrors };
  }
  const { id, nome, email, senha, admin } = validatedFields.data;

  try {
    let hashedPassword = null;
    if (senha && senha.length >= 6) {
      hashedPassword = await bcrypt.hash(senha, 10);
    }
    
    // Query dinâmica: só atualiza a senha se uma nova for fornecida
    const queryText = hashedPassword
      ? 'UPDATE usuarios SET nome = $1, email = $2, admin = $3, senha = $4 WHERE id = $5'
      : 'UPDATE usuarios SET nome = $1, email = $2, admin = $3 WHERE id = $4';
      
    const queryParams = hashedPassword
      ? [nome, email, admin, hashedPassword, id]
      : [nome, email, admin, id];

    await pool.query(queryText, queryParams);    
    revalidatePath('/admin/usuarios');
    return { success: true, message: 'Usuário atualizado com sucesso!' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Erro de banco de dados.' };
  }
}