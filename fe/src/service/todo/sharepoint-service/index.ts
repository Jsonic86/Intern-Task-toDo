import { spfi, SPFI } from "@pnp/sp";
import { MSAL } from "@pnp/msaljsclient"; // Sửa lại import này
import { BrowserFetch } from "@pnp/queryable";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/folders";
import "@pnp/sp/files";
import "@pnp/sp/items";
import "@pnp/sp/fields/list";
import "@pnp/sp/site-users/web";
import { msalInstance, loginRequest } from "../../../setup/auth-config";

interface UploadResult {
    url: string;
    fileName: string;
    fileId: string;
    serverRelativeUrl: string;
}

interface TaskAttachment {
    id: string;
    fileName: string;
    url: string;
    uploadDate: string;
    size?: number;
}

interface Task {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    assignee: string;
    dueDate: string;
    attachments: TaskAttachment[];
    createdDate: string;
    updatedDate: string;
}

class SharePointService {
    private sp: SPFI;
    private libraryName = "Jsonic86"; // Document Library name theo login của bạn
    private siteUrl = "https://1work.sharepoint.com/sites/intern-data";
    private isAuthenticated = false;
    private taskListName = "TasksJsonic86"; // Unique list name

    constructor() {
        // Khởi tạo SP object với MSAL authentication - Sửa lại syntax
        this.sp = spfi(this.siteUrl).using(
            MSAL(
                {
                    auth: {
                        clientId: "197aa42e-b3b5-4d41-8de9-23f0a49bbad3",
                        authority: "https://login.microsoftonline.com/8d72c235-dd33-4381-b69c-95c5221f9041",
                        redirectUri: window.location.origin
                    }
                } // MSAL configuration object with required 'auth' property
            ),
            BrowserFetch()
        );
    }

    // Đăng nhập và xác thực với improved error handling
    async authenticate(): Promise<boolean> {
        try {
            console.log("Starting authentication...");

            // Initialize MSAL nếu chưa
            await msalInstance.initialize();

            // Kiểm tra nếu đã đăng nhập
            const accounts = msalInstance.getAllAccounts();
            console.log("Found accounts:", accounts.length);

            if (accounts.length > 0) {
                // Tìm account admin1@fxp.vn hoặc account đầu tiên
                const account = accounts.find(acc =>
                    acc.username.includes("fxp.vn") ||
                    acc.username.includes("admin1")
                ) || accounts[0];

                console.log("Using account:", account.username);
                msalInstance.setActiveAccount(account);

                // Test token validity
                try {
                    await msalInstance.acquireTokenSilent({
                        ...loginRequest,
                        account: account
                    });
                    this.isAuthenticated = true;
                    console.log("Authentication successful with existing token");
                    return true;
                } catch (tokenError) {
                    console.log("Token expired, need interactive login");
                }
            }

            // Đăng nhập interactive
            console.log("Starting interactive login...");
            const loginResponse = await msalInstance.loginPopup({
                ...loginRequest,
                prompt: "select_account"
            });

            if (loginResponse?.account) {
                msalInstance.setActiveAccount(loginResponse.account);
                this.isAuthenticated = true;
                console.log("Interactive login successful:", loginResponse.account.username);
                return true;
            }

            return false;
        } catch (error) {
            console.error("Authentication failed:", error);

            // Handle specific error types
            if (error instanceof Error) {
                if (error.message.includes("popup_window_error")) {
                    alert("Popup bị chặn! Vui lòng cho phép popup và thử lại.");
                } else if (error.message.includes("interaction_in_progress")) {
                    console.log("Authentication already in progress");
                    return false;
                }
            }

            return false;
        }
    }

    // Test SharePoint connection
    async testConnection(): Promise<boolean> {
        try {
            const web = await this.sp.web.select("Title", "Url")();
            console.log("Connected to SharePoint:", web.Title, web.Url);
            return true;
        } catch (error) {
            console.error("SharePoint connection failed:", error);
            return false;
        }
    }

