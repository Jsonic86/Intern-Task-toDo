import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { SharePointService } from './sharepoint.service';
import { SharePointProvider } from './sharepoint.provider';
import { SharePointController } from './sharepoint.controller';
import { FileEntity } from 'src/entities/file.entity';

@Global()
@Module({
    imports: [
        ConfigModule.forRoot(),
        MikroOrmModule.forFeature([FileEntity]),
    ],
    providers: [SharePointProvider, SharePointService],
    controllers: [SharePointController],
    exports: [SharePointService],
})
export class SharePointModule { }