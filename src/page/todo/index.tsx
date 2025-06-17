import { Button, Input, Modal, notification, Select, Table, type TableColumnsType } from "antd";
import { useEffect, useState } from "react";
import { CheckCircleOutlined, CloseOutlined } from '@ant-design/icons';
import type { TodoProps } from "../../constant/todo.type";
import { todoService } from "../../service/todo";




const Todo = () => {
    const [api, contextHolder] = notification.useNotification();
    const [todos, setTodos] = useState<TodoProps[]>([

    ]);
    const [todosTemp, setTodosTemp] = useState<TodoProps[]>([]);
    const [newTodo, setNewTodo] = useState<string>('');
    const [filter, setFilter] = useState<'all' | 'completed' | 'incomplete'>('all');
    const handleDeleteTodo = (id: string) => {
        if (!window.confirm('Are you sure you want to delete this todo?')) {
            return;
        }
        const response = todoService.deleteTodo(id);
        response.then((res) => {
            if (res?.data.success) {
                openNotification('Todo deleted successfully');
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
    const handleOk = () => {
        if (newTodo.trim() === '') {
            return;
        }
        const response = todoService.saveTodos(
            newTodo
        );
        response.then((res) => {
            if (res?.data.success) {
                openNotification('Todo added successfully');
                setNewTodo('');
                fetchTodos();
            }
        })
        setIsModalOpen(false);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };
    const handleCompleteTodo = (id: string) => {
        if (!window.confirm('Are you sure you want to complete this todo?')) {
            return;
        }
        const response = todoService.updateTodoStatus(id);

        response.then((res) => {
            if (res?.data.success) {
                fetchTodos();
                openNotification('Todo completed successfully');
            }
        })
    }
    const handleChangeStatus = (value: 'all' | 'completed' | 'incomplete') => {

        setFilter(value);
    }
    const columns: TableColumnsType<TodoProps> = [
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            render: (text) => (
                <span style={{ fontWeight: 500 }}>{text}</span>
            ),
        },
        {
            title: 'Completed',
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
            title: 'Actions',
            key: 'actions',
            render: (text, record) => (
                <span style={{ display: 'flex', gap: 12 }}>
                    <Button
                        type="text"
                        danger
                        shape="circle"
                        icon={<CloseOutlined />}
                        onClick={() => handleDeleteTodo(record._id!)}
                        title="Delete"
                    />
                    <Button
                        type="text"
                        shape="circle"
                        icon={<CheckCircleOutlined style={{ color: record.completed ? '#52c41a' : '#1890ff' }} />}
                        onClick={() => handleCompleteTodo(record._id!)}
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
    useEffect(() => {
        fetchTodos();
    }, [filter])
    return (
        <>
            {contextHolder}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 16,
                background: '#fafafa',
                borderRadius: 8,
                marginBottom: 24,
                boxShadow: '0 2px 8px #f0f1f2'
            }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#1890ff' }}>
                    Todo List
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                    <Select onChange={handleChangeStatus} style={{ width: 140 }} defaultValue={'all'}>
                        <Select.Option value="all">All</Select.Option>
                        <Select.Option value="completed">Completed</Select.Option>
                        <Select.Option value="incomplete">Incomplete</Select.Option>
                    </Select>
                    <Button type="primary" onClick={showModal}>
                        Add todo
                    </Button>
                </div>
            </div>
            <Modal
                title="Add Todo"
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
            <div style={{
                maxWidth: 700,
                margin: '0 auto',
                background: '#fff',
                borderRadius: 8,
                boxShadow: '0 2px 8px #f0f1f2',
                padding: 24
            }}>
                <Table<TodoProps>
                    columns={columns}
                    dataSource={todosTemp}
                    size="middle"
                    rowKey="_id"
                    pagination={{ pageSize: 6 }}
                />
            </div>
        </>
    )
}

export default Todo