    // Tạo Document Library "Jsonic86" với error handling tốt hơn
    async createDocumentLibrary(): Promise<void> {
        if (!this.isAuthenticated) {
            throw new Error("Not authenticated");
        }

        try {
            console.log(`Creating Document Library: ${this.libraryName}`);

            // Kiểm tra library đã tồn tại chưa
            const exists = await this.checkLibraryExists();
            if (exists) {
                console.log("Document Library already exists");
                return;
            }

            const libraryInfo = await this.sp.web.lists.add(
                this.libraryName,
                `Document Library for ${this.libraryName} - Created on 2025-06-19`,
                101 // Document Library template
            );

            console.log("Document Library created:", libraryInfo.data.Title);

            // Cập nhật description và settings
            await this.sp.web.lists.getByTitle(this.libraryName).update({
                Description: `Task attachments storage for user Jsonic86 - FXP Intern Data`,
                EnableVersioning: true,
                MajorVersionLimit: 10
            });

            console.log("Document Library configured successfully");

        } catch (error) {
            console.error("Error creating Document Library:", error);
            if (this.isErrorWithMessage(error) && error.message.includes("already exists")) {
                console.log("Document Library already exists (caught in error)");
            } else {
                throw new Error(`Failed to create Document Library: ${this.getErrorMessage(error)}`);
            }
        }
    }

    // Helper method to check if error has message property
    private isErrorWithMessage(error: unknown): error is { message: string } {
        return typeof error === "object" &&
            error !== null &&
            "message" in error &&
            typeof (error as any).message === "string";
    }

    // Helper method to get error message
    private getErrorMessage(error: unknown): string {
        if (this.isErrorWithMessage(error)) {
            return error.message;
        }
        return String(error);
    }

    // Kiểm tra library có tồn tại không
    async checkLibraryExists(): Promise<boolean> {
        if (!this.isAuthenticated) return false;

        try {
            const list = await this.sp.web.lists.getByTitle(this.libraryName).select("Title")();
            return !!list;
        } catch (error) {
            console.log("Library check failed:", this.getErrorMessage(error));
            return false;
        }
    }

    // Upload single file với better path handling
    async uploadFile(file: File, taskId?: string): Promise<UploadResult> {
        if (!this.isAuthenticated) {
            throw new Error("Not authenticated");
        }

        try {
            console.log(`Uploading file: ${file.name} (${file.size} bytes)`);

            // Tạo folder cho task nếu có taskId
            let folderPath = this.libraryName;
            if (taskId) {
                const taskFolder = `Task_${taskId}`;
                await this.ensureFolderExists(taskFolder);
                folderPath = `${this.libraryName}/${taskFolder}`;
            }

            // Tạo tên file unique
            const fileName = this.generateUniqueFileName(file.name);

            // Đúng format server relative URL cho SharePoint
            const serverRelativeUrl = `/sites/intern-data/${folderPath}`;

            console.log(`Uploading to path: ${serverRelativeUrl}/${fileName}`);

            // Upload file - sử dụng getFolderByServerRelativePath thay vì getFolderByServerRelativeUrl
            const fileAddResult = await this.sp.web
                .getFolderByServerRelativePath(serverRelativeUrl)
                .files.addUsingPath(fileName, file, { Overwrite: true });

            // Lấy thông tin file
            const fileInfo = await fileAddResult.file.select("UniqueId", "ServerRelativeUrl", "Name")();
            const fullUrl = `${this.siteUrl}${fileInfo.ServerRelativeUrl}`;

            console.log(`File uploaded successfully: ${fullUrl}`);

            return {
                url: fullUrl,
                fileName: fileName,
                fileId: fileInfo.UniqueId,
                serverRelativeUrl: fileInfo.ServerRelativeUrl
            };

        } catch (error) {
            console.error("Error uploading file:", error);
            throw new Error(`Upload failed for ${file.name}: ${this.getErrorMessage(error)}`);
        }
    }

