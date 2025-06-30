import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import config from './config/definedConfig';
import { Task } from './entities/task.entity';
import { TaskModule } from './task/task.module';
import { SharePointModule } from './sharepoint/sharepoint.module';

@Module({
  imports: [
    MikroOrmModule.forRoot(config),
    Task,
    TaskModule,
    SharePointModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
