import { Controller, Get, Param, Post, Query, UploadedFile, UseInterceptors, HttpException, HttpStatus, Delete } from '@nestjs/common';
import { SharePointService } from './sharepoint.service';
import { FileInterceptor } from '@nestjs/platform-express/multer';

@Controller('sharepoint')
export class SharePointController {
    constructor(private readonly spService: SharePointService) { }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadFileDemo(
        @UploadedFile() file: any,
        @Query('taskId') taskId = 'default', // Default taskId if not provided
    ) {
        try {
            const filename = file.originalname;
            const buffer = file.buffer;
            return await this.spService.uploadSmallFile(filename, buffer, taskId);
        } catch (error) {
            throw new HttpException(
                `Failed to upload file: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Get('list')
    async listFiles(@Query('folderName') folderName = 'sonni',
        @Query('taskId') taskId = 'default',) {
        try {
            return await this.spService.listFiles(folderName, taskId);
        } catch (error) {
            throw new HttpException(
                `Failed to list files: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Get('download/:filename')
    async downloadFile(@Param('filename') filename: string,
        @Query('taskId') taskId = 'default',) {
        try {
            return await this.spService.downloadFile(filename, taskId);
        } catch (error) {
            // Handle file not found specifically
            if (error.message.includes('File Not Found') || error.message.includes('404')) {
                throw new HttpException(
                    `File '${filename}' not found`,
                    HttpStatus.NOT_FOUND
                );
            }
            throw new HttpException(
                `Failed to download file: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Delete('delete')
    async deleteFile(
        @Query('filename') filename: string,
        @Query('taskId') taskId?: string,
    ) {
        return await this.spService.deleteFile(filename, taskId);
    }
}