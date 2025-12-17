'use server';

import { z } from 'zod';
import pool from '@/src/db.ts';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/app/lib/session';
import minioClient from '@/src/minio.ts';
import { type FormState } from './definitions';
import { Capitulo } from '@/src/models.tsx';

// --- CONFIGURAÇÕES ---
const ITEMS_PER_PAGE = 20;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_IMAGE_TYPES = ["image/webp"];

// --- SCHEMAS ZOD ---

// Schema para CRIAÇÃO
const CreateCapituloSchema = z.object({
  manga_id: z.string().min(1, { message: "ID do mangá é inválido." }),
  manga_slug: z.string().min(1, { message: "Slug do mangá é inválido." }),
  numero: z.coerce.number({ invalid_type_error: "O número do capítulo deve ser um número." })
    .positive({ message: "Por favor, insira um número válido." }),
  titulo: z.string().optional(),
  thumbnail: z
    .any()
    .refine((file) => file instanceof File && file.size > 0, "A imagem da thumbnail é obrigatória.")
    .refine((file) => ACCEPTED_IMAGE_TYPES.includes(file?.type), "Apenas o formato .webp é suportado.")
    .refine((file) => file?.size <= MAX_FILE_SIZE, `O tamanho máximo da imagem é 10MB.`),
});

// Schema para ATUALIZAÇÃO (Thumbnail opcional)
const UpdateCapituloSchema = z.object({
  id: z.string().min(1, { message: "ID do capítulo inválido." }),
  manga_id: z.string().min(1),
  manga_slug: z.string().min(1),
  numero: z.coerce.number({ invalid_type_error: "O número do capítulo deve ser um número." })
    .positive({ message: "Por favor, insira um número válido." }),
  titulo: z.string().optional(),
  thumbnail: z
    .any()
    .optional()
    .refine((file) => !file || file.size === 0 || file instanceof File, "Arquivo inválido.")
    .refine((file) => !file || file.size === 0 || ACCEPTED_IMAGE_TYPES.includes(file?.type), "Apenas o formato .webp é suportado.")
    .refine((file) => !file || file.size === 0 || file?.size <= MAX_FILE_SIZE, `O tamanho máximo da imagem é 10MB.`),
});

// --- HELPER INTERFACES ---

interface FetchChaptersParams {
  mangaId: string | number;
  page: number;
  query?: string;
}

// --- SERVER ACTIONS ---

export async function fetchChaptersForManga(mangaId, page, query ): Promise<{ capitulos: Capitulo[]; totalCount: number }> {
  const currentPage = Math.max(page, 1);
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  
  // Prepara o termo de busca para o ILIKE
  const searchQuery = query ? `%${query}%` : '%';

  try {
    // 1. Query combinada (Total + Dados) usando Window Function para otimizar
    // OBS: Usando manga_capitulos conforme a tabela
    const queryText = `
      SELECT 
        *,
        COUNT(*) OVER() AS total_count
      FROM manga_capitulos 
      WHERE manga_id = $1 
      AND (titulo ILIKE $2 OR numero::text ILIKE $2)
      ORDER BY numero DESC
      LIMIT $3 OFFSET $4
    `;
    const result = await pool.query(queryText, [mangaId, searchQuery, ITEMS_PER_PAGE, offset]);

    const capitulos = result.rows as Capitulo[];
    const totalCount = parseInt(result.rows[0]?.total_count || '0', 10);

    return { capitulos, totalCount };

  } catch (error) {
    console.error('Erro ao buscar capítulos:', error);
    return { capitulos: [], totalCount: 0 };
  }
}

