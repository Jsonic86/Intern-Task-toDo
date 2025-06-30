import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import config from './config/definedConfig';
import { Task } from './entities/task.entity';
import { TaskModule } from './task/task.module';
import { SharePointModule } from './sharepoint/sharepoint.module';
import { FileEntity } from './entities/file.entity';

@Module({
  imports: [
    MikroOrmModule.forRoot(config),
    Task,
    TaskModule,
    SharePointModule,
    FileEntity
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
