// import type { TodoProps } from "../../constant/todo.type";

import { CustomAxios } from "../../ulti/customAxios";
import { handleAxiosError } from "../../ulti/handleAxiosError";

// const todos: TodoProps[] = [];

// const getTodos = () => {
//     const todos = localStorage.getItem('todos');
//     if (todos) {
//         return JSON.parse(todos);
//     }
//     return [];
// };
// const saveTodos = (newTodo: TodoProps) => {
//     const todos: TodoProps[] = getTodos();
//     todos.push(newTodo);
//     localStorage.setItem('todos', JSON.stringify(todos));
// }
// const deleteTodo = (id: string) => {
//     const todos: TodoProps[] = getTodos();
//     const updatedTodos = todos.filter(todo => todo.id !== id);
//     localStorage.setItem('todos', JSON.stringify(updatedTodos));
// }
// const getTodosByFiler = (filter: 'all' | 'completed' | 'incomplete') => {
//     const todos: TodoProps[] = getTodos();
//     if (filter === 'completed') {
//         return todos.filter(todo => todo.completed);
//     }
//     if (filter === 'incomplete') {
//         return todos.filter(todo => !todo.completed);
//     }
//     return todos;
// };
// const updateTodoStatus = (id: string) => {
//     const todos: TodoProps[] = getTodos();
//     const updatedTodos = todos.map(todo => {
//         if (todo.id === id) {
//             return { ...todo, completed: true };
//         }
//         return todo;
//     });
//     localStorage.setItem('todos', JSON.stringify(updatedTodos));
// }
const getTodos = async (search: boolean | undefined) => {
    try {
        if (search === undefined || search === null) {
            const data = await CustomAxios.get('/task');
            return data.data;
        }
        const data = await CustomAxios.get('/task?filterComplete=' + search);
        return data.data;
    }
    catch (error) {
        handleAxiosError(error);
    }
}
const saveTodos = async (newTodo: string) => {
    try {
        const data = await CustomAxios.post('/task', { title: newTodo });
        return data;
    } catch (error) {
        handleAxiosError(error)
    }
}
const deleteTodo = async (id: string) => {
    try {
        const data = await CustomAxios.delete(`/task/${id}`);
        return data;
    } catch (error) {
        handleAxiosError(error)
    }
}
const updateTodoStatus = async (id: string) => {
    try {
        const data = await CustomAxios.put(`/task/${id}`, { completed: true });
        return data;
    } catch (error) {
        handleAxiosError(error)
    }
}
export const todoService = {
    getTodos,
    saveTodos,
    deleteTodo,
    updateTodoStatus
}