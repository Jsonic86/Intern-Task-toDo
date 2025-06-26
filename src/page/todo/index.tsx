import { Button, Input, Modal, notification, Select, Table, type TableColumnsType } from "antd";
import { useEffect, useState } from "react";
import { CheckCircleOutlined, CloseOutlined } from '@ant-design/icons';
import type { TodoProps } from "../../constant/todo.type";
import { todoService } from "../../service/todo";
import { setLanguage } from "../../store/languageSlice";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../store";
import { MsalProvider, useMsal } from "@azure/msal-react";
import { loginRequest, msalInstance } from "../../setup/msalConfig";
import { Profile } from "./Profile";
import { InteractionRequiredAuthError } from "@azure/msal-browser";


type ProfileData = {
    displayName: string;
    userPrincipalName: string;
    [key: string]: any;
};

const Todo = () => {
    const { t, i18n } = useTranslation();
    const { instance, accounts } = useMsal();
    const [siteId, setSiteId] = useState<string | null>(null);
    const [driveId, setDriveId] = useState<string | null>(null);
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [api, contextHolder] = notification.useNotification();
    const [todos, setTodos] = useState<TodoProps[]>([

    ]);
    const [todosTemp, setTodosTemp] = useState<TodoProps[]>([]);
    const [newTodo, setNewTodo] = useState<string>('');
    const [filter, setFilter] = useState<'all' | 'completed' | 'incomplete'>('all');
    const [incompleteCount, setIncompleteCount] = useState<number>(0);
    const handleDeleteTodo = (id: string) => {
        if (!window.confirm(t('confirmDelete'))) {
            return;
        }
        const response = todoService.deleteTodo(id);
        response.then((res) => {
            if (res?.data.success) {
                openNotification(t('deleteTodoSuccess'));
                fetchTodos();
            }
        })
    }
    const [isModalOpen, setIsModalOpen] = useState(false);

    const showModal = () => {
        setIsModalOpen(true);
    };
    const openNotification = (message: string) => {
        api.info({
            message,
            placement: 'topRight',
        });
    };
    const handleOk = async () => {
        if (newTodo.trim() === '') {
            return;
        }
        const response = await todoService.saveTodos(
            newTodo
        );
        if (!response?.data.success) {
            openNotification(t('addFailed'));
            return;
        }
        openNotification(t('addSuccess'));
        setNewTodo('');
        fetchTodos();
        setIsModalOpen(false);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };
    const handleCompleteTodo = async (id: string) => {
        if (!window.confirm(t('confirmComplete'))) {
            return;
        }
        const response = await todoService.updateTodoStatus(id);
        if (!response?.data.success) {
            openNotification(t('completeFailed'));
            return;
        }
        fetchTodos();
        openNotification(t('completeSuccess'));
    }
    const handleChangeStatus = (value: 'all' | 'completed' | 'incomplete') => {

        setFilter(value);
    }
    const fetchProfileAndIds = async (taskId?: string) => {
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
                (drive: any) => drive.name === `sonni${taskId ? '/' + taskId : ''}` // Thay đổi tên thư viện nếu cần
            );
            if (!targetDrive)
                throw new Error("Không tìm thấy thư viện ");
            setDriveId(targetDrive.id);
        } catch (error) {
            if (error instanceof InteractionRequiredAuthError) {
                instance.acquireTokenRedirect(loginRequest);
            } else {
                console.error(error);
                // setUploadStatus(`Lỗi: ${(error as any).message}`);
            }
        }
    };
    // Lấy profile và site/drive IDs
    useEffect(() => {
        console.log("accounts:", accounts);


        if (accounts && accounts.length > 0) {
            fetchProfileAndIds();
        }
    }, [accounts, instance]);
    const columns: TableColumnsType<TodoProps> = [
        {
            title: t('title'),
            dataIndex: 'title',
            key: 'title',
            render: (text) => (
                <span style={{ fontWeight: 500 }}>{text}</span>
            ),
        },
        {
            title: t('completed'),
            dataIndex: 'completed',
            key: 'completed',
            render: (text, record) => (
                <span style={{
                    color: record.completed ? '#52c41a' : '#f5222d',
                    fontWeight: 600
                }}>
                    {record.completed ? 'Yes' : 'No'}
                </span>
            ),
        },
        {
            title: t('files'),
            dataIndex: 'file',
            key: 'file',
            render: (text, record) => (
                <span >
                    <Profile taskId={record.id} accounts={accounts} driveId={driveId} instance={instance} siteId={siteId} profileData={profileData!} />
                </span>
            ),
        },
        {
            title: t('action'),
            key: 'actions',
            render: (text, record) => (
                <span className="flex gap-4">
                    <Button
                        type="text"
                        danger
                        shape="circle"
                        icon={<CloseOutlined />}
                        onClick={() => handleDeleteTodo(record.id!)}
                        title="Delete"
                    />
                    <Button
                        type="text"
                        shape="circle"
                        icon={<CheckCircleOutlined style={{ color: record.completed ? '#52c41a' : '#1890ff' }} />}
                        onClick={() => handleCompleteTodo(record.id!)}
                        disabled={record.completed}
                        title="Mark as completed"
                    />
                </span>
            ),
        },
    ];

    const fetchTodos = async () => {
        try {
            const filterParam = filter === 'all' ? undefined : filter === 'completed' ? true : false;
            const data = await todoService.getTodos(filterParam);
            setTodos(data?.data);
            setTodosTemp(data?.data || []);
        }
        catch (error) {
            console.error('Failed to fetch todos:', error);
        }
    }

    const dispatch = useDispatch();
    const lang = useSelector((state: RootState) => state.language.currentLang);

    const changeLang = (lng: string) => {
        dispatch(setLanguage(lng));
        i18n.changeLanguage(lng);
    };


    useEffect(() => {
        fetchTodos();
    }, [filter])
    useEffect(() => {
        const countTasks = async () => {
            const data = await todoService.getTodos(undefined);
            setIncompleteCount(data?.data.filter((todo: any) => !todo.completed).length);
        }
        countTasks();
    }, [todosTemp])
    return (
        <>
            <MsalProvider instance={msalInstance}>
                {contextHolder}
                <div className="flex items-center justify-between p-4 bg-#fafafa rounded-xl mb-6 shadow-lg" >
                    <div className="text-2xl font-bold text-#1890ff" >
                        {t('todoList')}
                    </div>
                    <div className="flex items-center gap-4">
                        <Button onClick={() => changeLang('en')} style={{ marginRight: '8px' }}>
                            English
                        </Button>
                        <Button onClick={() => changeLang('vi')}>
                            Tiếng Việt
                        </Button>
                        <Button type="primary" onClick={showModal}>
                            {t('addTodo')}
                        </Button>
                    </div>
                </div>
                <Modal
                    title={t('addTodo')}
                    closable={{ 'aria-label': 'Custom Close Button' }}
                    open={isModalOpen}
                    onOk={handleOk}
                    onCancel={handleCancel}
                >
                    <Input
                        placeholder="Enter todo title"
                        className="w-full"
                        value={newTodo}
                        onChange={(e) => setNewTodo(e.target.value)}
                        style={{ marginBottom: 12 }}
                    />
                </Modal>
                <div
                    className="max-w-full my-0  bg-#fff shadow-lg rounded-lg p-6 mx-auto "
                >
                    <Table<TodoProps>
                        columns={columns}
                        dataSource={todosTemp}
                        size="middle"
                        rowKey="id"
                        pagination={{ pageSize: 4 }}
                        scroll={{ y: 300 }}
                    />
                </div>


                {/* <Upload /> */}
                <div
                    className="flex items-center justify-end p-4 bg-#fafafa rounded-xl shadow-lg mt-6 fixed bottom-0 left-0 right-0 gap-5"
                >
                    <span><strong>{t('incompletedCount')} :</strong> {incompleteCount}</span>
                    <div className="flex items-center gap-4">

                        <Select onChange={handleChangeStatus} style={{ width: 140 }} defaultValue={'all'}>
                            <Select.Option value="all"> {t('all')}</Select.Option>
                            <Select.Option value="completed"> {t('completed')}</Select.Option>
                            <Select.Option value="incomplete">{t('incomplete')}</Select.Option>
                        </Select>
                    </div>
                </div>
            </MsalProvider>
        </>
    )
}

export default Todo