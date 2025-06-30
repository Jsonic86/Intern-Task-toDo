import { Controller, Get, Post } from '@nestjs/common';
import { SharePointService } from './sharepoint.service';
import * as fs from 'fs';
import * as path from 'path';

@Controller('sharepoint')
export class SharePointController {
    constructor(private readonly spService: SharePointService) { }

    @Post('upload-demo')
    async uploadFileDemo() {
        const filePath = path.join(__dirname, 'test.txt');
        const fileContent: any = fs.readFileSync(filePath, 'utf8');
        return await this.spService.uploadSmallFile('test.txt', fileContent);
    }

    @Get('list')
    async listFiles() {
        return await this.spService.listFiles();
    }
}


