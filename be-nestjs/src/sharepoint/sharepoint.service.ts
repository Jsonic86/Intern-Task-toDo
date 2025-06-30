import { Inject, Injectable, Logger } from '@nestjs/common';
import { SHAREPOINT } from './sharepoint.provider';
import '@pnp/sp-commonjs/files';
import '@pnp/sp-commonjs/folders';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { FileEntity } from 'src/entities/file.entity';

@Injectable()
export class SharePointService {
    private readonly logger = new Logger(SharePointService.name);

    constructor(
        @Inject(SHAREPOINT) private readonly sp: any,
        @InjectRepository(FileEntity)
        private readonly fileRepository: EntityRepository<FileEntity>,
        private readonly em: EntityManager
    ) { }

    /** Upload file ≤ 10MB */
    async uploadSmallFile(filename: string, buffer: Buffer, taskId?: string) {
        try {
            const parentFolder = this.sp.web.getFolderByServerRelativePath('sonni');

            // Tạo thư mục con tên 'new-folder' (nếu chưa có)
            const newFolderResult = await parentFolder.folders.add(taskId);
            const newFolder = newFolderResult.folder;

            // Upload file vào thư mục mới tạo
            const fileResult = await newFolder.files.addUsingPath(filename, buffer, {
                Overwrite: true,
            });

            // Save to database
            const fileEntity = this.fileRepository.create({
                filename,
                taskId,
                createdAt: new Date()
            });
            this.em.persist(fileEntity);
            await this.em.flush();

            this.logger.log(`✔ Uploaded file: ${filename} and saved to database`);
            return {
                data: {
                    sharepoint: fileResult,
                    database: fileEntity
                },
                message: 'File uploaded successfully to SharePoint and database',
                success: true
            };
        } catch (error) {
            this.logger.error(`Error uploading file ${filename}:`, error);
            throw error;
        }
    }

    /** Lấy danh sách file */
    async listFiles(folderName = 'sonni', taskId?: string) {
        try {
            const folder = this.sp.web.getFolderByServerRelativePath(folderName + (taskId ? `/${taskId}` : ''));
            const files = await folder.files.select('Name', 'TimeLastModified', 'Length')();
            return files;
        } catch (err) {
            this.logger.error(`Error listing files in folder ${folderName}/${taskId}:`, err);
            throw err;
        }
    }

    async downloadFile(filename: string, taskId?: string) {
        try {
            const web = await this.sp.web.select('ServerRelativeUrl')();
            const webUrl = web.ServerRelativeUrl.endsWith('/')
                ? web.ServerRelativeUrl.slice(0, -1)
                : web.ServerRelativeUrl;

            const relativePath = `${webUrl}/sonni${taskId ? `/${taskId}` : ''}/${filename}`;

            const file = this.sp.web.getFileByServerRelativePath(relativePath);
            const arrayBuffer = await file.getBuffer();

            // Convert ArrayBuffer to Buffer then to base64
            const buffer = Buffer.from(arrayBuffer);

            this.logger.log(`✔ Downloaded file: ${filename}`);
            return {
                filename,
                content: buffer.toString('base64'),
            };
        } catch (err) {
            this.logger.error(`Error downloading file ${filename}:`, err);
            throw err;
        }
    }
    async deleteFile(filename: string, taskId?: string): Promise<void> {
        try {
            const web = await this.sp.web.select('ServerRelativeUrl')();
            const webUrl = web.ServerRelativeUrl.endsWith('/')
                ? web.ServerRelativeUrl.slice(0, -1)
                : web.ServerRelativeUrl;

            const relativePath = `${webUrl}/sonni${taskId ? `/${taskId}` : ''}/${filename}`;

            // Delete from SharePoint
            await this.sp.web.getFileByServerRelativePath(relativePath).delete();

            // Delete from database
            const fileEntity = await this.fileRepository.findOne({ filename, taskId });
            if (fileEntity) {
                this.em.remove(fileEntity);
                await this.em.flush();
            }

            this.logger.log(`🗑️ Deleted file: ${relativePath} from SharePoint and database`);
        } catch (error) {
            this.logger.error(`❌ Error deleting file ${filename}:`, error);
            throw error;
        }
    }
}