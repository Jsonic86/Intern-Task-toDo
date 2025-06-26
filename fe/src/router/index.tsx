import { createBrowserRouter } from 'react-router-dom';
import Todo from '../page/todo';

const router = createBrowserRouter([
    {
        path: '/',
        element: <Todo />
    }
])
export default router;