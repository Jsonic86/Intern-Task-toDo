import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../../setup/msalConfig";
import { useEffect, useState } from "react";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { Button, Upload, message, Collapse, List, Space, Typography } from "antd";
import { UploadOutlined, FileTextOutlined, DownloadOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import { get } from "@pnp/queryable";

const { Panel } = Collapse;
const { Text } = Typography;

type ProfileData = {
    displayName: string;
    userPrincipalName: string;
    [key: string]: any;
};

const Profile = ({ taskId, instance, accounts, siteId, driveId, profileData }: { taskId: string, instance: any, accounts: any, siteId: string | null, driveId: string | null, profileData: ProfileData }) => {
    const [fileList, setFileList] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const uploadFile = async (file: File) => {
        if (!siteId || !driveId) {
            message.error("Đang lấy thông tin site, vui lòng đợi...");
            return false;
        }

        setLoading(true);
        try {
            const response = await instance.acquireTokenSilent({
                ...loginRequest,
                account: accounts[0],
            });

            // Tự động tạo folder với tên taskId
            const createFolderUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${driveId}/root/children`;
            await fetch(createFolderUrl, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${response.accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: taskId.trim(),
                    folder: {},
                    "@microsoft.graph.conflictBehavior": "replace"
                }),
            });

            // Upload file
            const uploadUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${driveId}/root:/${taskId}/${file.name}:/content`;
            const fileContent = await file.arrayBuffer();
            const uploadResult = await fetch(uploadUrl, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${response.accessToken}`,
                    "Content-Type": file.type,
                },
                body: fileContent,
            });

            if (uploadResult.ok) {
                message.success("Upload file thành công!");
                getFileList(); // Refresh file list
                return true;
            } else {
                const errorData = await uploadResult.json();
                message.error(`Upload thất bại: ${errorData.error.message}`);
                return false;
            }
        } catch (error) {
            message.error(`Lỗi upload: ${(error as any).message}`);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const getFileList = async () => {
        if (!siteId || !driveId) return;

        try {
            const response = await instance.acquireTokenSilent({
                ...loginRequest,
                account: accounts[0],
            });

            const filesUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${driveId}/root:/${taskId}:/children`;
            const filesResult = await fetch(filesUrl, {
                headers: { Authorization: `Bearer ${response.accessToken}` },
            });

            if (filesResult.ok) {
                const filesData = await filesResult.json();
                setFileList(filesData.value || []);
            } else {
                setFileList([]);
            }
        } catch (error) {
            console.error("Lỗi lấy danh sách file:", error);
        }
    };

    const deleteFile = async (fileId: string) => {
        try {
            const { accessToken } = await instance.acquireTokenSilent({
                ...loginRequest,
                account: accounts[0],
            });

            const url =
                `https://graph.microsoft.com/v1.0/sites/${siteId}` +
                `/drives/${driveId}/items/${fileId}`;   // ⚠️ bỏ /content

            const res = await fetch(url, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (res.status === 204) {
                getFileList(); // Refresh file list
                message.success("Xóa thành công!");
            } else {
                const err = await res.json().catch(() => res.statusText);
                throw new Error(err);
            }
        } catch (e) {
            console.error(e);
            message.error("Lỗi xóa file");
        }
    };
    const downloadFile = async (fileId: string, fileName: string) => {
        try {
            const response = await instance.acquireTokenSilent({
                ...loginRequest,
                account: accounts[0],
            });

            const deleteUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${driveId}/items/${fileId}/content`;
            const fileResponse = await fetch(deleteUrl, {
                headers: { Authorization: `Bearer ${response.accessToken}` },
            });

            if (fileResponse.ok) {
                const blob = await fileResponse.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                message.success("Download thành công!");
            }
        } catch (error) {
            message.error("Lỗi download file");
        }
    };
    const uploadProps = {
        beforeUpload: (file: File) => {
            uploadFile(file);
            return false; // Prevent default upload
        },
        showUploadList: false,
    };
    useEffect(() => {
        getFileList();
    }, [siteId, driveId, taskId]);
    return (
        <Space direction="vertical" size="small" style={{ width: '100%' }}>


            <Collapse size="small" ghost>
                <Panel
                    header={
                        <Space>
                            <FileTextOutlined />
                            <Text style={{ fontSize: '12px' }}>
                                Files ({fileList.length})
                            </Text>
                            <Upload {...uploadProps}>
                                <Button icon={<UploadOutlined />} loading={loading} size="small">
                                    Upload
                                </Button>
                            </Upload>
                        </Space>
                    }
                    key="1"

                >
                    {fileList.length > 0 ? (
                        <List
                            size="small"
                            dataSource={fileList}
                            renderItem={(file: any) => (
                                <List.Item
                                    actions={[
                                        <Button
                                            size="small"
                                            type="text"
                                            icon={<DownloadOutlined />}
                                            onClick={() => downloadFile(file.id, file.name)}
                                        />,
                                        <Button
                                            size="small"
                                            type="text"
                                            icon={<DeleteOutlined />}
                                            onClick={() => deleteFile(file.id)}
                                        />
                                    ]}
                                >
                                    <List.Item.Meta
                                        title={<Text style={{ fontSize: '12px' }}>{file.name}</Text>}
                                        description={
                                            <Text type="secondary" style={{ fontSize: '11px' }}>
                                                {(file.size / 1024).toFixed(1)} KB
                                            </Text>
                                        }
                                    />
                                </List.Item>
                            )}
                        />
                    ) : (
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            Chưa có file nào
                        </Text>
                    )}
                </Panel>
            </Collapse>
        </Space>
    );
}

export { Profile };