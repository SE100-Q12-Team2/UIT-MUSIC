import envConfig from 'src/shared/config'

/** Public URL dạng S3 (không qua CDN) */
export const toPublicUrl = (key: string) => {
  return `https://${envConfig.S3_BUCKET_NAME}.s3.${envConfig.S3_REGION}.amazonaws.com/${key}`
}

export const toPublicUrlFromRendition = (r: { bucket: string; key: string }) => {
  if (envConfig.CF_DOMAIN) return `https://${envConfig.CF_DOMAIN}/${encodeURI(r.key)}`
  return `https://${r.bucket}.s3.${envConfig.S3_REGION}.amazonaws.com/${encodeURI(r.key)}`
}
