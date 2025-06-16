import { Button, Input, Modal, Select, Table, type TableColumnsType } from "antd";
import { useEffect, useState } from "react";
import { CheckCircleOutlined, CloseOutlined } from '@ant-design/icons';
import type { TodoProps } from "../../constant/todo.type";
import { todoService } from "../../service/todo";



const Todo = () => {
    const [todos, setTodos] = useState<TodoProps[]>([
        ...todoService.getTodos()
    ]);
    const [todosTemp, setTodosTemp] = useState<TodoProps[]>(todos);
    const [newTodo, setNewTodo] = useState<string>('');
    const [filter, setFilter] = useState<'all' | 'completed' | 'incomplete'>('all');
    const handleDeleteTodo = (id: string) => {
        if (!window.confirm('Are you sure you want to delete this todo?')) {
            return;
        }
        todoService.deleteTodo(id);
        setTodosTemp(todosTemp.filter(todo => todo.id !== id));
    }
    const [isModalOpen, setIsModalOpen] = useState(false);

    const showModal = () => {
        setIsModalOpen(true);
    };

    const handleOk = () => {
        if (newTodo.trim() === '') {
            return;
        }
        todoService.saveTodos({
            id: (Math.random() * 1000).toString(),
            title: newTodo,
            completed: false
        });
        setTodosTemp((prevTodos) => [
            ...prevTodos,
            {
                id: (Math.random() * 1000).toString(), // Simple ID generation
                title: newTodo,
                completed: false
            }
        ])
        setIsModalOpen(false);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };
    const handleCompleteTodo = (id: string) => {
        if (!window.confirm('Are you sure you want to complete this todo?')) {
            return;
        }
        const updatedTodos = todosTemp.map((todo) => {
            if (todo.id === id) {
                return { ...todo, completed: true };
            }
            return todo;
        })
        todoService.updateTodoStatus(id);
        setTodosTemp(updatedTodos);
    }
    const handleChangeStatus = (value: 'all' | 'completed' | 'incomplete') => {

        setFilter(value);
    }
    const columns: TableColumnsType<TodoProps> = [

        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
        },
        {
            title: 'Completed',
            dataIndex: 'completed',
            key: 'completed',
            render: (text, record) => (
                <span>{record.completed ? 'Yes' : 'No'}</span>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (text, record) => (
                <span className="flex items-center gap-2">
                    <a onClick={() => {
                        handleDeleteTodo(record.id);
                    }}><CloseOutlined /></a>
                    <a onClick={() => {
                        handleCompleteTodo(record.id);
                    }}><CheckCircleOutlined /></a>
                </span>
            ),
        },
    ];
    useEffect(() => {
        const filteredTodos = todoService.getTodosByFiler(filter);
        setTodosTemp(filteredTodos);
    }, [filter])
    return (
        <>
            <div className="flex items-center justify-end p-2 gap-3">
                <Button type="primary" onClick={showModal}>
                    Add todo
                </Button>
                <Modal
                    title="Add Todo"
                    closable={{ 'aria-label': 'Custom Close Button' }}
                    open={isModalOpen}
                    onOk={handleOk}
                    onCancel={handleCancel}
                >
                    <Input placeholder="title" className="w-full" onChange={(e) => {
                        setNewTodo(e.target.value);
                    }} />
                </Modal>
                <Select onChange={handleChangeStatus} className="w-50" defaultValue={'all'}>
                    <Select.Option value="all">All</Select.Option>
                    <Select.Option value="completed">Completed</Select.Option>
                    <Select.Option value="incomplete">Incomplete</Select.Option>
                </Select>
            </div>
            <div className="w-3/4 mx-auto p-4">
                <Table<TodoProps> columns={columns} dataSource={todosTemp} size="middle" />
            </div>

        </>
    )
}

export default Todo