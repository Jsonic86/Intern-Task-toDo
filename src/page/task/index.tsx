import React, { useState, useEffect } from 'react';
import {
    Table,
    Button,
    Modal,
    Form,
    Input,
    Select,
    Upload,
    message,
    Space,
    Tag,
    Popconfirm,
    Tooltip,
    DatePicker,
    Card,
    Spin
} from 'antd';
import {
    PlusOutlined,
    UploadOutlined,
    DownloadOutlined,
    DeleteOutlined,
    PaperClipOutlined,
    LoginOutlined,
    FileOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd/es/upload/interface';
import SharePointService from '../../service/todo/sharepoint-service/index';
import type { Task, TaskAttachment } from '../../service/todo/sharepoint-service/index';
import moment from 'moment';

const { Option } = Select;
const { TextArea } = Input;

const TaskManager: React.FC = () => {
    const [spService] = useState(new SharePointService());
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(false);
    const [authenticated, setAuthenticated] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [uploading, setUploading] = useState(false);

    const handleAuthentication = async () => {
        setLoading(true);
        try {
            const authResult = await spService.authenticate();
            if (authResult) {
                setAuthenticated(true);
                message.success('Đăng nhập thành công!');
                await initializeSharePoint();
                await loadTasks();
            } else {
                message.error('Đăng nhập thất bại!');
            }
        } catch (error) {
            message.error('Lỗi khi đăng nhập');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const initializeSharePoint = async () => {
        try {
            // Tạo Document Library nếu chưa có
            const libraryExists = await spService.checkLibraryExists();
            if (!libraryExists) {
                await spService.createDocumentLibrary();
                message.success('Document Library "Jsonic86" đã được tạo thành công!');
            } else {
                message.info('Document Library "Jsonic86" đã tồn tại');
            }

            // Tạo Tasks list nếu chưa có
            await spService.createTasksList();

        } catch (error) {
            console.error('Error initializing SharePoint:', error);
            message.error('Lỗi khi khởi tạo SharePoint');
        }
    };

    const loadTasks = async () => {
        if (!authenticated) return;

        setLoading(true);
        try {
            const taskData = await spService.getAllTasks();
            setTasks(taskData);
        } catch (error) {
            message.error('Lỗi khi tải danh sách công việc');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTask = async (values: any) => {
        setUploading(true);
        try {
            // Convert UploadFile[] to File[]
            const files = fileList
                .filter(file => file.originFileObj)
                .map(file => file.originFileObj as File);

            await spService.createTask({
                title: values.title,
                description: values.description || '',
                status: values.status,
                priority: values.priority,
                assignee: values.assignee,
                dueDate: values.dueDate.toISOString(),
                attachments: []
            }, files);

            message.success('Tạo công việc thành công!');
            setModalVisible(false);
            form.resetFields();
            setFileList([]);
            await loadTasks();
        } catch (error) {
            message.error('Lỗi khi tạo công việc');
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    const handleDownloadFile = (url: string, fileName: string) => {
        // Mở file trong tab mới để download
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDeleteAttachment = async (taskId: string, attachmentId: string) => {
        try {
            await spService.removeAttachment(taskId, attachmentId);
            message.success('Xóa file thành công!');
            await loadTasks();
        } catch (error) {
            message.error('Lỗi khi xóa file');
            console.error(error);
        }
    };

    const handleAddAttachment = async (taskId: string, files: File[]) => {
        try {
            setUploading(true);
            await spService.addAttachmentsToTask(taskId, files);
            message.success('Thêm file thành công!');
            await loadTasks();
        } catch (error) {
            message.error('Lỗi khi thêm file');
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    const uploadProps = {
        beforeUpload: (file: File) => {
            // Kiểm tra kích thước file (max 10MB)
            const isLt10M = file.size / 1024 / 1024 < 10;
            if (!isLt10M) {
                message.error('File phải nhỏ hơn 10MB!');
                return false;
            }
            return false; // Không upload ngay, chỉ thêm vào list
        },
        fileList,
        onChange: ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
            setFileList(newFileList);
        },
        multiple: true,
        accept: '*/*', // Cho phép tất cả các loại file
    };

    const columns: ColumnsType<Task> = [
        {
            title: 'Tiêu đề',
            dataIndex: 'title',
            key: 'title',
            width: 200,
            ellipsis: true,
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            width: 250,
            ellipsis: true,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status: string) => {
                const colorMap = {
                    'todo': 'orange',
                    'in-progress': 'blue',
                    'completed': 'green'
                };
                const textMap = {
                    'todo': 'Chưa bắt đầu',
                    'in-progress': 'Đang thực hiện',
                    'completed': 'Hoàn thành'
                };
                return (
                    <Tag color={colorMap[status as keyof typeof colorMap]}>
                        {textMap[status as keyof typeof textMap]}
                    </Tag>
                );
            },
        },
        {
            title: 'Độ ưu tiên',
            dataIndex: 'priority',
            key: 'priority',
            width: 120,
            render: (priority: string) => {
                const colorMap = {
                    'high': 'red',
                    'medium': 'orange',
                    'low': 'default'
                };
                const textMap = {
                    'high': 'Cao',
                    'medium': 'Trung bình',
                    'low': 'Thấp'
                };
                return (
                    <Tag color={colorMap[priority as keyof typeof colorMap]}>
                        {textMap[priority as keyof typeof textMap]}
                    </Tag>
                );
            },
        },
        {
            title: 'Người thực hiện',
            dataIndex: 'assignee',
            key: 'assignee',
            width: 150,
            ellipsis: true,
        },
        {
            title: 'Hạn hoàn thành',
            dataIndex: 'dueDate',
            key: 'dueDate',
            width: 120,
            render: (date: string) => moment(date).format('DD/MM/YYYY'),
        },
        {
            title: 'File đính kèm',
            dataIndex: 'attachments',
            key: 'attachments',
            width: 300,
            render: (attachments: TaskAttachment[], record: Task) => (
                <Card size="small" bodyStyle={{ padding: '8px' }}>
                    {attachments.length > 0 ? (
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                            <Tag icon={<PaperClipOutlined />} color="blue">
                                {attachments.length} file(s)
                            </Tag>
                            {attachments.map(attachment => (
                                <div key={attachment.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '4px 0'
                                    }}>
                                    <Tooltip title={attachment.fileName}>
                                        <Button
                                            type="link"
                                            size="small"
                                            icon={<FileOutlined />}
                                            onClick={() => handleDownloadFile(attachment.url, attachment.fileName)}
                                            style={{
                                                maxWidth: '150px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                padding: 0
                                            }}
                                        >
                                            {attachment.fileName.length > 20
                                                ? `${attachment.fileName.substring(0, 17)}...`
                                                : attachment.fileName}
                                        </Button>
                                    </Tooltip>
                                    <Popconfirm
                                        title="Bạn có chắc muốn xóa file này?"
                                        onConfirm={() => handleDeleteAttachment(record.id, attachment.id)}
                                        okText="Có"
                                        cancelText="Không"
                                    >
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<DeleteOutlined />}
                                            danger
                                        />
                                    </Popconfirm>
                                </div>
                            ))}
                        </Space>
                    ) : (
                        <span style={{ color: '#999', fontSize: '12px' }}>Chưa có file</span>
                    )}

                    <Upload
                        {...{
                            beforeUpload: (file: File) => {
                                const isLt10M = file.size / 1024 / 1024 < 10;
                                if (!isLt10M) {
                                    message.error('File phải nhỏ hơn 10MB!');
                                    return false;
                                }
                                return false;
                            },
                            multiple: true,
                            showUploadList: false,
                            onChange: ({ fileList: newFileList }) => {
                                if (newFileList.length > 0) {
                                    const files = newFileList
                                        .filter(file => file.originFileObj)
                                        .map(file => file.originFileObj as File);
                                    handleAddAttachment(record.id, files);
                                }
                            }
                        }}
                    >
                        <Button
                            icon={<UploadOutlined />}
                            size="small"
                            style={{ marginTop: '8px', width: '100%' }}
                            loading={uploading}
                        >
                            Thêm file
                        </Button>
                    </Upload>
                </Card>
            ),
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdDate',
            key: 'createdDate',
            width: 120,
            render: (date: string) => moment(date).format('DD/MM/YYYY'),
        },
    ];

    // if (!authenticated) {
    //     return (
    //         <div style={{
    //             display: 'flex',
    //             justifyContent: 'center',
    //             alignItems: 'center',
    //             height: '100vh',
    //             flexDirection: 'column'
    //         }}>
    //             <Card style={{ width: 400, textAlign: 'center' }}>
    //                 <Space direction="vertical" size="large">
    //                     <h2>Quản lý Công việc - Jsonic86</h2>
    //                     <p>Đăng nhập để truy cập SharePoint</p>
    //                     <p><strong>Site:</strong> https://1work.sharepoint.com/sites/intern-data</p>
    //                     <p><strong>User:</strong> Jsonic86</p>
    //                     <Button
    //                         type="primary"
    //                         icon={<LoginOutlined />}
    //                         onClick={handleAuthentication}
    //                         loading={loading}
    //                         size="large"
    //                     >
    //                         Đăng nhập SharePoint
    //                     </Button>
    //                 </Space>
    //             </Card>
    //         </div>
    //     );
    // }

    return (
        <Spin spinning={loading}>
            <div style={{ padding: 24 }}>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1>Quản lý Công việc - Jsonic86</h1>
                        <p style={{ color: '#666', margin: 0 }}>
                            SharePoint Site: https://1work.sharepoint.com/sites/intern-data
                        </p>
                    </div>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setModalVisible(true)}
                        size="large"
                    >
                        Tạo công việc mới
                    </Button>
                </div>

                <Table
                    columns={columns}
                    dataSource={tasks}
                    rowKey="id"
                    loading={loading}
                    scroll={{ x: 1400 }}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                            `${range[0]}-${range[1]} của ${total} công việc`,
                    }}
                />

                <Modal
                    title="Tạo công việc mới"
                    open={modalVisible}
                    onCancel={() => {
                        setModalVisible(false);
                        form.resetFields();
                        setFileList([]);
                    }}
                    footer={null}
                    width={800}
                    destroyOnClose
                >
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleCreateTask}
                    >
                        <Form.Item
                            name="title"
                            label="Tiêu đề"
                            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}
                        >
                            <Input placeholder="Nhập tiêu đề công việc" />
                        </Form.Item>

                        <Form.Item
                            name="description"
                            label="Mô tả"
                        >
                            <TextArea rows={4} placeholder="Nhập mô tả công việc" />
                        </Form.Item>

                        <Form.Item
                            name="status"
                            label="Trạng thái"
                            rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
                        >
                            <Select placeholder="Chọn trạng thái">
                                <Option value="todo">Chưa bắt đầu</Option>
                                <Option value="in-progress">Đang thực hiện</Option>
                                <Option value="completed">Hoàn thành</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="priority"
                            label="Độ ưu tiên"
                            rules={[{ required: true, message: 'Vui lòng chọn độ ưu tiên!' }]}
                        >
                            <Select placeholder="Chọn độ ưu tiên">
                                <Option value="low">Thấp</Option>
                                <Option value="medium">Trung bình</Option>
                                <Option value="high">Cao</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="assignee"
                            label="Người thực hiện"
                            rules={[{ required: true, message: 'Vui lòng nhập người thực hiện!' }]}
                        >
                            <Input placeholder="Nhập tên người thực hiện" />
                        </Form.Item>

                        <Form.Item
                            name="dueDate"
                            label="Hạn hoàn thành"
                            rules={[{ required: true, message: 'Vui lòng chọn hạn hoàn thành!' }]}
                        >
                            <DatePicker
                                style={{ width: '100%' }}
                                placeholder="Chọn ngày hạn hoàn thành"
                                format="DD/MM/YYYY"
                            />
                        </Form.Item>

                        <Form.Item
                            name="attachments"
                            label="File đính kèm (không giới hạn số lượng)"
                        >
                            <Upload {...uploadProps}>
                                <Button icon={<UploadOutlined />}>
                                    Chọn file (max 10MB/file)
                                </Button>
                            </Upload>
                            {fileList.length > 0 && (
                                <div style={{ marginTop: 8 }}>
                                    <Tag color="blue">{fileList.length} file(s) đã chọn</Tag>
                                </div>
                            )}
                        </Form.Item>

                        <Form.Item>
                            <Space>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={uploading}
                                    icon={<PlusOutlined />}
                                >
                                    Tạo công việc
                                </Button>
                                <Button onClick={() => setModalVisible(false)}>
                                    Hủy
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        </Spin>
    );
};

export default TaskManager;