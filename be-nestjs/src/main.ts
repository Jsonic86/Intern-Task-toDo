import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true, // Cho phép tất cả origins, hoặc chỉ định cụ thể: ['http://localhost:3001', 'http://localhost:4000']
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true, // Cho phép gửi cookies
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
