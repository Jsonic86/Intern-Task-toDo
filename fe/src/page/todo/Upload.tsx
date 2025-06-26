import {
    InteractionRequiredAuthError,
    PublicClientApplication,
} from "@azure/msal-browser";
import { MsalProvider, useMsal } from "@azure/msal-react";
import { useEffect, useState } from "react";

// Cấu hình MSAL
const msalConfig = {
    auth: {
        clientId: "ba343fef-be4a-455d-8d99-75b732cbdda6",
        authority:
            "https://login.microsoftonline.com/8d72c235-dd33-4381-b69c-95c5221f9041",
        redirectUri: "http://localhost:10132",
    },
    cache: {
        cacheLocation: "localStorage",
        storeAuthStateInCookie: true,
    },
};

const loginRequest = {
    scopes: ["User.Read", "Files.ReadWrite.All", "Sites.ReadWrite.All"],
};

const msalInstance = new PublicClientApplication(msalConfig);

// Thành phần Profile với chức năng upload file
type ProfileData = {
    displayName: string;
    userPrincipalName: string;
    [key: string]: any;
};

function Profile() {
    const { instance, accounts } = useMsal();
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [uploadStatus, setUploadStatus] = useState("");
    const [siteId, setSiteId] = useState<string | null>(null);
    const [driveId, setDriveId] = useState<string | null>(null);
    const [folderName, setFolderName] = useState("");

    // Lấy profile và site/drive IDs
    useEffect(() => {
        console.log("accounts:", accounts);
        const fetchProfileAndIds = async () => {
            try {
                const response = await instance.acquireTokenSilent({
                    ...loginRequest,
                    account: accounts[0],
                });

                // Lấy profile
                const graphResponse = await fetch(
                    "https://graph.microsoft.com/v1.0/me",
                    {
                        headers: {
                            Authorization: `Bearer ${response.accessToken}`,
                        },
                    }
                );
                const data = await graphResponse.json();
                setProfileData(data);

                // Lấy siteId
                const siteResponse = await fetch(
                    "https://graph.microsoft.com/v1.0/sites/1work.sharepoint.com:/sites/intern-data",
                    {
                        headers: {
                            Authorization: `Bearer ${response.accessToken}`,
                        },
                    }
                );
                const siteData = await siteResponse.json();
                if (siteData.error) throw new Error(siteData.error.message);
                setSiteId(siteData.id);

                // Lấy driveId cho thư viện Attachments202505
                const driveResponse = await fetch(
                    `https://graph.microsoft.com/v1.0/sites/${siteData.id}/drives`,
                    {
                        headers: {
                            Authorization: `Bearer ${response.accessToken}`,
                        },
                    }
                );
                const driveData = await driveResponse.json();
                if (driveData.error) throw new Error(driveData.error.message);
                const targetDrive = driveData.value.find(
                    (drive: any) => drive.name === "sonni"
                );
                if (!targetDrive)
                    throw new Error("Không tìm thấy thư viện Attachments202505");
                setDriveId(targetDrive.id);
            } catch (error) {
                if (error instanceof InteractionRequiredAuthError) {
                    instance.acquireTokenRedirect(loginRequest);
                } else {
                    console.error(error);
                    setUploadStatus(`Lỗi: ${(error as any).message}`);
                }
            }
        };

        if (accounts && accounts.length > 0) {
            fetchProfileAndIds();
        }
    }, [accounts, instance]);

    const handleFileChange = (event: any) => {
        setFile(event.target.files[0]);
        setUploadStatus("");
    };

    const uploadFile = async () => {
        if (!file) {
            setUploadStatus("Vui lòng chọn file trước");
            return;
        }
        if (!siteId || !driveId) {
            setUploadStatus("Đang lấy thông tin site, vui lòng đợi...");
            return;
        }

        try {
            const response = await instance.acquireTokenSilent({
                ...loginRequest,
                account: accounts[0],
            });

            // Đường dẫn upload file
            const libraryPath = "data/fxp/Attachments202505";
            const uploadUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${driveId}/root:/${file.name}:/content`;

            // Upload file
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
                setUploadStatus("Upload file thành công!");
            } else {
                const errorData = await uploadResult.json();
                setUploadStatus(`Upload thất bại: ${errorData.error.message}`);
            }
        } catch (error) {
            if (error instanceof InteractionRequiredAuthError) {
                instance.acquireTokenRedirect(loginRequest);
            } else {
                console.error(error);
                setUploadStatus(`Lỗi upload file: ${(error as any).message}`);
            }
        }
    };

    const createFolder = async () => {
        if (!folderName.trim()) {
            setUploadStatus("Vui lòng nhập tên folder");
            return;
        }
        if (!siteId || !driveId) {
            setUploadStatus("Đang lấy thông tin site, vui lòng đợi...");
            return;
        }

        try {
            const response = await instance.acquireTokenSilent({
                ...loginRequest,
                account: accounts[0],
            });

            // API tạo folder
            const createFolderUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${driveId}/root/children`;

            const folderData = {
                name: folderName.trim(),
                folder: {},
                "@microsoft.graph.conflictBehavior": "rename"
            };

            const createResult = await fetch(createFolderUrl, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${response.accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(folderData),
            });

            if (createResult.ok) {
                const createdFolder = await createResult.json();
                setUploadStatus(`Tạo folder "${createdFolder.name}" thành công!`);
                setFolderName("");
            } else {
                const errorData = await createResult.json();
                setUploadStatus(`Tạo folder thất bại: ${errorData.error.message}`);
            }
        } catch (error) {
            if (error instanceof InteractionRequiredAuthError) {
                instance.acquireTokenRedirect(loginRequest);
            } else {
                console.error(error);
                setUploadStatus(`Lỗi tạo folder: ${(error as any).message}`);
            }
        }
    };

    return (
        <div>
            {profileData ? (
                <div>
                    <h2>{profileData.displayName}</h2>
                    <p>{profileData.userPrincipalName}</p>

                    {/* Tạo folder */}
                    <div style={{ marginBottom: "20px" }}>
                        <h3>Tạo Folder</h3>
                        <input
                            type="text"
                            placeholder="Nhập tên folder"
                            value={folderName}
                            onChange={(e) => setFolderName(e.target.value)}
                        />
                        <button
                            onClick={createFolder}
                            disabled={!folderName.trim() || !siteId || !driveId}
                        >
                            Tạo Folder
                        </button>
                    </div>

                    {/* Upload file */}
                    <div>
                        <h3>Upload File</h3>
                        <input type="file" onChange={handleFileChange} />
                        <button
                            onClick={uploadFile}
                            disabled={!file || !siteId || !driveId}
                        >
                            Upload File
                        </button>
                        {uploadStatus && <p>{uploadStatus}</p>}
                    </div>
                </div>
            ) : (
                <p>Đang tải thông tin...</p>
            )}
        </div>
    );
}

export default function Home() {
    const handleLogin = () => {
        msalInstance.loginRedirect(loginRequest);
    };

    return (
        <MsalProvider instance={msalInstance}>
            <div>
                <h1>Chào mừng đến với MSAL React App</h1>
                <button onClick={handleLogin}>Đăng nhập</button>
                <Profile />
            </div>
        </MsalProvider>
    );
}
