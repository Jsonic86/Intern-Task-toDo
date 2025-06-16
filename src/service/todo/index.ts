import type { TodoProps } from "../../constant/todo.type";

const todos: TodoProps[] = [];

const getTodos = () => {
    const todos = localStorage.getItem('todos');
    if (todos) {
        return JSON.parse(todos);
    }
    return [];
};
const saveTodos = (newTodo: TodoProps) => {
    const todos: TodoProps[] = getTodos();
    todos.push(newTodo);
    localStorage.setItem('todos', JSON.stringify(todos));
}
const deleteTodo = (id: string) => {
    const todos: TodoProps[] = getTodos();
    const updatedTodos = todos.filter(todo => todo.id !== id);
    localStorage.setItem('todos', JSON.stringify(updatedTodos));
}
const getTodosByFiler = (filter: 'all' | 'completed' | 'incomplete') => {
    const todos: TodoProps[] = getTodos();
    if (filter === 'completed') {
        return todos.filter(todo => todo.completed);
    }
    if (filter === 'incomplete') {
        return todos.filter(todo => !todo.completed);
    }
    return todos;
};
const updateTodoStatus = (id: string) => {
    const todos: TodoProps[] = getTodos();
    const updatedTodos = todos.map(todo => {
        if (todo.id === id) {
            return { ...todo, completed: true };
        }
        return todo;
    });
    localStorage.setItem('todos', JSON.stringify(updatedTodos));
}
export const todoService = {
    getTodos,
    saveTodos,
    deleteTodo,
    getTodosByFiler,
    updateTodoStatus
}