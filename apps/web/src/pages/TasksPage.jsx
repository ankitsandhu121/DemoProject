import { useEffect, useState } from 'react';
import AddTaskForm from '../components/AddTaskForm';
import TaskList from '../components/TaskList';
import { addTask, deleteTask, fetchTasks, toggleTask } from '../api';
import { useAuth } from '../auth';

// Existing TaskFlow dashboard, moved behind the /tasks route. Behaviour is
// unchanged so the SCRUM-5 acceptance coverage keeps passing.
export default function TasksPage() {
  const { token } = useAuth();
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (token) fetchTasks(token).then(setTasks);
  }, [token]);

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
