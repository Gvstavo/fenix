'use server';

import { z } from 'zod';
import pool from '@/src/db';
import minioClient from '@/src/minio';
import { revalidatePath } from 'next/cache';
import AdmZip from 'adm-zip';

// Configurações
const MAX_ZIP_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_IMAGE_EXTENSIONS = ['.webp', '.jpg', '.jpeg', '.png'];

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
  _prevState: ActionState, // <--- ADICIONADO: O React injeta o estado anterior aqui
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
    // 2. Buscar o manga_id e o slug para construir o caminho e revalidar
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
      // Ignora arquivos de sistema do Mac ou ocultos
      if (lowerName.startsWith('__macosx') || lowerName.startsWith('.')) return false;
      // Verifica extensão
      return ALLOWED_IMAGE_EXTENSIONS.some(ext => lowerName.endsWith(ext));
    });

    if (validEntries.length === 0) {
      return { success: false, message: 'Nenhuma imagem válida encontrada no ZIP.' };
    }

    // 4. Iniciar Transação
    await pool.query('BEGIN');

    // Limpar páginas existentes deste capítulo? (Opcional: descomente se quiser substituir tudo ao enviar novo zip)
    // await pool.query('DELETE FROM capitulo_paginas WHERE capitulo_id = $1', [capituloId]);

    // Processar cada imagem
    for (const entry of validEntries) {
      // Tenta extrair o número do nome do arquivo (ex: "1.webp" -> 1)
      const fileName = entry.name;
      const numeroStr = fileName.split('.')[0];
      const numero = parseInt(numeroStr, 10);

      if (isNaN(numero)) {
        console.warn(`Arquivo ignorado (nome não numérico): ${fileName}`);
        continue;
      }

      // Prepara o buffer da imagem
      const fileContent = entry.getData();
      
      const objectKey = `mangas/${manga_id}/capitulos/${capituloId}/${numero}.webp`;

      // Upload para o MinIO
      await minioClient.putObject('mangas', objectKey, fileContent, {
        'Content-Type': 'image/webp' // Idealmente o zip já deve ter webps
      });

      // Inserir no Banco de Dados
      const insertQuery = `
        INSERT INTO capitulo_paginas (capitulo_id, numero, url)
        VALUES ($1, $2, $3)
      `;
      // Como pode haver conflito se já existir a página, o ideal seria tratar erros de chave duplicada ou usar ON CONFLICT
      // Mas seguindo o padrão simples solicitado:
      try {
          await pool.query(insertQuery, [capituloId, numero, objectKey]);
      } catch (e: any) {
          // Se for erro de duplicidade (código 23505 no Postgres), podemos tentar UPDATE ou ignorar
          if (e.code === '23505') {
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
 * (Esta função NÃO usa useActionState na tabela, é chamada diretamente no onClick, então NÃO recebe prevState)
 */
export async function deletePagina(paginaId: string | number): Promise<ActionState> {

  try {
    await pool.query('BEGIN');

    // Busca dados para remover do MinIO e para revalidate
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
  _prevState: ActionState, // <--- ADICIONADO: O React injeta o estado anterior aqui
  formData: FormData
): Promise<ActionState> {
  const newFile = formData.get('image') as File;
  // Captura o número caso tenha sido enviado no form
  const novoNumero = formData.get('numero'); 

  if ((!newFile || newFile.size === 0) && !novoNumero) {
    return { success: false, message: 'Nenhuma alteração detectada.' };
  }

  try {
    // Busca dados atuais
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

    // Se houve envio de arquivo, faz upload e atualiza URL
    if (newFile && newFile.size > 0) {
        // Usa o número novo se existir, senão usa o atual para definir o nome do arquivo
        const targetNumero = novoNumero ? novoNumero : numero;
        const objectKey = `mangas/${manga_id}/capitulos/${capitulo_id}/${targetNumero}.webp`;
        
        const fileBuffer = Buffer.from(await newFile.arrayBuffer());
        await minioClient.putObject('mangas', objectKey, fileBuffer, {
        'Content-Type': newFile.type
        });
        finalUrl = objectKey;
    }

    // Atualiza o banco
    // Se o número mudou, atualiza numero e url. Se só imagem mudou, atualiza url.
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
 * (Adicionado conforme sua solicitação anterior para o page.tsx funcionar)
 */
export async function fetchPaginasByCapituloId(capituloId: string | number) {
    try {
      const query = `
        SELECT id, capitulo_id, numero, url
        FROM capitulo_paginas
        WHERE capitulo_id = $1
        ORDER BY numero ASC
      `;
      const result = await pool.query(query, [capituloId]);
      
      const capQuery = `
         SELECT c.numero, m.titulo 
         FROM manga_capitulos c
         JOIN mangas m ON c.manga_id = m.id
         WHERE c.id = $1
      `;
      const capResult = await pool.query(capQuery, [capituloId]);
      const info = capResult.rows[0] || { numero: '?', titulo: '?' };
  
      return { 
        paginas: result.rows, 
        info: info 
      };
    } catch (error) {
      console.error('Erro ao buscar páginas:', error);
      return { paginas: [], info: { numero: '?', titulo: '?' } };
    }
  }