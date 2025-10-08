import fs from 'fs'
import path from 'path'
import z from 'zod'

//Kiểm tra xem có file .env không
if (!fs.existsSync(path.resolve('.env'))) {
  console.log('.Env file have not been declared yet')
  process.exit(1)
}

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
  OTP_EXPIRES_IN: z.string(),
  RESEND_API_KEY: z.string(),
})

const configServer = ConfigSchema.safeParse(process.env)

if (!configServer.success) {
  console.log('Variables declared in .env is not valid')
  console.error(configServer.error)
  process.exit(1)
}

const envConfig = configServer.data

export default envConfig
