import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ZodValidationPipe } from 'nestjs-zod'
import { NestExpressApplication } from '@nestjs/platform-express'


BigInt.prototype.toJSON = function () {
  const num = Number(this)
  // Warning if BigInt value exceeds safe integer range
  if (this > Number.MAX_SAFE_INTEGER || this < Number.MIN_SAFE_INTEGER) {
    console.warn(`BigInt value ${this} exceeds safe integer range and may lose precision when converted to Number`)
  }
  return num
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  })

  app.useGlobalPipes(new ZodValidationPipe())

  await app.listen(process.env.PORT ?? 3000)
}
bootstrap()
