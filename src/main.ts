import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { cleanupOpenApiDoc, ZodValidationPipe } from 'nestjs-zod'
import { NestExpressApplication } from '@nestjs/platform-express'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

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

  const openApiDoc = SwaggerModule.createDocument(
    app,
    new DocumentBuilder().setTitle('UIT-Music API').setDescription('Example API description').setVersion('1.0').build(),
  )
  SwaggerModule.setup('api', app, cleanupOpenApiDoc(openApiDoc))

  app.useGlobalPipes(new ZodValidationPipe())

  await app.listen(process.env.PORT ?? 3000)
}
bootstrap()
