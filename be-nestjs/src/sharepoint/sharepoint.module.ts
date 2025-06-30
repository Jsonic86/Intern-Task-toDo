import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SharePointService } from './sharepoint.service';
import { SharePointProvider } from './sharepoint.provider';
import { SharePointController } from './sharepoint.controller';

@Global()
@Module({
    imports: [ConfigModule.forRoot()],
    providers: [SharePointProvider, SharePointService],
    controllers: [SharePointController],
    exports: [SharePointService],
})
export class SharePointModule { }