    // Upload multiple files với progress tracking
    async uploadMultipleFiles(files: File[], taskId?: string, onProgress?: (progress: number) => void): Promise<UploadResult[]> {
        const results: UploadResult[] = [];
        const totalFiles = files.length;

        console.log(`Starting upload of ${totalFiles} files`);

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            try {
                console.log(`Uploading file ${i + 1}/${totalFiles}: ${file.name}`);
                const result = await this.uploadFile(file, taskId);
                results.push(result);

                if (onProgress) {
                    onProgress(Math.round(((i + 1) / totalFiles) * 100));
                }
            } catch (error) {
                console.error(`Failed to upload file ${file.name}:`, error);
                // Continue với file khác
            }
        }

        console.log(`Upload completed. ${results.length}/${totalFiles} files uploaded successfully`);
        return results;
    }

    // Tạo folder với better error handling
    private async ensureFolderExists(folderName: string): Promise<void> {
        try {
            // Kiểm tra folder đã tồn tại
            const folders = await this.sp.web.lists.getByTitle(this.libraryName)
                .rootFolder.folders.filter(`Name eq '${folderName}'`).select("Name")();
            if (folders.length > 0) {
                console.log(`Folder ${folderName} already exists`);
                return;
            }
        } catch (error) {
            // Folder chưa tồn tại, tạo mới
            try {
                await this.sp.web.lists.getByTitle(this.libraryName)
                    .rootFolder.folders.addUsingPath(folderName);
                console.log(`Folder ${folderName} created successfully`);
            } catch (createError) {
                console.error(`Error creating folder ${folderName}:`, createError);
                // Không throw error nếu folder creation fails
            }
        }
    }

    // Generate unique filename - improved version
    private generateUniqueFileName(originalName: string): string {
        const now = new Date();
        const timestamp = now.getTime();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');

        const lastDotIndex = originalName.lastIndexOf('.');
        if (lastDotIndex === -1) {
            // No extension
            return `${originalName}_${dateStr}_${timestamp}`;
        }

        const extension = originalName.substring(lastDotIndex);
        const nameWithoutExt = originalName.substring(0, lastDotIndex);

        // Clean name - remove special characters
        const cleanName = nameWithoutExt.replace(/[^a-zA-Z0-9_-]/g, '_');

        return `${cleanName}_${dateStr}_${timestamp}${extension}`;
    }

    // Xóa file - sửa lại method name
    async deleteFile(serverRelativeUrl: string): Promise<void> {
        if (!this.isAuthenticated) {
            throw new Error("Not authenticated");
        }

        try {
            console.log(`Deleting file: ${serverRelativeUrl}`);
            await this.sp.web.getFileByServerRelativePath(serverRelativeUrl).delete();
            console.log("File deleted successfully");
        } catch (error) {
            console.error("Error deleting file:", error);
            throw new Error(`Delete failed: ${this.getErrorMessage(error)}`);
        }
    }

    // Tạo Tasks list với unique name
    async createTasksList(): Promise<void> {
        if (!this.isAuthenticated) {
            throw new Error("Not authenticated");
        }

        try {
            console.log(`Creating Tasks list: ${this.taskListName}`);

            // Kiểm tra list đã tồn tại
            try {
                await this.sp.web.lists.getByTitle(this.taskListName).select("Title")();
                console.log("Tasks list already exists");
                return;
            } catch {
                // List chưa tồn tại, continue tạo mới
            }

            const listInfo = await this.sp.web.lists.add(
                this.taskListName,
                "Task management list for Jsonic86 - Created 2025-06-19",
                100
            );

            console.log("Tasks list created:", listInfo.data.Title);

            // Thêm các fields với proper error handling
            const fieldsToAdd = [
                { name: "Description", type: "text", textConfig: { MaxLength: 1000 } },
                { name: "Status", type: "choice", choiceConfig: { Choices: ["todo", "in-progress", "completed"], DefaultValue: "todo" } },
                { name: "Priority", type: "choice", choiceConfig: { Choices: ["low", "medium", "high"], DefaultValue: "medium" } },
                { name: "Assignee", type: "text", textConfig: { MaxLength: 255 } },
                { name: "DueDate", type: "datetime", dateTimeConfig: {} },
                { name: "Attachments", type: "multiline", multilineConfig: { RichText: false } }
            ];

            for (const field of fieldsToAdd) {
                try {
                    switch (field.type) {
                        case "text":
                            await this.sp.web.lists.getByTitle(this.taskListName).fields.addText(field.name, field.textConfig);
                            break;
                        case "choice":
                            await this.sp.web.lists.getByTitle(this.taskListName).fields.addChoice(field.name, field.choiceConfig);
                            break;
                        case "datetime":
                            await this.sp.web.lists.getByTitle(this.taskListName).fields.addDateTime(field.name, field.dateTimeConfig);
                            break;
                        case "multiline":
                            await this.sp.web.lists.getByTitle(this.taskListName).fields.addMultilineText(field.name, field.multilineConfig);
                            break;
                    }
                    console.log(`Field ${field.name} added successfully`);
                } catch (fieldError) {
                    console.error(`Error adding field ${field.name}:`, fieldError);
                    // Continue với field khác
                }
            }

            console.log("Tasks list setup completed");

        } catch (error) {
            console.error("Error creating Tasks list:", error);
            if (this.isErrorWithMessage(error) && error.message.includes("already exists")) {
                console.log("Tasks list already exists (caught in error)");
            } else {
                throw new Error(`Failed to create Tasks list: ${this.getErrorMessage(error)}`);
            }
        }
    }

    // Tạo task với better date handling
    async createTask(taskData: Omit<Task, 'id' | 'createdDate' | 'updatedDate'>, files?: File[]): Promise<Task> {
        if (!this.isAuthenticated) {
            throw new Error("Not authenticated");
        }

        try {
            console.log("Creating task:", taskData.title);

            // Prepare task data
            const taskPayload = {
                Title: taskData.title,
                Description: taskData.description || '',
                Status: taskData.status,
                Priority: taskData.priority,
                Assignee: taskData.assignee,
                DueDate: taskData.dueDate ? new Date(taskData.dueDate).toISOString() : null,
                Attachments: JSON.stringify([])
            };

            const taskResult = await this.sp.web.lists.getByTitle(this.taskListName).items.add(taskPayload);
            const taskId = taskResult.data.Id.toString();

            console.log("Task created with ID:", taskId);

            // Upload files nếu có
            let attachments: TaskAttachment[] = [];
            if (files && files.length > 0) {
                console.log(`Uploading ${files.length} files for task ${taskId}`);
                const uploadResults = await this.uploadMultipleFiles(files, taskId);
                attachments = uploadResults.map(result => ({
                    id: result.fileId,
                    fileName: result.fileName,
                    url: result.url,
                    uploadDate: new Date().toISOString(),
                    size: 0
                }));

                // Update task với attachments
                await this.sp.web.lists.getByTitle(this.taskListName).items.getById(parseInt(taskId)).update({
                    Attachments: JSON.stringify(attachments)
                });

                console.log(`${attachments.length} files attached to task ${taskId}`);
            }

            return {
                id: taskId,
                ...taskData,
                attachments,
                createdDate: new Date().toISOString(),
                updatedDate: new Date().toISOString()
            };

        } catch (error) {
            console.error("Error creating task:", error);
            throw new Error(`Failed to create task: ${this.getErrorMessage(error)}`);
        }
    }

    // Add attachments to existing task
    async addAttachmentsToTask(taskId: string, files: File[]): Promise<TaskAttachment[]> {
        if (!this.isAuthenticated) {
            throw new Error("Not authenticated");
        }

        try {
            console.log(`Adding ${files.length} attachments to task ${taskId}`);

            const currentTask = await this.sp.web.lists.getByTitle(this.taskListName).items.getById(parseInt(taskId))();
            const currentAttachments: TaskAttachment[] = JSON.parse(currentTask.Attachments || '[]');

            const uploadResults = await this.uploadMultipleFiles(files, taskId);
            const newAttachments: TaskAttachment[] = uploadResults.map(result => ({
                id: result.fileId,
                fileName: result.fileName,
                url: result.url,
                uploadDate: new Date().toISOString()
            }));

            const allAttachments = [...currentAttachments, ...newAttachments];

            await this.sp.web.lists.getByTitle(this.taskListName).items.getById(parseInt(taskId)).update({
                Attachments: JSON.stringify(allAttachments)
            });

            console.log(`Successfully added ${newAttachments.length} attachments to task ${taskId}`);
            return allAttachments;

        } catch (error) {
            console.error("Error adding attachments:", error);
            throw new Error(`Failed to add attachments: ${this.getErrorMessage(error)}`);
        }
    }

    // Remove attachment
    async removeAttachment(taskId: string, attachmentId: string): Promise<void> {
        if (!this.isAuthenticated) {
            throw new Error("Not authenticated");
        }

        try {
            console.log(`Removing attachment ${attachmentId} from task ${taskId}`);

            const currentTask = await this.sp.web.lists.getByTitle(this.taskListName).items.getById(parseInt(taskId))();
            const currentAttachments: TaskAttachment[] = JSON.parse(currentTask.Attachments || '[]');

            const attachmentToDelete = currentAttachments.find(att => att.id === attachmentId);
            if (attachmentToDelete) {
                const serverRelativeUrl = attachmentToDelete.url.replace(this.siteUrl, '');
                await this.deleteFile(serverRelativeUrl);
            }

            const updatedAttachments = currentAttachments.filter(att => att.id !== attachmentId);

            await this.sp.web.lists.getByTitle(this.taskListName).items.getById(parseInt(taskId)).update({
                Attachments: JSON.stringify(updatedAttachments)
            });

            console.log(`Attachment removed successfully from task ${taskId}`);

        } catch (error) {
            console.error("Error removing attachment:", error);
            throw new Error(`Failed to remove attachment: ${this.getErrorMessage(error)}`);
        }
    }

    // Get all tasks với better error handling
    async getAllTasks(): Promise<Task[]> {
        if (!this.isAuthenticated) {
            throw new Error("Not authenticated");
        }

        try {
            console.log("Fetching all tasks...");

            const items = await this.sp.web.lists.getByTitle(this.taskListName).items
                .select("Id", "Title", "Description", "Status", "Priority", "Assignee", "DueDate", "Attachments", "Created", "Modified")
                .orderBy("Created", false)
                .top(100)();

            const tasks = items.map(item => ({
                id: item.Id.toString(),
                title: item.Title || '',
                description: item.Description || '',
                status: item.Status || 'todo',
                priority: item.Priority || 'medium',
                assignee: item.Assignee || '',
                dueDate: item.DueDate || new Date().toISOString(),
                attachments: JSON.parse(item.Attachments || '[]'),
                createdDate: item.Created,
                updatedDate: item.Modified
            }));

            console.log(`Fetched ${tasks.length} tasks`);
            return tasks;

        } catch (error) {
            console.error("Error getting tasks:", error);
            throw new Error(`Failed to get tasks: ${this.getErrorMessage(error)}`);
        }
    }

    // Get authentication status
    getAuthenticationStatus(): boolean {
        return this.isAuthenticated;
    }

    // Get current user info
    async getCurrentUser(): Promise<any> {
        if (!this.isAuthenticated) return null;

        try {
            const user = await this.sp.web.currentUser();
            return user;
        } catch (error) {
            console.error("Error getting current user:", error);
            return null;
        }
    }

    // Logout
    async logout(): Promise<void> {
        try {
            await msalInstance.logoutPopup();
            this.isAuthenticated = false;
            console.log("Logged out successfully");
        } catch (error) {
            console.error("Logout error:", error);
        }
    }
}

export default SharePointService;
export type { Task, TaskAttachment, UploadResult };