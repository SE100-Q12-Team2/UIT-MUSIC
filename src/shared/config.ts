import fs from 'fs'
import path from 'path'
import z from 'zod'
import { config as dotenvConfig } from 'dotenv'
import type { StringValue } from 'ms'

// Xác định file .env theo NODE_ENV (ưu tiên .env.development/.env.production/.env.test)
const envFile =
  process.env.NODE_ENV && process.env.NODE_ENV !== 'production'
    ? `.env.${process.env.NODE_ENV}` // vd: .env.development
    : '.env'

// Load .env từ project root (process.cwd() khi bạn chạy "npm start" ở root)
// Chỉ load file .env nếu tồn tại, không bắt buộc (vì Railway/production set qua env vars)
const envPath = path.resolve(process.cwd(), envFile)
if (fs.existsSync(envPath)) {
  dotenvConfig({ path: envPath })
} else {
  // fallback sang .env nếu .env.<env> không có
  const fallback = path.resolve(process.cwd(), '.env')
  if (fs.existsSync(fallback)) {
    dotenvConfig({ path: fallback })
  }
  // Không exit nếu không tìm thấy file - Railway/production dùng env vars
}

const DurationString = z.string().regex(/^\d+(ms|s|m|h|d|w)$/i)

const ConfigSchema = z.object({
  DATABASE_URL: z.string(),
  ACCESS_TOKEN_SECRET: z.string(),
  REFRESH_TOKEN_SECRET: z.string(),
  ACCESS_TOKEN_EXPIRES_IN: z.string(),
  REFRESH_TOKEN_EXPIRES_IN: z.string(),
  RESET_PASSWORD_TOKEN: z.string(),
  RESET_PASSWORD_TOKEN_EXPIRES_IN: z.string(),
  PORT: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  OTP_EXPIRES_IN: DurationString,
  RESEND_API_KEY: z.string(),
  ADMIN_EMAIL: z.string(),
  ADMIN_NAME: z.string(),
  ADMIN_PHONE_NUMBER: z.string(),
  ADMIN_PASSWORD: z.string(),
  RESET_PASSWORD_REDIRECT_URL: z.string(),
  S3_BUCKET_NAME: z.string(),
  S3_REGION: z.string(),
  S3_ACCESS_KEY: z.string(),
  S3_SECRET_KEY: z.string(),
  INGEST_TOKEN: z.string(),
  CF_PRIVATE_KEY: z.string(),
  CF_KEY_PAIR_ID: z.string(),
  CF_DOMAIN: z.string(),
  PAYMENT_API_KEY_SECRET: z.string(),
  REDIS_CLOUD_URL: z.string(),
  MEILI_HOST: z.string().default('http://localhost:7700'),
  MEILI_MASTER_KEY: z.string(),
})

const parsed = ConfigSchema.safeParse(process.env)

if (!parsed.success) {
  console.log('Variables declared in .env is not valid')
  console.error(parsed.error)
  process.exit(1)
}

const envConfig = {
  ...parsed.data,
  OTP_EXPIRES_IN: parsed.data.OTP_EXPIRES_IN as StringValue,
}

export default envConfig
