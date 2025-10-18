import envConfig from 'src/shared/config'

export const toPublicUrlFromRendition = (r: { bucket: string; key: string }) => {
  if (envConfig.CF_DOMAIN) return `https://${envConfig.CF_DOMAIN}/${encodeURI(r.key)}`
  return `https://${r.bucket}.s3.${envConfig.S3_REGION}.amazonaws.com/${encodeURI(r.key)}`
}
