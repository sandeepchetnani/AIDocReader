const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');

const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
  },
  forcePathStyle: true
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME;

const s3Service = {
  async uploadFile(file, userId) {
    const fileExtension = file.originalname.split('.').pop();
    const key = `documents/${userId}/${uuidv4()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        userId: userId,
        originalName: file.originalname
      }
    });

    await s3Client.send(command);

    return {
      key,
      url: `${process.env.R2_PUBLIC_URL}/${key}`
    };
  },

  async getSignedDownloadUrl(key, expiresIn = 3600) {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    return getSignedUrl(s3Client, command, { expiresIn });
  },

  async getSignedUploadUrl(userId, filename, contentType) {
    const fileExtension = filename.split('.').pop();
    const key = `documents/${userId}/${uuidv4()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    return {
      uploadUrl: signedUrl,
      key,
      url: `${process.env.R2_PUBLIC_URL}/${key}`
    };
  },

  async deleteFile(key) {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    await s3Client.send(command);
  },

  async getFileContent(key) {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    const response = await s3Client.send(command);
    return response.Body;
  }
};

module.exports = s3Service;
