'use server';

import { z } from 'zod';
import pool from '@/src/db';
import minioClient from '@/src/minio';
import { revalidatePath } from 'next/cache';
import AdmZip from 'adm-zip';

// Configurações
const MAX_ZIP_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_IMAGE_EXTENSIONS = ['.webp', '.jpg', '.jpeg', '.png'];
const ITEMS_PER_PAGE = 10; // <--- NOVA CONSTANTE

// Interface para retorno das ações
interface ActionState {
  success: boolean;
  message: string;
}

/**
 * Cria páginas em lote a partir de um arquivo ZIP.
 * O arquivo deve conter imagens nomeadas como "1.webp", "2.webp", etc.
 */
export async function createPaginasFromZip(
  capituloId: string | number,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const file = formData.get('zipfile') as File;

  // 1. Validações iniciais do arquivo
  if (!file || file.size === 0) {
    return { success: false, message: 'Arquivo ZIP inválido ou vazio.' };
  }
  if (file.size > MAX_ZIP_SIZE) {
    return { success: false, message: 'O arquivo ZIP excede o limite de 100MB.' };
  }
  if (!file.name.endsWith('.zip')) {
    return { success: false, message: 'O arquivo deve ser uma extensão .zip.' };
  }


  try {
    // 2. Buscar o manga_id e o slug
    const mangaQuery = `
      SELECT m.id as manga_id, m.slug
      FROM manga_capitulos c
      JOIN mangas m ON c.manga_id = m.id
      WHERE c.id = $1
    `;
    const mangaResult = await pool.query(mangaQuery, [capituloId]);

    if (mangaResult.rowCount === 0) {
      return { success: false, message: 'Capítulo não encontrado.' };
    }

    const { manga_id, slug } = mangaResult.rows[0];

    // 3. Processar o ZIP
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();

    // Filtra e prepara as entradas válidas
    const validEntries = zipEntries.filter(entry => {
      if (entry.isDirectory) return false;
      const lowerName = entry.name.toLowerCase();
      if (lowerName.startsWith('__macosx') || lowerName.startsWith('.')) return false;
      return ALLOWED_IMAGE_EXTENSIONS.some(ext => lowerName.endsWith(ext));
    });

    if (validEntries.length === 0) {
      return { success: false, message: 'Nenhuma imagem válida encontrada no ZIP.' };
    }

    // 4. Iniciar Transação
    await pool.query('BEGIN');

    // --- ALTERAÇÃO: Limpar páginas existentes deste capítulo ---
    // Removemos todas as páginas antigas antes de inserir as novas
    await pool.query('DELETE FROM capitulo_paginas WHERE capitulo_id = $1', [capituloId]);

    // Processar cada imagem
    for (const entry of validEntries) {
      const fileName = entry.name;
      const numeroStr = fileName.split('.')[0];
      const numero = parseInt(numeroStr, 10);

      if (isNaN(numero)) {
        console.warn(`Arquivo ignorado (nome não numérico): ${fileName}`);
        continue;
      }

      const fileContent = entry.getData();
      const objectKey = `mangas/${manga_id}/capitulos/${capituloId}/${numero}.webp`;

      // Upload para o MinIO
      await minioClient.putObject('mangas', objectKey, fileContent, {
        'Content-Type': 'image/webp'
      });

      // Inserir no Banco de Dados
      // Como limpamos a tabela antes, usamos INSERT direto. 
      // O try/catch permanece apenas para prevenir erro caso o ZIP tenha dois arquivos "1.jpg" e "1.png" (duplicidade no ZIP)
      const insertQuery = `
        INSERT INTO capitulo_paginas (capitulo_id, numero, url)
        VALUES ($1, $2, $3)
      `;
      
      try {
          await pool.query(insertQuery, [capituloId, numero, objectKey]);
      } catch (e: any) {
          if (e.code === '23505') {
             // Se houver duplicidade DENTRO do zip, atualiza com a última versão processada
             await pool.query('UPDATE capitulo_paginas SET url = $1 WHERE capitulo_id = $2 AND numero = $3', [objectKey, capituloId, numero]);
          } else {
             throw e;
          }
      }
    }

    // 5. Confirmar Transação
    await pool.query('COMMIT');

    revalidatePath(`/admin/manga/${slug}`);
    return { success: true, message: `${validEntries.length} páginas importadas com sucesso!` };

  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Erro ao processar páginas:', error);
    return { success: false, message: 'Erro interno ao processar o arquivo.' };
  } 
}

/**
 * Deleta uma única página
 */