export async function createCapitulo(prevState: FormState, formData: FormData): Promise<FormState> {
  // 1. Segurança: Obter sessão
  const session = await getSession();
  if (!session?.id) {
    return { success: false, message: "Acesso negado. Sessão inválida." };
  }
  const created_by_id = session.id;

  // 2. Validação
  const validatedFields = CreateCapituloSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { success: false, message: 'Erro de validação.', errors: validatedFields.error.flatten().fieldErrors };
  }
  
  const { manga_id, manga_slug, numero, titulo, thumbnail } = validatedFields.data;
  
  // Usamos connect() para garantir a transação na mesma conexão
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 3. Verificar duplicidade
    const existingChapter = await client.query(
      'SELECT id FROM manga_capitulos WHERE manga_id = $1 AND numero = $2', 
      [manga_id, numero]
    );
    if (existingChapter.rowCount > 0) {
      await client.query('ROLLBACK');
      return { success: false, message: `O capítulo número ${numero} já existe para este mangá.` };
    }

    // 4. Inserir no banco
    // Assumindo que você tem a coluna 'thumbnail' na tabela, mesmo que não estivesse no CREATE TABLE enviado
    const chapterInsertQuery = `
      INSERT INTO manga_capitulos (manga_id, numero, titulo, created_by, created_at, thumbnail) 
      VALUES ($1, $2, $3, $4, NOW(), '') 
      RETURNING id;
    `;
    const chapterResult = await client.query(chapterInsertQuery, [manga_id, numero, titulo || '', created_by_id]);
    const newChapterId = chapterResult.rows[0].id;

    // 5. Upload para o MinIO
    const fileBuffer = Buffer.from(await thumbnail.arrayBuffer());
    const objectKey = `mangas/${manga_id}/capitulos/${newChapterId}/thumbnail.webp`;
    
    await minioClient.putObject('mangas', objectKey, fileBuffer, {
      'Content-Type': thumbnail.type,
    });
    
    // 6. Atualizar registro com o caminho da imagem
    await client.query('UPDATE manga_capitulos SET thumbnail = $1 WHERE id = $2', [objectKey, newChapterId]);

    await client.query('COMMIT');

    revalidatePath(`/admin/manga/${manga_slug}`);
    return { success: true, message: 'Capítulo criado com sucesso!' };

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Erro ao criar capítulo:", error);
    return { success: false, message: 'Erro de banco de dados: Não foi possível criar o capítulo.' };
  } finally {
    client.release();
  }
}

export async function updateCapitulo(prevState: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = UpdateCapituloSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { success: false, message: 'Erro de validação.', errors: validatedFields.error.flatten().fieldErrors };
  }
  
  const { id, manga_id, manga_slug, numero, titulo, thumbnail } = validatedFields.data;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 3. Verifica duplicidade (excluindo o próprio ID)
    const existingChapter = await client.query(
      'SELECT id FROM manga_capitulos WHERE manga_id = $1 AND numero = $2 AND id != $3',
      [manga_id, numero, id]
    );
    if (existingChapter.rowCount > 0) {
      await client.query('ROLLBACK');
      return { success: false, message: `O capítulo número ${numero} já existe para este mangá.` };
    }

    // 4. Atualizar dados básicos
    const chapterUpdateQuery = `
      UPDATE manga_capitulos 
      SET numero = $1, titulo = $2 
      WHERE id = $3;
    `;
    await client.query(chapterUpdateQuery, [numero, titulo || '', id]);

    // 5. Upload condicional da imagem
    if (thumbnail && thumbnail.size > 0) {
      const fileBuffer = Buffer.from(await thumbnail.arrayBuffer());
      const objectKey = `mangas/${manga_id}/capitulos/${id}/thumbnail.webp`;
      
      await minioClient.putObject('mangas', objectKey, fileBuffer, {
        'Content-Type': thumbnail.type,
      });
      
      await client.query('UPDATE manga_capitulos SET thumbnail = $1 WHERE id = $2', [objectKey, id]);
    }

    await client.query('COMMIT');

    revalidatePath(`/admin/manga/${manga_slug}`);
    return { success: true, message: 'Capítulo atualizado com sucesso!' };

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Erro ao atualizar capítulo ${id}:`, error);
    return { success: false, message: 'Erro de banco de dados: Não foi possível atualizar o capítulo.' };
  } finally {
    client.release();
  }
}

export async function deleteCapitulo(id: string): Promise<{ success: boolean; message: string }> {
  if (!id) {
    return { success: false, message: 'ID do capítulo é inválido.' };
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 2. Buscar informações ANTES de deletar (manga_id e slug)
    const findQuery = `
      SELECT c.manga_id, m.slug 
      FROM manga_capitulos c
      JOIN mangas m ON c.manga_id = m.id
      WHERE c.id = $1
    `;
    const findResult = await client.query(findQuery, [id]);

    if (findResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return { success: false, message: 'Capítulo não encontrado.' };
    }

    const { manga_id, slug } = findResult.rows[0];

    // 3. Listar e deletar arquivos do MinIO
    const prefix = `mangas/${manga_id}/capitulos/${id}/`;
    const objectsStream = minioClient.listObjectsV2('mangas', prefix, true);
    
    const objectKeys: string[] = [];
    for await (const obj of objectsStream) {
      if (obj.name) {
        objectKeys.push(obj.name);
      }
    }

    if (objectKeys.length > 0) {
      await minioClient.removeObjects('mangas', objectKeys);
    }

    // 4. Deletar do banco
    await client.query('DELETE FROM manga_capitulos WHERE id = $1', [id]);

    await client.query('COMMIT');

    revalidatePath(`/admin/manga/${slug}`);
    
    return { success: true, message: 'Capítulo excluído com sucesso.' };

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Erro ao deletar capítulo ${id}:`, error);
    return { success: false, message: 'Erro ao excluir o capítulo.' };
  } finally {
    client.release();
  }
}