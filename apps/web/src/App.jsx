import { useEffect, useState } from 'react';
import LoginForm from './components/LoginForm';
import AddTaskForm from './components/AddTaskForm';
import TaskList from './components/TaskList';
import { addTask, deleteTask, fetchTasks, toggleTask } from './api';

export default function App() {
  const [token, setToken] = useState(null);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (token) fetchTasks(token).then(setTasks);
  }, [token]);

  if (!token) {
    return <LoginForm onLogin={setToken} />;
  }

  return (
    <div className="app" data-testid="dashboard">
      <h1>My tasks</h1>
      <AddTaskForm onAdd={async (title) => setTasks(await addTask(token, title))} />
      <TaskList
        tasks={tasks}
        onToggle={async (id) => setTasks(await toggleTask(token, id))}
        onDelete={async (id) => setTasks(await deleteTask(token, id))}
      />
    </div>
  );
}
