import { createBrowserRouter } from 'react-router-dom';
import Todo from '../page/todo';
import TaskManager from '../page/task';

const router = createBrowserRouter([
    {
        path: '/',
        element: <Todo />
    }
])
export default router;