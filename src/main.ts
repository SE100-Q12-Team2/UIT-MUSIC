import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { cleanupOpenApiDoc, ZodValidationPipe } from 'nestjs-zod'
import { NestExpressApplication } from '@nestjs/platform-express'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { HttpException, Logger } from '@nestjs/common'
import { ResponseInterceptor } from 'src/shared/interceptors/response.interceptors'
import { HttpExceptionFilter } from 'src/shared/filters/http-exception.filters'

BigInt.prototype.toJSON = function () {
  const num = Number(this)
  // Warning if BigInt value exceeds safe integer range
  if (this > Number.MAX_SAFE_INTEGER || this < Number.MIN_SAFE_INTEGER) {
    console.warn(`BigInt value ${this} exceeds safe integer range and may lose precision when converted to Number`)
  }
  return num
}

async function bootstrap() {
  const logger = new Logger('Bootstrap')
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  })

  app.set('trust proxy', true)

  app.enableCors({
    origin: true,
    credentials: true,
  })

  app.useGlobalInterceptors(new ResponseInterceptor())
  app.useGlobalFilters(new HttpExceptionFilter())

  app.use((req, res, next) => {
    try {
      const shortAuth = (req.headers?.authorization ?? '').toString().slice(0, 100)
      logger.debug(`${req.method} ${req.originalUrl} - AuthHeaderPresent=${!!req.headers?.authorization} auth=${shortAuth}`)
    } catch (e) {
      // noop
    }
    next()
  })

  const config = new DocumentBuilder()
    .setTitle('UIT-Music API')
    .setDescription(
      'Music streaming platform API with features including user authentication, music playback, playlists, favorites, subscriptions, and recommendations.',
    )
    .setVersion('1.0.0')
    .setContact('UIT-Music Team', 'https://uit-music.com', 'ntuanloc205@gmail.com')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Authentication', 'User authentication and authorization endpoints')
    .addTag('Albums', 'Album management and browsing')
    .addTag('Artists', 'Artist management and discovery')
    .addTag('Songs', 'Song management, playback, and streaming')
    .addTag('Playlists', 'User playlist creation and management')
    .addTag('Favorites', 'User favorite songs and collections')
    .addTag('Follow', 'Follow artists and record labels')
    .addTag('Genres', 'Music genre management')
    .addTag('Users', 'User account management')
    .addTag('Profile', 'User profile settings')
    .addTag('Subscriptions', 'Premium subscription plans and management')
    .addTag('Payments', 'Payment processing and transactions')
    .addTag('Media', 'Media upload, processing, and playback')
    .addTag('Search', 'Search songs, albums, artists, and playlists')
    .addTag('Recommendations', 'Personalized music recommendations')
    .addTag('Statistics', 'Platform analytics and user statistics')
    .addTag('Listening History', 'User listening history tracking')
    .addTag('Ratings', 'Song rating system')
    .addTag('Notifications', 'User notification management')
    .addTag('Copyright', 'Copyright reporting and management')
    .addTag('Advertisements', 'Advertisement management')
    .addTag('Roles & Permissions', 'Access control and permissions')
    .build()

  const openApiDoc = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api', app, cleanupOpenApiDoc(openApiDoc), {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'none',
      filter: true,
      tryItOutEnabled: true,
    },
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'UIT-Music API Documentation',
  })

  app.useGlobalPipes(new ZodValidationPipe())

  const port = process.env.PORT ?? 3000
  await app.listen(port)

  logger.log(`🚀 Application is running on: http://localhost:${port}`)
  logger.log(`📚 Swagger documentation: http://localhost:${port}/api`)
}

bootstrap().catch((err) => {
  console.error('Bootstrap failed', err)
  process.exit(1)
})