export async function deletePagina(paginaId: string | number): Promise<ActionState> {

  try {
    await pool.query('BEGIN');

    const findQuery = `
      SELECT p.url, m.slug
      FROM capitulo_paginas p
      JOIN manga_capitulos c ON p.capitulo_id = c.id
      JOIN mangas m ON c.manga_id = m.id
      WHERE p.id = $1
    `;
    const result = await pool.query(findQuery, [paginaId]);

    if (result.rowCount === 0) {
      await pool.query('ROLLBACK');
      return { success: false, message: 'Página não encontrada.' };
    }

    const { url, slug } = result.rows[0];

    // Deleta do MinIO
    if (url) {
      await minioClient.removeObject('mangas', url);
    }

    // Deleta do Banco
    await pool.query('DELETE FROM capitulo_paginas WHERE id = $1', [paginaId]);

    await pool.query('COMMIT');

    revalidatePath(`/admin/manga/${slug}`); 
    return { success: true, message: 'Página deletada com sucesso.' };

  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Erro ao deletar página:', error);
    return { success: false, message: 'Erro ao deletar a página.' };
  } 
}

/**
 * Atualiza (substitui) a imagem de uma página específica
 */
export async function updatePagina(
  paginaId: string | number, 
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const newFile = formData.get('image') as File;
  const novoNumero = formData.get('numero'); 

  if ((!newFile || newFile.size === 0) && !novoNumero) {
    return { success: false, message: 'Nenhuma alteração detectada.' };
  }

  try {
    const findQuery = `
      SELECT p.url, m.slug, p.capitulo_id, p.numero, c.manga_id
      FROM capitulo_paginas p
      JOIN manga_capitulos c ON p.capitulo_id = c.id
      JOIN mangas m ON c.manga_id = m.id
      WHERE p.id = $1
    `;
    const result = await pool.query(findQuery, [paginaId]);

    if (result.rowCount === 0) {
      return { success: false, message: 'Página não encontrada.' };
    }

    const { manga_id, capitulo_id, numero, slug, url } = result.rows[0];
    let finalUrl = url;

    if (newFile && newFile.size > 0) {
        const targetNumero = novoNumero ? novoNumero : numero;
        const objectKey = `mangas/${manga_id}/capitulos/${capitulo_id}/${targetNumero}.webp`;
        
        const fileBuffer = Buffer.from(await newFile.arrayBuffer());
        await minioClient.putObject('mangas', objectKey, fileBuffer, {
        'Content-Type': newFile.type
        });
        finalUrl = objectKey;
    }

    if (novoNumero && novoNumero !== numero.toString()) {
         await pool.query('UPDATE capitulo_paginas SET url = $1, numero = $2 WHERE id = $3', [finalUrl, novoNumero, paginaId]);
    } else {
         await pool.query('UPDATE capitulo_paginas SET url = $1 WHERE id = $2', [finalUrl, paginaId]);
    }

    revalidatePath(`/admin/manga/${slug}`);
    return { success: true, message: 'Página atualizada com sucesso.' };

  } catch (error) {
    console.error('Erro ao atualizar página:', error);
    return { success: false, message: 'Erro ao atualizar a página.' };
  } 
}

/**
 * Busca todas as páginas de um capítulo específico
 */
export async function fetchPaginasByCapituloId(
    capituloId: string | number,
    page: number = 1,
    queryTerm: string = '',
    limit: number = ITEMS_PER_PAGE // <--- USANDO A CONSTANTE AQUI
  ) {
    try {
      const offset = (page - 1) * limit;
  
      // Base da query
      let sqlQuery = `
        SELECT id, capitulo_id, numero, url
        FROM capitulo_paginas
        WHERE capitulo_id = $1
      `;
      
      const queryParams: any[] = [capituloId];
  
      // Adiciona filtro se houver busca
      if (queryTerm) {
        sqlQuery += ` AND CAST(numero AS TEXT) LIKE $${queryParams.length + 1}`;
        queryParams.push(`%${queryTerm}%`);
      }
  
      // Ordenação e Paginação
      sqlQuery += ` ORDER BY numero ASC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
      queryParams.push(limit, offset);
  
      const result = await pool.query(sqlQuery, queryParams);
  
      // Query para Contagem Total
      let countQuery = `
        SELECT COUNT(*) as total
        FROM capitulo_paginas
        WHERE capitulo_id = $1
      `;
      const countParams: any[] = [capituloId];
  
      if (queryTerm) {
        countQuery += ` AND CAST(numero AS TEXT) LIKE $${countParams.length + 1}`;
        countParams.push(`%${queryTerm}%`);
      }
  
      const countResult = await pool.query(countQuery, countParams);
      const totalCount = parseInt(countResult.rows[0].total, 10);
  
      // Busca info do cabeçalho
      const capQuery = `
         SELECT c.numero, c.titulo 
         FROM manga_capitulos c
         JOIN mangas m ON c.manga_id = m.id
         WHERE c.id = $1
      `;
      const capResult = await pool.query(capQuery, [capituloId]);
      const info = capResult.rows[0] || { numero: '?', titulo: '?' };
  
      return { 
        paginas: result.rows, 
        totalCount,
        info 
      };
    } catch (error) {
      console.error('Erro ao buscar páginas:', error);
      return { paginas: [], totalCount: 0, info: { numero: '?', titulo: '?' } };
    }
  }