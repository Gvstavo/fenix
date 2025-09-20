'use server';
import minioClient from '@/src/minio.ts';

export async function getPresignedUrl(bucketName: string, objectKey: string): Promise<string> {
  try {
    // 2. Gera a URL que expira em 1 hora (3600 segundos).
    const presignedUrl = await minioClient.presignedGetObject(
      bucketName,
      objectKey,
      3600,
    );
    return presignedUrl;
  } catch (error) {
    console.error("Erro ao gerar URL pré-assinada:", error);
    // Em caso de erro, você pode retornar uma URL de imagem padrão ou lançar o erro.
    throw new Error('Não foi possível obter a imagem.');
  }
}