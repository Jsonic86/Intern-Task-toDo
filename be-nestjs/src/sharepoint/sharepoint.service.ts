import { Inject, Injectable, Logger } from '@nestjs/common';
import { SHAREPOINT } from './sharepoint.provider';
import '@pnp/sp-commonjs/files';
import '@pnp/sp-commonjs/folders';

@Injectable()
export class SharePointService {
    private readonly logger = new Logger(SharePointService.name);

    constructor(@Inject(SHAREPOINT) private readonly sp: any) { }

    /** Upload file ≤ 10MB */
    async uploadSmallFile(filename: string, buffer: Buffer, taskId?: string) {
        const parentFolder = this.sp.web.getFolderByServerRelativePath('sonni');

        // Tạo thư mục con tên 'new-folder' (nếu chưa có)
        const newFolderResult = await parentFolder.folders.add(taskId);
        const newFolder = newFolderResult.folder;

        // Upload file vào thư mục mới tạo
        const fileResult = await newFolder.files.addUsingPath(filename, buffer, {
            Overwrite: true,
        });

        this.logger.log(`✔ Uploaded file: ${filename}`);
        return fileResult;
    }

    /** Lấy danh sách file */
    async listFiles(folderName = 'sonni') {
        const folder = this.sp.web.getFolderByServerRelativePath(folderName);
        const files = await folder.files.select('Name', 'TimeLastModified', 'Length')();
        return files;
    }
}