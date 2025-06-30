import { CustomAxios } from "../../../ulti/customAxios";

const uploadFile = async (file: File, taskId: string): Promise<any> => {
    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await CustomAxios.post(`/sharepoint/upload?taskId=${taskId}`, formData);
        return await response;
    } catch (error) {
        console.error("Error uploading file:", error);
        throw error;
    }
}
const getFiles = async (fileId: string): Promise<any> => {
    try {
        const response = await CustomAxios.get(`/sharepoint/list?taskId=${fileId}`);
        return await response;
    } catch (error) {
        console.error("Error fetching files:", error);
        throw error;
    }
}
const downloadFile = async (filename: string, taskId: string): Promise<any> => {
    try {
        const response = await CustomAxios.get(`/sharepoint/download/${filename}?taskId=${taskId}`);
        return await response;
    } catch (error) {
        console.error("Error downloading file:", error);
        throw error;
    }
}
const deleteFile = async (filename: string, taskId: string): Promise<any> => {
    try {
        const response = await CustomAxios.delete(`/sharepoint/delete?filename=${filename}&taskId=${taskId}`);
        return await response;
    } catch (error) {
        console.error("Error deleting file:", error);
        throw error;
    }
}
export const sharepointService = {
    uploadFile,
    getFiles,
    downloadFile,
    deleteFile
}