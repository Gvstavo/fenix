import * as Minio from 'minio'

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: process.env.MINIO_PORT,
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

export default minioClient; 