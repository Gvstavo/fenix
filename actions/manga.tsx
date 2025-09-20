'use server';

import { Pool } from 'pg';
import { Manga } from '@/src/models.tsx';
import pool  from '@/src/db.ts';
import { revalidatePath } from 'next/cache'
import { z } from 'zod';
import slug from 'slug';
import minioClient from '@/src/minio.ts';
const ITEMS_PER_PAGE = 20;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_IMAGE_TYPES = ["image/webp"];

const stringToArrayNonEmpty = z.string()
  .transform(val => val ? val.split(',').filter(Boolean).map(x => parseInt(x)) : [])
  .refine(arr => arr.length > 0, {
    message: 'Pelo menos uma opção deve ser selecionada.',
  });

const CreateMangaSchema = z.object({
  titulo: z.string().min(3, { message: "O título deve ter pelo menos 3 caracteres." }),
  ano: z.coerce.number().int().positive({ message: "Por favor, insira um ano válido." }),
  sinopse: z.string().optional(),
  thumbnail: z
    .any()
    .refine((file) => file instanceof File && file.size > 0, "A imagem da thumbnail é obrigatória.")
    .refine((file) => ACCEPTED_IMAGE_TYPES.includes(file?.type), "Apenas o formato .webp é suportado.")
    .refine((file) => file?.size <= MAX_FILE_SIZE, `O tamanho máximo da imagem é 10MB.`),
  autores: stringToArrayNonEmpty,
  artistas: stringToArrayNonEmpty,
  generos: stringToArrayNonEmpty,
  adulto: z.preprocess(val => val === 'on', z.boolean()),
  finalizado: z.preprocess(val => val === 'on', z.boolean()),
});

const UpdateMangaSchema = z.object({
  id: z.string().min(1, { message: "ID do mangá é inválido." }), // O ID é obrigatório
  titulo: z.string().min(3, { message: "O título deve ter pelo menos 3 caracteres." }),
  ano: z.coerce.number().int().positive({ message: "Por favor, insira um ano válido." }),
  sinopse: z.string().optional(),
  // A thumbnail é opcional na atualização. Validamos apenas se um novo arquivo for enviado.
  thumbnail: z
    .any()
    .optional()
    .refine((file) => !file || file.size === 0 || file instanceof File, "Arquivo inválido.")
    .refine((file) => !file || file.size === 0 || ACCEPTED_IMAGE_TYPES.includes(file?.type), "Apenas o formato .webp é suportado.")
    .refine((file) => !file || file.size === 0 || file?.size <= MAX_FILE_SIZE, `O tamanho máximo da imagem é 10MB.`),
  autores: stringToArrayNonEmpty,
  artistas: stringToArrayNonEmpty,
  generos: stringToArrayNonEmpty,
  adulto: z.preprocess(val => val === 'on', z.boolean()),
  finalizado: z.preprocess(val => val === 'on', z.boolean()),
});
const CreateGeneroSchema = z.object({
  nome: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
});

// Esquema para atualizar (senha é opcional)
const UpdateGeneroSchema = z.object({
  id: z.string(),
  nome: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
});


// Tipagem para o estado do formulário
export interface FormState {
  message: string;
  errors?: { [key: string]: string[] | undefined };
  success: boolean;
}



