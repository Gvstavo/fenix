'use server';

import pool from '@/src/db';
import { getPresignedUrl } from '@/actions/minio'; // Assumindo que você tem essa função do passo anterior

export async function getReaderData(slug: string, numeroCapitulo: string) {
  try {
    const numero = parseInt(numeroCapitulo);

    // 1. Buscar dados do Mangá e do Capítulo Atual
    const chapterQuery = `
      SELECT 
        c.id as capitulo_id,
        c.titulo as capitulo_titulo,
        c.numero,
        m.id as manga_id,
        m.titulo as manga_titulo,
        m.slug
      FROM manga_capitulos c
      JOIN mangas m ON c.manga_id = m.id
      WHERE m.slug = $1 AND c.numero = $2
    `;
    const chapterResult = await pool.query(chapterQuery, [slug, numero]);

    if (chapterResult.rowCount === 0) return null;
    const currentChapter = chapterResult.rows[0];

    // 2. Buscar Páginas do Capítulo (Sem limite/paginação para leitura "List Style")
    const pagesQuery = `
      SELECT url, numero
      FROM capitulo_paginas
      WHERE capitulo_id = $1
      ORDER BY numero ASC
    `;
    const pagesResult = await pool.query(pagesQuery, [currentChapter.capitulo_id]);
    
    // Gerar URLs assinadas
    const pagesWithUrls = await Promise.all(
        pagesResult.rows.map(async (page) => ({
            ...page,
            src: await getPresignedUrl('mangas', page.url)
        }))
    );

    // 3. Buscar Navegação (Anterior/Próximo/Todos)
    // Todos os capítulos para o dropdown
    const allChaptersQuery = `
        SELECT numero, id 
        FROM manga_capitulos 
        WHERE manga_id = $1 
        ORDER BY numero DESC
    `;
    const allChaptersResult = await pool.query(allChaptersQuery, [currentChapter.manga_id]);
    const allChapters = allChaptersResult.rows;

    // Calcular Prev/Next
    const currentIndex = allChapters.findIndex((c) => c.numero === numero);
    // Como a lista está DESC (do mais novo para o mais velho):
    // Next (mais novo) está no index anterior
    // Prev (mais velho) está no index posterior
    const nextChapter = currentIndex > 0 ? allChapters[currentIndex - 1] : null;
    const prevChapter = currentIndex < allChapters.length - 1 ? allChapters[currentIndex + 1] : null;

    return {
      manga: { title: currentChapter.manga_titulo, slug: currentChapter.slug },
      chapter: { title: currentChapter.capitulo_titulo, number: currentChapter.numero },
      pages: pagesWithUrls,
      navigation: {
        prev: prevChapter ? prevChapter.numero : null,
        next: nextChapter ? nextChapter.numero : null,
        all: allChapters
      }
    };

  } catch (error) {
    console.error("Erro no Reader:", error);
    return null;
  }
}