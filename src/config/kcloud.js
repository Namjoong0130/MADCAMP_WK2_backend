const AWS = require('aws-sdk');

const kcloudConfig = {
  endpoint: process.env.KCLOUD_ENDPOINT,
  region: process.env.KCLOUD_REGION || 'kr-standard',
  accessKeyId: process.env.KCLOUD_ACCESS_KEY,
  secretAccessKey: process.env.KCLOUD_SECRET_KEY,
  bucket: process.env.KCLOUD_BUCKET,
  publicUrl: process.env.KCLOUD_PUBLIC_URL,
};

const createS3Client = () => {
  if (!kcloudConfig.endpoint || !kcloudConfig.accessKeyId || !kcloudConfig.secretAccessKey) {
    return null;
  }

  return new AWS.S3({
    endpoint: kcloudConfig.endpoint,
    region: kcloudConfig.region,
    accessKeyId: kcloudConfig.accessKeyId,
    secretAccessKey: kcloudConfig.secretAccessKey,
    s3ForcePathStyle: true,
    signatureVersion: 'v4',
  });
};

module.exports = {
  kcloudConfig,
  createS3Client,
};