export async function fetchMangasByPage(page: number,query: string = ''): Promise<{ 
  generos: Manga[]; 
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
  mangas.id,
  mangas.titulo,
  mangas.slug,
  mangas.views,
  mangas.created_at,
  mangas.updated_at,
  mangas.sinopse,
  mangas.ano,
  mangas.created_by,
  mangas.thumbnail,
  mangas.adulto,
  mangas.finalizado,
  COALESCE(ARRAY_AGG(DISTINCT ma.autor_id), '{}') AS autores,
  COALESCE(ARRAY_AGG(DISTINCT mar.artista_id), '{}') AS artistas,
  COALESCE(ARRAY_AGG(DISTINCT mg.genero_id), '{}') AS generos,
  COUNT(*) OVER() AS total_count
FROM
  mangas
LEFT JOIN
  manga_autores ma ON mangas.id = ma.manga_id
LEFT JOIN
  manga_artistas mar ON mangas.id = mar.manga_id
LEFT JOIN
  manga_generos mg ON mangas.id = mg.manga_id
WHERE
  mangas.titulo ILIKE $1
GROUP BY
  mangas.id 
ORDER BY
  mangas.titulo ASC
LIMIT $2 OFFSET $3;
    `;

    const result = await pool.query(query, [searchQuery,ITEMS_PER_PAGE, offset]);


    const mangas = result.rows as Autor[];

    const totalCount = parseInt(result.rows[0]?.total_count || '0', 0);


    return { mangas, totalCount };

  } catch (error) {
    return {
      mangas: [],
      totalCount: 0,
    };
  }
}



export async function deleteManga(id: int){
  // Validação simples para garantir que o ID não está vazio
  if (!id) {
    return { success: false, message: 'ID do manga é inválido.' };
  }

  try {
    
    const deleteQuery = 'DELETE FROM mangas WHERE id = $1';
    
    await pool.query(deleteQuery, [id]);
    revalidatePath('/admin/mangas');

    return { success: true, message: 'manga deletado com sucesso.' };
  } catch (error) {
    console.error('Erro de banco de dados ao deletar manga:', error);
    return { success: false, message: 'Falha ao deletar o manga.' };
  }
}



export async function createManga(prevState: FormState, formData: FormData): Promise<FormState> {

  const validatedFields = CreateMangaSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { success: false, message: 'Erro de validação.', errors: validatedFields.error.flatten().fieldErrors };
  }
  
  const { titulo, ano, sinopse, adulto, finalizado, thumbnail, autores, artistas, generos } = validatedFields.data;


  try {
    await pool.query('BEGIN');

    const mangaInsertQuery = `
      INSERT INTO mangas (titulo, ano, sinopse, adulto, finalizado,slug,views,created_at,updated_at) 
      VALUES ($1, $2, $3, $4, $5,$6,0,NOW(),NOW()) 
      RETURNING id;
    `;
    const mangaResult = await pool.query(mangaInsertQuery, [titulo, ano, sinopse, adulto, finalizado,slug(titulo)]);
    const newMangaId = mangaResult.rows[0].id;

    // 4. Inserir nas tabelas de relacionamento
    for (const autorId of autores) {
      await pool.query('INSERT INTO manga_autores (manga_id, autor_id) VALUES ($1, $2)', [newMangaId, autorId]);
    }
    for (const artistaId of artistas) {
      await pool.query('INSERT INTO manga_artistas (manga_id, artista_id) VALUES ($1, $2)', [newMangaId, artistaId]);
    }
    for (const generoId of generos) {
      await pool.query('INSERT INTO manga_generos (manga_id, genero_id) VALUES ($1, $2)', [newMangaId, generoId]);
    }

    // 5. Fazer o upload da thumbnail para o MinIO
    const fileBuffer = Buffer.from(await thumbnail.arrayBuffer());
    const objectKey = `${newMangaId}/thumbnail.webp`; // Estrutura de arquivo organizada
    
    await minioClient.putObject('mangas', objectKey, fileBuffer, {
      'Content-Type': thumbnail.type,
    });
    
    // 6. Atualizar o registro do mangá com o caminho da thumbnail
    await pool.query('UPDATE mangas SET thumbnail = $1 WHERE id = $2', [objectKey, newMangaId]);

    // 7. Confirmar a Transação
    await pool.query('COMMIT');

    revalidatePath('/admin/mangas'); // Ajuste o caminho se necessário
    return { success: true, message: 'Mangá criado com sucesso!' };

  } catch (error) {
    // 8. Em caso de erro, reverter a Transação
    await pool.query('ROLLBACK');
    console.error("Erro ao criar mangá:", error);
    return { success: false, message: 'Erro de banco de dados: Não foi possível criar o mangá.' };
  } 
}


export async function updateManga(prevState: FormState, formData: FormData): Promise<FormState> {
  // 1. Validação dos dados
  const validatedFields = UpdateMangaSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { success: false, message: 'Erro de validação.', errors: validatedFields.error.flatten().fieldErrors };
  }
  
  const { id, titulo, ano, sinopse, adulto, finalizado, thumbnail, autores, artistas, generos } = validatedFields.data;


  try {
    // 2. Iniciar a Transação
    await pool.query('BEGIN');

    // 3. Atualizar a tabela principal 'mangas'
    const mangaUpdateQuery = `
      UPDATE mangas 
      SET titulo = $1, ano = $2, sinopse = $3, adulto = $4, finalizado = $5
      WHERE id = $6;
    `;
    await pool.query(mangaUpdateQuery, [titulo, ano, sinopse, adulto, finalizado, id]);

    // 4. Sincronizar as relações (Deletar antigas e reinserir novas)
    // Autores
    await pool.query('DELETE FROM manga_autores WHERE manga_id = $1', [id]);
    for (const autorId of autores) {
      await pool.query('INSERT INTO manga_autores (manga_id, autor_id) VALUES ($1, $2)', [id, autorId]);
    }
    // Artistas
    await pool.query('DELETE FROM manga_artistas WHERE manga_id = $1', [id]);
    for (const artistaId of artistas) {
      await pool.query('INSERT INTO manga_artistas (manga_id, artista_id) VALUES ($1, $2)', [id, artistaId]);
    }
    // Gêneros
    await pool.query('DELETE FROM manga_generos WHERE manga_id = $1', [id]);
    for (const generoId of generos) {
      await pool.query('INSERT INTO manga_generos (manga_id, genero_id) VALUES ($1, $2)', [id, generoId]);
    }

    // 5. Fazer o upload da thumbnail APENAS se um novo arquivo foi enviado
    if (thumbnail && thumbnail.size > 0) {
      const fileBuffer = Buffer.from(await thumbnail.arrayBuffer());
      const objectKey = `${id}/thumbnail.webp`;
      
      await minioClient.putObject('mangas', objectKey, fileBuffer, {
        'Content-Type': thumbnail.type,
      });
      
    }

    // 6. Confirmar a Transação
    await pool.query('COMMIT');

    revalidatePath('/admin/mangas'); // Ajuste o caminho da sua listagem de mangás
    return { success: true, message: 'Mangá atualizado com sucesso!' };

  } catch (error) {
    // 7. Em caso de erro, reverter a Transação
    await pool.query('ROLLBACK');
    console.error("Erro ao atualizar mangá:", error);
    return { success: false, message: 'Erro de banco de dados: Não foi possível atualizar o mangá.' };
  } 
}