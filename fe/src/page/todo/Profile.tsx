import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../../setup/msalConfig";
import { useEffect, useState } from "react";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { Button, Upload, message, Collapse, List, Space, Typography, notification } from "antd";
import { UploadOutlined, FileTextOutlined, DownloadOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import { get } from "@pnp/queryable";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import { sharepointService } from "../../service/todo/sharepoint-service";

const { Panel } = Collapse;
const { Text } = Typography;

type ProfileData = {
    displayName: string;
    userPrincipalName: string;
    [key: string]: any;
};

const Profile = ({ taskId, instance, accounts, siteId, driveId, profileData }: { taskId: string, instance: any, accounts: any, siteId: string | null, driveId: string | null, profileData: ProfileData }) => {
    const { t, i18n } = useTranslation();
    const [api, contextHolder] = notification.useNotification();
    const [fileList, setFileList] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const lang = useSelector((state: RootState) => state.language.currentLang);

    const changeLang = (lng: string) => {
        i18n.changeLanguage(lng);
    };
    useEffect(() => {
        changeLang(lang);
    }, [lang]);
    const openNotification = (message: string) => {
        api.info({
            message,
            placement: 'topRight',
        });
    };
    const uploadFile = async (file: File) => {
        const { data } = await sharepointService.uploadFile(file, taskId);
        if (data.success) {
            message.success(t("uploadSuccess"));
            openNotification(t("uploadSuccess"));
            getFileList(); // Refresh file list after upload
        }
    };

    const getFileList = async () => {

        const { data } = await sharepointService.getFiles(taskId);
        console.log("response", data);
        if (data) {

            setFileList(data || []);
        } else {
            setFileList([]);
        }
    };

    const deleteFile = async (fileName: string) => {
        try {
            const response = await sharepointService.deleteFile(fileName, taskId);

            if (response.status === 200 || response.status === 204) {
                message.success(t("deleteSuccess"));
                openNotification(t("deleteSuccess"));
                getFileList(); // Refresh file list after deletion
            } else {
                throw new Error(response.message || t("deleteError"));
            }
        } catch (e) {
            console.error(e);
            message.error(t("deleteError"));
            openNotification(t("deleteError"));
        }
    };
    const downloadFile = async (fileName: string) => {
        try {
            const response = await sharepointService.downloadFile(fileName, taskId);

            if (response && response.data.content) {
                // If response.content is base64 string, clean and decode it first
                let base64Data = response.data.content;

                // Remove data URL prefix if exists (e.g., "data:application/pdf;base64,")
                if (base64Data.includes(',')) {
                    base64Data = base64Data.split(',')[1];
                }

                // Clean base64 string - remove any invalid characters
                base64Data = base64Data.replace(/[^A-Za-z0-9+/=]/g, '');

                const byteCharacters = atob(base64Data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray]);

                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                message.success(t("downloadSuccess"));
                openNotification(t("downloadSuccess"));
            } else {
                throw new Error("No file content received");
            }
        } catch (error) {
            message.error(`${t("downloadError")}: ${(error as any).message}`);
            openNotification(`${t("downloadError")}: ${(error as any).message}`);
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

        <Space direction="vertical" size="small" className="w-full">
            {contextHolder}

            <Collapse size="small" ghost>
                <Panel
                    header={
                        <Space>
                            <FileTextOutlined />
                            <Text className="text-xs">
                                {t("files")} ({fileList.length})
                            </Text>
                            <Upload {...uploadProps}>
                                <Button icon={<UploadOutlined />} loading={loading} size="small">
                                    {t("upload")}
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
                                            onClick={() => downloadFile(file.Name)}
                                        />,
                                        <Button
                                            size="small"
                                            type="text"
                                            icon={<DeleteOutlined />}
                                            onClick={() => deleteFile(file.Name)}
                                        />
                                    ]}
                                >
                                    <List.Item.Meta
                                        title={<Text className="text-xs">{file.Name}</Text>}
                                        description={
                                            <Text type="secondary" style={{ fontSize: '11px' }}>
                                                {(file.Length / 1024).toFixed(1)} KB
                                            </Text>
                                        }
                                    />
                                </List.Item>
                            )}
                        />
                    ) : (
                        <Text type="secondary" className="text-xs">
                            {t("nofiles")}
                        </Text>
                    )}
                </Panel>
            </Collapse>
        </Space>
    );
}

export { Profile };