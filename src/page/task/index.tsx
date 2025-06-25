import React, { useEffect, useState } from "react";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { InteractionType } from "@azure/msal-browser";
import { loginRequest } from "../../setup/msalConfig";
import { Button, Input, Upload, Table, Typography } from "antd";
import type { UploadProps } from "antd";
import type { RcFile } from "antd/es/upload";
import { UploadOutlined, LoginOutlined } from "@ant-design/icons";

const SITE_URL = "https://1work.sharepoint.com/sites/intern-data";

interface Task {
    key: string;
    name: string;
    attachments: string[];
}

const TaskManager: React.FC = () => {
    const { instance, accounts } = useMsal();
    const isAuthenticated = useIsAuthenticated();

    const [accessToken, setAccessToken] = useState<string>("");
    const [taskName, setTaskName] = useState<string>("");
    const [tasks, setTasks] = useState<Task[]>([]);
    const [attachments, setAttachments] = useState<string[]>([]);

    const loginName = accounts[0]?.username.split("@")[0] || "defaultuser";

    const getAccessToken = async () => {
        const response = await instance.acquireTokenSilent({
            ...loginRequest,
            account: accounts[0],
        });
        setAccessToken(response.accessToken);
        return response.accessToken;
    };

    const login = async () => {
        try {
            await instance.loginPopup(loginRequest);
        } catch (error) {
            console.error("Login failed", error);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            getAccessToken();
        }
    }, [isAuthenticated, accounts]);

    const createLibrary = async () => {
        const token = accessToken || (await getAccessToken());

        const res = await fetch(`${SITE_URL}/_api/web/lists`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json;odata=verbose",
                "Content-Type": "application/json;odata=verbose",
            },
            body: JSON.stringify({
                __metadata: { type: "SP.List" },
                Title: loginName,
                BaseTemplate: 101,
            }),
        });

        if (!res.ok) {
            const text = await res.text();
            console.error("Tạo thư viện thất bại:", text);
        }
    };

    const uploadFile = async (file: RcFile): Promise<string> => {
        const token = accessToken || (await getAccessToken());
        const arrayBuffer = await file.arrayBuffer();

        const uploadUrl = `${SITE_URL}/_api/web/GetFolderByServerRelativeUrl('${loginName}')/Files/add(url='${file.name}',overwrite=true)`;

        const res = await fetch(uploadUrl, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json;odata=verbose",
            },
            body: arrayBuffer,
        });

        const data = await res.json();
        return data.d.ServerRelativeUrl;
    };

    const handleUpload: UploadProps["customRequest"] = async ({ file, onSuccess }) => {
        try {
            const url = await uploadFile(file as RcFile);
            setAttachments((prev) => [...prev, url]);
            if (onSuccess) onSuccess("ok");
        } catch (err) {
            console.error("Upload error", err);
        }
    };

    const handleAddTask = () => {
        setTasks((prev) => [
            ...prev,
            { key: Date.now().toString(), name: taskName, attachments },
        ]);
        setTaskName("");
        setAttachments([]);
    };

    const columns = [
        {
            title: "Tên công việc",
            dataIndex: "name",
        },
        {
            title: "Đính kèm",
            dataIndex: "attachments",
            render: (files: string[]) =>
                files.map((url, idx) => (
                    <div key={idx}>
                        <a href={`https://1work.sharepoint.com${url}`} target="_blank" rel="noreferrer">
                            Tải file {idx + 1}
                        </a>
                    </div>
                )),
        },
    ];

    return (
        <div style={{ padding: 20 }}>
            <Typography.Title level={3}>Quản lý công việc</Typography.Title>

            {!isAuthenticated ? (
                <Button onClick={login} type="primary" icon={<LoginOutlined />}>
                    Đăng nhập với Microsoft
                </Button>
            ) : (
                <>
                    <Button onClick={createLibrary} type="primary" style={{ marginBottom: 10 }}>
                        Tạo Document Library
                    </Button>

                    <Input
                        placeholder="Tên công việc"
                        value={taskName}
                        onChange={(e) => setTaskName(e.target.value)}
                        style={{ marginBottom: 10 }}
                    />

                    <Upload
                        customRequest={handleUpload}
                        multiple
                        showUploadList={true}
                    >
                        <Button icon={<UploadOutlined />}>Chọn và upload file</Button>
                    </Upload>

                    <Button type="dashed" onClick={handleAddTask} style={{ marginTop: 10 }}>
                        Thêm công việc
                    </Button>

                    <Table
                        columns={columns}
                        dataSource={tasks}
                        style={{ marginTop: 20 }}
                        pagination={false}
                    />
                </>
            )}
        </div>
    );
};

export default TaskManager;
